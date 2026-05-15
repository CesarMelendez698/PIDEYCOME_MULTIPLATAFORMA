import React, { useState, useContext, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, StyleSheet, 
  Modal, Alert, SafeAreaView, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export default function CajaScreen() {
  const { ordenes, usuario, setUsuario } = useContext(AppContext);
  
  // Estados de control
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFacturaVisible, setModalFacturaVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState('Tarjeta');
  const [tipoFiltro, setTipoFiltro] = useState('Comer Aquí');

  // Estados para el flujo de animación
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);

  // --- LÓGICA DE NEGOCIO ---
  const ventasDelDia = useMemo(() => 
    ordenes.filter(o => o.estado === 'Pagada').reduce((acc, o) => acc + parseFloat(o.total || 0), 0).toFixed(2), 
  [ordenes]);

  const ordenesFiltradas = useMemo(() => 
    ordenes.filter(o => 
      o.estado === 'En Caja' && 
      (tipoFiltro === 'Comer Aquí' ? o.mesa !== 'Para Llevar' : o.mesa === 'Para Llevar')
    ), 
  [ordenes, tipoFiltro]);

  const historialVentas = useMemo(() => 
    ordenes.filter(o => o.estado === 'Pagada').sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)),
  [ordenes]);

  // --- ACCIONES ---
  
  const ejecutarCobroFinal = async () => {
    setProcesandoPago(true);

    setTimeout(async () => {
      try {
        const ordenRef = doc(db, "ordenes", ordenSeleccionada.id);
        const fechaAhora = new Date().toISOString();
        
        await updateDoc(ordenRef, { 
          estado: 'Pagada',
          metodoPago: metodoPago,
          fechaPago: fechaAhora,
          responsableFinal: usuario?.nombre || 'Anderson'
        });

        if (ordenSeleccionada.idMesa) {
          const mesaRef = doc(db, "mesas", ordenSeleccionada.idMesa);
          await updateDoc(mesaRef, { estado: 'libre' });
        }

        setProcesandoPago(false);
        setPagoCompletado(true); 
      } catch (error) {
        setProcesandoPago(false);
        Alert.alert("Error", "No se pudo registrar el pago.");
      }
    }, 2000);
  };

  const cerrarModalYLimpiar = () => {
    setModalVisible(false);
    setPagoCompletado(false);
    setProcesandoPago(false);
    setOrdenSeleccionada(null);
  };

  const verFacturaHistorial = (orden) => {
    setOrdenSeleccionada(orden);
    setModalFacturaVisible(true);
  };

  const renderOrdenPendiente = (item) => (
    <View key={item.id} style={styles.cardItem}>
      <View style={styles.cardLeft}>
        <View style={styles.mesaBadge}><Text style={styles.mesaText}>{item.mesa.toUpperCase()}</Text></View>
        <Text style={styles.itemName}>{item.cliente}</Text>
        <Text style={styles.meseroText}>Mesero: {item.nombreMesero}</Text>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.itemPrice}>${parseFloat(item.total).toFixed(2)}</Text>
        <TouchableOpacity style={styles.payBtn} onPress={() => { setOrdenSeleccionada(item); setPagoCompletado(false); setModalVisible(true); }}>
          <Ionicons name="cash" size={18} color="white" />
          <Text style={styles.payBtnText}>Cobrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Caja Registradora</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{usuario?.nombre || 'Anderson'}</Text>
        </View>
        <TouchableOpacity onPress={() => setUsuario(null)} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
            <Text style={styles.statLabel}>TOTAL HOY</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>${ventasDelDia}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#FF6F00' }]}>
            <Text style={styles.statLabel}>POR COBRAR</Text>
            <Text style={[styles.statValue, { color: '#FF6F00' }]}>{ordenesFiltradas.length}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, tipoFiltro === 'Comer Aquí' && styles.tabActive]} onPress={() => setTipoFiltro('Comer Aquí')}>
            <Ionicons name="restaurant" size={18} color={tipoFiltro === 'Comer Aquí' ? '#FF6F00' : '#8E8E93'} />
            <Text style={[styles.tabText, tipoFiltro === 'Comer Aquí' && styles.tabTextActive]}>Mesas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tipoFiltro === 'Llevar' && styles.tabActive]} onPress={() => setTipoFiltro('Llevar')}>
            <Ionicons name="bag-handle" size={18} color={tipoFiltro === 'Llevar' ? '#FF6F00' : '#8E8E93'} />
            <Text style={[styles.tabText, tipoFiltro === 'Llevar' && styles.tabTextActive]}>Llevar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>PENDIENTES DE PAGO</Text>
        {ordenesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No hay órdenes pendientes</Text></View>
        ) : (
          ordenesFiltradas.map(renderOrdenPendiente)
        )}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>HISTORIAL RECIENTE (Toca para ver detalle)</Text>
        {historialVentas.map(item => (
          <TouchableOpacity key={item.id} style={styles.historyCard} onPress={() => verFacturaHistorial(item)}>
            <View>
              <Text style={styles.historyCliente}>{item.cliente}</Text>
              <Text style={styles.historySub}>{item.metodoPago} • {item.mesa}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Text style={styles.historyAmount}>${parseFloat(item.total).toFixed(2)}</Text>
               <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MODAL DE COBRO */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.facturaContent}>
            {!pagoCompletado ? (
              <>
                <View style={styles.facturaHeader}>
                  <Ionicons name="receipt-outline" size={30} color="#FF6F00" />
                  <Text style={styles.facturaTitle}>Detalle de Cuenta</Text>
                  <Text style={styles.facturaSubtitle}>Cliente: {ordenSeleccionada?.cliente}</Text>
                </View>
                <ScrollView style={{maxHeight: 200}} showsVerticalScrollIndicator={false}>
                  {ordenSeleccionada?.productos.map((p, i) => (
                    <View key={i} style={styles.facturaRow}>
                      <Text style={styles.facturaItem}>{p.cantidad}x {p.nombre}</Text>
                      <Text style={styles.facturaSubtotal}>${(p.cantidad * p.precio).toFixed(2)}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.facturaDivider} />
                <View style={[styles.facturaRow, {marginBottom: 20}]}>
                  <Text style={styles.facturaTotalLabel}>TOTAL A COBRAR</Text>
                  <Text style={styles.facturaTotalValue}>${ordenSeleccionada?.total}</Text>
                </View>
                {procesandoPago ? (
                  <View style={{padding: 20, alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#FF6F00" />
                    <Text style={{marginTop: 10, color: '#666', fontWeight: 'bold'}}>Procesando cobro...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.metodoRow}>
                      <TouchableOpacity style={[styles.metodoBtn, metodoPago === 'Tarjeta' && styles.metodoBtnActive]} onPress={() => setMetodoPago('Tarjeta')}>
                        <Ionicons name="card" size={18} color={metodoPago === 'Tarjeta' ? 'white' : '#666'} />
                        <Text style={{ color: metodoPago === 'Tarjeta' ? 'white' : '#666', marginLeft: 5, fontWeight: 'bold' }}>Tarjeta</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.metodoBtn, metodoPago === 'Efectivo' && styles.metodoBtnActive]} onPress={() => setMetodoPago('Efectivo')}>
                        <Ionicons name="cash" size={18} color={metodoPago === 'Efectivo' ? 'white' : '#666'} />
                        <Text style={{ color: metodoPago === 'Efectivo' ? 'white' : '#666', marginLeft: 5, fontWeight: 'bold' }}>Efectivo</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.confirmBtn} onPress={ejecutarCobroFinal}>
                      <Text style={styles.confirmBtnText}>FINALIZAR Y COBRAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setModalVisible(false)}>
                      <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>CANCELAR</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <View style={{alignItems: 'center', padding: 20}}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                <Text style={[styles.facturaTitle, {marginTop: 10}]}>¡Cobro Exitoso!</Text>
                <Text style={styles.facturaSubtitle}>Mesa liberada para servicio</Text>
                <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: '#4CAF50', width: '100%', marginTop: 30}]} onPress={cerrarModalYLimpiar}>
                  <Text style={styles.confirmBtnText}>TERMINAR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL FACTURA HISTORIAL (DETALLE COMPLETO) */}
      <Modal visible={modalFacturaVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.facturaContent}>
            <View style={styles.facturaHeader}>
              <Ionicons name="restaurant" size={30} color="#FF6F00" />
              <Text style={styles.facturaTitle}>PIDEYCOME</Text>
              <Text style={styles.facturaSubtitle}>Recibo de Pago Finalizado</Text>
            </View>
            
            <View style={styles.facturaBody}>
              <Text style={styles.facturaInfo}>Cliente: <Text style={{fontWeight: 'bold', color: '#333'}}>{ordenSeleccionada?.cliente}</Text></Text>
              <Text style={styles.facturaInfo}>Mesero: {ordenSeleccionada?.nombreMesero}</Text>
              <Text style={styles.facturaInfo}>Cajero: {ordenSeleccionada?.responsableFinal || 'Anderson'}</Text>
              <Text style={styles.facturaInfo}>Fecha: {ordenSeleccionada?.fechaPago ? new Date(ordenSeleccionada.fechaPago).toLocaleString() : 'N/A'}</Text>
              <Text style={styles.facturaInfo}>Método: {ordenSeleccionada?.metodoPago}</Text>
              
              <View style={styles.facturaDivider} />
              
              <ScrollView style={{maxHeight: 150}} showsVerticalScrollIndicator={false}>
                {ordenSeleccionada?.productos.map((p, i) => (
                  <View key={i} style={styles.facturaRow}>
                    <Text style={styles.facturaItem}>{p.cantidad}x {p.nombre}</Text>
                    <Text style={styles.facturaSubtotal}>${(p.cantidad * p.precio).toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.facturaDivider} />
              
              <View style={styles.facturaRow}>
                <Text style={styles.facturaTotalLabel}>TOTAL PAGADO</Text>
                <Text style={styles.facturaTotalValue}>${ordenSeleccionada?.total}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeFacturaBtn} onPress={() => setModalFacturaVisible(false)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>VOLVER AL HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 25, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase' },
  logoutBtn: { padding: 10, backgroundColor: '#FFF1F0', borderRadius: 12 },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: 'white', padding: 15, borderRadius: 18, width: '48%', borderLeftWidth: 5, elevation: 3 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },
  statValue: { fontSize: 20, fontWeight: '900' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 15, padding: 5, elevation: 2, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center' },
  tabActive: { backgroundColor: '#FFF5EE' },
  tabText: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold', marginLeft: 5 },
  tabTextActive: { color: '#FF6F00' },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 15, color: '#8E8E93', letterSpacing: 1 },
  cardItem: { backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardLeft: { flex: 1 },
  mesaBadge: { backgroundColor: '#F2F2F7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  mesaText: { fontSize: 10, fontWeight: 'bold', color: '#FF6F00' },
  itemName: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  meseroText: { fontSize: 11, color: '#8E8E93' },
  itemActions: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  payBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  payBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
  historyCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyCliente: { fontWeight: 'bold', color: '#1C1C1E' },
  historySub: { fontSize: 11, color: '#8E8E93' },
  historyAmount: { fontWeight: 'bold', color: '#4CAF50', marginRight: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  facturaContent: { backgroundColor: 'white', borderRadius: 25, padding: 25, shadowColor: '#000', elevation: 20 },
  facturaHeader: { alignItems: 'center', marginBottom: 20 },
  facturaTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  facturaSubtitle: { fontSize: 12, color: '#888' },
  facturaBody: { marginVertical: 5 },
  facturaInfo: { fontSize: 13, color: '#666', marginBottom: 2 },
  facturaDivider: { height: 1, backgroundColor: '#EEE', borderStyle: 'dashed', borderWidth: 1, marginVertical: 15, borderRadius: 1 },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  facturaItem: { fontSize: 14, color: '#333', flex: 1 },
  facturaSubtotal: { fontSize: 14, fontWeight: 'bold' },
  facturaTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  facturaTotalValue: { fontSize: 20, fontWeight: '900', color: '#FF6F00' },
  metodoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  metodoBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#EEE', borderRadius: 12, alignItems: 'center', marginHorizontal: 5, flexDirection: 'row', justifyContent: 'center' },
  metodoBtnActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  confirmBtn: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeFacturaBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#CCC' }
});