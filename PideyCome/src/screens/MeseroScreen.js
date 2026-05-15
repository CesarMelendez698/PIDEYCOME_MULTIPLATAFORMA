import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function MeseroScreen() {
  // --- CONTEXTO Y ESTADOS GLOBALES ---
  const { productos, crearOrden, ordenes, usuario, setUsuario } = useContext(AppContext);
  const [seccion, setSeccion] = useState('nueva'); 
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [tipoOrden, setTipoOrden] = useState('Comer Aquí'); 
  const [mesas, setMesas] = useState([]); 
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  // --- ESTADOS DE PAGO Y FACTURACIÓN ---
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [ordenAPagar, setOrdenParaPagar] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false); 
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('Efectivo');

  const categorias = ["entradas", "plato fuerte", "bebidas", "postres"];

  // --- 1. CARGA DE MESAS REAL-TIME (Sincronización total) ---
  useEffect(() => {
    const q = query(collection(db, "mesas"), orderBy("numero", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Este listener hace que si el Cajero libera una mesa, aquí se vea libre de inmediato
      setMesas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // --- 2. LÓGICA DE CARRITO ---
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const totalOrden = useMemo(() => carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2), [carrito]);

  const formularioValido = useMemo(() => {
    const base = cliente.trim().length >= 3 && carrito.length > 0;
    return tipoOrden === 'Comer Aquí' ? base && mesaSeleccionada !== null : base;
  }, [cliente, carrito, mesaSeleccionada, tipoOrden]);

  // --- 3. ACCIONES FIREBASE ---

  const handleEnviarCocina = async () => {
    try {
      const esComerAqui = tipoOrden === 'Comer Aquí';
      await crearOrden({ 
        cliente: cliente.trim(), 
        mesa: esComerAqui ? `Mesa ${mesaSeleccionada}` : "Para Llevar", 
        idMesa: esComerAqui ? mesaSeleccionada.toString() : null,
        tipoOrden, productos: carrito, total: totalOrden, estado: 'Ordenada',
        fechaCreacion: new Date(), nombreMesero: usuario?.nombre || 'Mesero'
      });
      // Ocupar mesa
      if (esComerAqui) await updateDoc(doc(db, "mesas", mesaSeleccionada.toString()), { estado: 'ocupada' });
      setCarrito([]); setCliente(''); setMesaSeleccionada(null);
      Alert.alert("Éxito", "Pedido enviado a cocina");
    } catch (e) { Alert.alert("Error", "Fallo al conectar"); }
  };

  const enviarACaja = async (id) => {
    try {
      await updateDoc(doc(db, "ordenes", id), { estado: 'En Caja' });
      Alert.alert("Enviado", "La orden ya está en el panel de Caja.");
    } catch (error) { Alert.alert("Error", "No se pudo enviar."); }
  };

  // --- 4. FLUJO DE COBRO SIMULADO ---
  const ejecutarCobroFinal = async () => {
    setProcesandoPago(true);
    
    setTimeout(async () => {
      try {
        // Actualizar Orden
        await updateDoc(doc(db, "ordenes", ordenAPagar.id), { 
          estado: 'Pagada', 
          metodoPago: `${metodoSeleccionado} (Mesero)`,
          fechaPago: new Date().toISOString() 
        });
        
        // --- LIBERAR MESA AUTOMÁTICAMENTE ---
        if (ordenAPagar.idMesa) {
          await updateDoc(doc(db, "mesas", ordenAPagar.idMesa), { estado: 'libre' });
        }

        setProcesandoPago(false);
        setPagoCompletado(true); 
      } catch (e) {
        setProcesandoPago(false);
        Alert.alert("Error", "No se pudo procesar el pago.");
      }
    }, 2000); 
  };

  const cerrarTodoElPago = () => {
    setModalPagoVisible(false);
    setPagoCompletado(false);
    setProcesandoPago(false);
    setOrdenParaPagar(null);
  };

  // Filtrar órdenes que solo le pertenecen al mesero actual
  const misOrdenesActivas = useMemo(() => 
    ordenes.filter(o => 
      ['Ordenada', 'Recibida', 'Preparando', 'Despachada'].includes(o.estado) && 
      o.nombreMesero === usuario?.nombre
    ), [ordenes, usuario]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>Bienvenido mesero,</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{usuario?.nombre || 'Mesero'}</Text>
          </View>
          <TouchableOpacity onPress={() => setUsuario(null)} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, seccion === 'nueva' && styles.tabActive]} onPress={() => setSeccion('nueva')}>
            <Ionicons name="add-circle" size={22} color={seccion === 'nueva' ? '#FF6F00' : '#8E8E93'} />
            <Text style={[styles.tabText, seccion === 'nueva' && styles.tabTextActive]}>Nueva Orden</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, seccion === 'activas' && styles.tabActive]} onPress={() => setSeccion('activas')}>
            <Ionicons name="list" size={22} color={seccion === 'activas' ? '#FF6F00' : '#8E8E93'} />
            <Text style={[styles.tabText, seccion === 'activas' && styles.tabTextActive]}>Mis Órdenes</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: carrito.length > 0 ? 320 : 50 }}>
          {seccion === 'nueva' ? (
            <View>
              <View style={styles.configCard}>
                 <View style={styles.tipoRow}>
                    <TouchableOpacity style={[styles.tipoBtn, tipoOrden === 'Comer Aquí' && styles.tipoBtnActive]} onPress={() => setTipoOrden('Comer Aquí')}>
                      <Text style={[styles.tipoBtnText, tipoOrden === 'Comer Aquí' && {color: 'white'}]}>Mesa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tipoBtn, tipoOrden === 'Para Llevar' && styles.tipoBtnActive]} onPress={() => { setTipoOrden('Para Llevar'); setMesaSeleccionada(null); }}>
                      <Text style={[styles.tipoBtnText, tipoOrden === 'Para Llevar' && {color: 'white'}]}>Llevar</Text>
                    </TouchableOpacity>
                 </View>
                 {tipoOrden === 'Comer Aquí' && (
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 15}}>
                      {mesas.map((m) => (
                        <TouchableOpacity key={m.id} disabled={m.estado === 'ocupada'} onPress={() => setMesaSeleccionada(m.numero)}
                          style={[styles.mesaBox, m.estado === 'ocupada' ? styles.mesaOcupada : mesaSeleccionada === m.numero ? styles.mesaSelected : styles.mesaLibre]}
                        >
                          <Text style={[styles.mesaText, mesaSeleccionada === m.numero && {color: 'white'}]}>{m.numero}</Text>
                        </TouchableOpacity>
                      ))}
                   </ScrollView>
                 )}
              </View>

              {categorias.map((cat) => {
                const filtrados = productos.filter(p => p.categoria.toLowerCase() === cat);
                if (filtrados.length === 0) return null;
                return (
                  <View key={cat} style={{marginBottom: 20}}>
                    <Text style={[styles.sectionTitle, {color: '#FF6F00'}]}>{cat.toUpperCase()}</Text>
                    {filtrados.map((prod) => (
                      <View key={prod.id} style={styles.cardItem}>
                        <View style={styles.cardLeft}>
                          <Text style={styles.itemName}>{prod.nombre}</Text>
                          <Text style={styles.itemPrice}>${parseFloat(prod.precio).toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => agregarAlCarrito(prod)} style={styles.actionBtn}>
                          <Ionicons name="add" size={22} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>MIS PEDIDOS ACTIVOS</Text>
              {misOrdenesActivas.map(ord => (
                <View key={ord.id} style={styles.cardItemActiva}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.itemName}>{ord.cliente}</Text>
                    <Text style={{fontSize: 12, color: '#FF6F00', fontWeight: 'bold'}}>{ord.mesa.toUpperCase()}</Text>
                    <Text style={{fontSize: 11, color: '#8E8E93', marginTop: 4}}>{ord.estado}</Text>
                  </View>
                  
                  {ord.estado === 'Despachada' ? (
                    <View style={styles.actionGroup}>
                      <TouchableOpacity style={[styles.btnMini, {backgroundColor: '#2196F3'}]} onPress={() => enviarACaja(ord.id)}>
                        <Ionicons name="wallet-outline" size={16} color="white" />
                        <Text style={styles.btnMiniText}>Caja</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnMini, {backgroundColor: '#4CAF50'}]} onPress={() => { setOrdenParaPagar(ord); setPagoCompletado(false); setModalPagoVisible(true); }}>
                        <Ionicons name="cash-outline" size={16} color="white" />
                        <Text style={styles.btnMiniText}>Cobrar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={{fontWeight: 'bold', color: '#CCC'}}>En proceso...</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* FOOTER CARRITO */}
        {carrito.length > 0 && seccion === 'nueva' && (
          <View style={styles.footerCart}>
            <View style={styles.cartHeaderRow}>
               <Text style={styles.resumenTitle}>ORDEN : {tipoOrden === 'Comer Aquí' ? `MESA #${mesaSeleccionada || '?'}` : 'PARA LLEVAR'}</Text>
               <Ionicons name="cart-outline" size={20} color="#FF6F00" />
            </View>
            <ScrollView style={styles.miniCarrito} nestedScrollEnabled={true}>
              {carrito.map(item => (
                <View key={item.id} style={styles.carritoItem}>
                  <Text style={styles.carritoText}>{item.cantidad}x {item.nombre}</Text>
                  <TouchableOpacity onPress={() => eliminarDelCarrito(item.id)}>
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TextInput placeholder="Nombre del Cliente..." style={styles.cInput} value={cliente} onChangeText={setCliente} placeholderTextColor="#999" />
            <TouchableOpacity onPress={handleEnviarCocina} disabled={!formularioValido} style={[styles.sendBtn, !formularioValido && {backgroundColor: '#CCC'}]}>
              <Text style={styles.sendBtnText}>Enviar a Cocina • ${totalOrden}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* MODAL COBRO */}
      <Modal visible={modalPagoVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.facturaContent}>
            {!pagoCompletado ? (
              <>
                <View style={styles.facturaHeader}>
                  <Ionicons name="receipt-outline" size={30} color="#FF6F00" />
                  <Text style={styles.facturaTitle}>Detalle de Cuenta</Text>
                  <Text style={styles.facturaSubtitle}>Cliente: {ordenAPagar?.cliente}</Text>
                </View>
                <ScrollView style={{maxHeight: 180}} showsVerticalScrollIndicator={false}>
                  {ordenAPagar?.productos.map((p, i) => (
                    <View key={i} style={styles.facturaRow}>
                      <Text style={styles.facturaItem}>{p.cantidad}x {p.nombre}</Text>
                      <Text style={styles.facturaSubtotal}>${(p.cantidad * p.precio).toFixed(2)}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.facturaDivider} />
                <View style={styles.totalBoxPago}>
                  <Text style={styles.totalLabelPago}>TOTAL A PAGAR</Text>
                  <Text style={styles.totalValuePago}>${ordenAPagar?.total}</Text>
                </View>
                {procesandoPago ? (
                  <View style={{padding: 20, alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#FF6F00" />
                    <Text style={{marginTop: 10, color: '#666', fontWeight: 'bold'}}>Procesando cobro...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.metodoRow}>
                      <TouchableOpacity style={[styles.metodoBtn, metodoSeleccionado === 'Tarjeta' && styles.metodoBtnActive]} onPress={() => setMetodoSeleccionado('Tarjeta')}>
                        <Ionicons name="card" size={18} color={metodoSeleccionado === 'Tarjeta' ? 'white' : '#666'} />
                        <Text style={{ color: metodoSeleccionado === 'Tarjeta' ? 'white' : '#666', marginLeft: 5, fontWeight: 'bold' }}>Tarjeta</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.metodoBtn, metodoSeleccionado === 'Efectivo' && styles.metodoBtnActive]} onPress={() => setMetodoSeleccionado('Efectivo')}>
                        <Ionicons name="cash" size={18} color={metodoSeleccionado === 'Efectivo' ? 'white' : '#666'} />
                        <Text style={{ color: metodoSeleccionado === 'Efectivo' ? 'white' : '#666', marginLeft: 5, fontWeight: 'bold' }}>Efectivo</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.confirmBtnPago} onPress={ejecutarCobroFinal}>
                      <Text style={styles.confirmBtnTextPago}>CONFIRMAR Y COBRAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setModalPagoVisible(false)}>
                      <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>CANCELAR</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <View style={styles.reciboTicket}>
                <View style={styles.facturaHeader}>
                  <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  <Text style={styles.reciboEmpresa}>PIDEYCOME</Text>
                  <Text style={styles.reciboSub}>Pago realizado con éxito</Text>
                </View>
                <View style={styles.reciboBody}>
                  <Text style={styles.reciboInfo}>Cliente: {ordenAPagar?.cliente}</Text>
                  <Text style={styles.reciboInfo}>Mesa: {ordenAPagar?.mesa}</Text>
                  <View style={styles.reciboDivider} />
                  <View style={styles.reciboRowTotal}>
                    <Text style={styles.reciboTotalLabel}>TOTAL</Text>
                    <Text style={styles.reciboTotalValue}>${ordenAPagar?.total}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.btnFinalizarTodo} onPress={cerrarTodoElPago}>
                   <Text style={styles.btnFinalizarText}>FINALIZAR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 25, paddingHorizontal: 25, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' }, 
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#FFF1F0', borderRadius: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', marginTop: 15, marginHorizontal: 25, borderRadius: 15, padding: 5, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFF5EE' },
  tabText: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { color: '#FF6F00', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 25, marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, color: '#3A3A3C', letterSpacing: 1 },
  configCard: { backgroundColor: 'white', padding: 15, borderRadius: 18, marginBottom: 25, elevation: 2 },
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoBtn: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F7', alignItems: 'center' },
  tipoBtnActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  tipoBtnText: { fontWeight: 'bold', color: '#8E8E93', fontSize: 12 },
  mesaBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1 },
  mesaLibre: { backgroundColor: 'white', borderColor: '#FF6F00' },
  mesaOcupada: { backgroundColor: '#F2F2F7', borderColor: '#EEE' },
  mesaSelected: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  mesaText: { fontWeight: 'bold', color: '#FF6F00' },
  cardItem: { backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardItemActiva: { backgroundColor: 'white', padding: 15, borderRadius: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, borderLeftWidth: 4, borderLeftColor: '#FF6F00' },
  cardLeft: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  itemPrice: { fontSize: 14, color: '#FF6F00', fontWeight: 'bold' },
  actionBtn: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 10 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  btnMini: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, elevation: 1 },
  btnMiniText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  footerCart: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 25 },
  cartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resumenTitle: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  miniCarrito: { maxHeight: 80, marginBottom: 15 },
  carritoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  carritoText: { fontSize: 13, color: '#555' },
  cInput: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12, marginBottom: 12, fontSize: 14, color: '#333' },
  sendBtn: { backgroundColor: '#FF6F00', padding: 16, borderRadius: 15, alignItems: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  facturaContent: { backgroundColor: 'white', borderRadius: 25, padding: 25, shadowColor: '#000', elevation: 20 },
  facturaHeader: { alignItems: 'center', marginBottom: 20 },
  facturaTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  facturaSubtitle: { fontSize: 12, color: '#8E8E93' },
  facturaDivider: { height: 1, backgroundColor: '#EEE', borderStyle: 'dashed', borderWidth: 1, marginVertical: 15, borderRadius: 1 },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  facturaItem: { fontSize: 14, color: '#333', flex: 1 },
  facturaSubtotal: { fontSize: 14, fontWeight: 'bold' },
  totalBoxPago: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  totalLabelPago: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold' },
  totalValuePago: { fontSize: 26, fontWeight: 'bold', color: '#FF6F00' },
  metodoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metodoBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#EEE', borderRadius: 12, alignItems: 'center', marginHorizontal: 5, flexDirection: 'row', justifyContent: 'center' },
  metodoBtnActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  confirmBtnPago: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnTextPago: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reciboTicket: { padding: 10, alignItems: 'center' },
  reciboEmpresa: { fontSize: 22, fontWeight: '900', color: '#333', letterSpacing: 2, marginTop: 10 },
  reciboSub: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },
  reciboBody: { width: '100%', marginVertical: 15 },
  reciboInfo: { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 4 },
  reciboRowTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  reciboTotalLabel: { fontSize: 18, fontWeight: '900', color: '#000' },
  reciboTotalValue: { fontSize: 20, fontWeight: '900', color: '#FF6F00' },
  reciboMetodo: { textAlign: 'center', marginTop: 20, fontSize: 11, color: '#AAA', fontStyle: 'italic' },
  btnFinalizarTodo: { backgroundColor: '#4CAF50', width: '100%', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnFinalizarText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});