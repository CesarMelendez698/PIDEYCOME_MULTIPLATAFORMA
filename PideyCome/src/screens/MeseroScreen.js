import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function MeseroScreen() {
  const { productos, crearOrden, ordenes, setOrdenes, usuario, setUsuario } = useContext(AppContext);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [tipoOrden, setTipoOrden] = useState('Comer Aquí');
  const [verMisOrdenes, setVerMisOrdenes] = useState(false);
  const [notificacion, setNotificacion] = useState(false);

  // Monitor de notificaciones
  useEffect(() => {
    const hayDespachadas = ordenes.some(o => o.estado === 'Despachada');
    if (hayDespachadas && !verMisOrdenes) {
      setNotificacion(true);
    }
  }, [ordenes]);

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const formularioValido = useMemo(() => {
    return cliente.trim().length >= 3 && carrito.length > 0;
  }, [cliente, carrito]);

  const handleEnviar = () => {
    if (!formularioValido) {
      Alert.alert("Campos requeridos", "Por favor ingresa el nombre del cliente y agrega al menos un producto.");
      return;
    }
    
    crearOrden({ 
      cliente: cliente.trim(), 
      mesa: tipoOrden === 'Comer Aquí' ? "Mesa 1" : "Para Llevar", 
      tipoOrden,
      productos: carrito, 
      total: totalOrden, 
      estado: 'Ordenada' 
    });

    setCarrito([]); 
    setCliente('');
    Alert.alert("Éxito", "Orden enviada a cocina");
  };

  const handleEntregada = (id) => {
    Alert.alert("Confirmar", "¿La orden ha sido entregada al cliente?", [
      { text: "No" },
      { text: "Sí, Entregada", onPress: () => {
        setOrdenes(prev => prev.filter(o => o.id !== id));
        if (ordenes.length <= 1) setNotificacion(false);
      }}
    ]);
  };

  const totalOrden = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2);
  }, [carrito]);

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Ordenada': return { color: '#FFB300', bg: '#FFF8E1' };
      case 'Recibida': return { color: '#2196F3', bg: '#E3F2FD' };
      case 'Preparando': return { color: '#FF6F00', bg: '#FFF3E0' };
      case 'Despachada': return { color: '#4CAF50', bg: '#E8F5E9' };
      default: return { color: '#666', bg: '#F5F5F5' };
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.miniLogo}><Ionicons name="restaurant" size={15} color="white" /></View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>Panel del Mesero</Text>
              <Text style={styles.headerUser}>Mesero: {usuario?.nombre}</Text>
            </View>
          </View>
          {/* BOTÓN CERRAR SESIÓN ACTUALIZADO */}
          <TouchableOpacity onPress={() => setUsuario(null)} style={styles.logout}>
            <Ionicons name="log-out-outline" size={14} color="#FF3B30" style={{marginRight: 4}} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, !verMisOrdenes && styles.tabActive]} 
            onPress={() => setVerMisOrdenes(false)}
          >
            <Ionicons name="fast-food-outline" size={18} color={!verMisOrdenes ? '#FF6F00' : '#666'} />
            <Text style={[styles.tabText, !verMisOrdenes && styles.tabTextActive]}>Nueva Orden</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, verMisOrdenes && styles.tabActive]} 
            onPress={() => { setVerMisOrdenes(true); setNotificacion(false); }}
          >
            <View>
                <Ionicons name="list-outline" size={18} color={verMisOrdenes ? '#FF6F00' : '#666'} />
                {notificacion && <View style={styles.dotNotif} />}
            </View>
            <Text style={[styles.tabText, verMisOrdenes && styles.tabTextActive]}>Mis Órdenes ({ordenes.length})</Text>
          </TouchableOpacity>
        </View>

        {!verMisOrdenes ? (
          <>
            <View style={styles.menuSection}>
              <Text style={styles.title}>Menú</Text>
              <FlatList
                data={productos}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.pCard}>
                    <Text style={styles.pName}>{item.nombre}</Text>
                    <Text style={styles.pPrice}>${item.precio.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => agregarAlCarrito(item)} style={styles.pBtn}>
                      <Text style={styles.pBtnText}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <View style={styles.cartCard}>
              <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>Orden Actual</Text>
                <Text style={styles.cartTotal}>${totalOrden}</Text>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={[styles.optionBtn, tipoOrden === 'Comer Aquí' && styles.optionSelected]} onPress={() => setTipoOrden('Comer Aquí')}>
                  <Text style={[styles.optionText, tipoOrden === 'Comer Aquí' && styles.optionTextActive]}>Comer Aquí</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionBtn, tipoOrden === 'Llevar' && styles.optionSelected]} onPress={() => setTipoOrden('Llevar')}>
                  <Text style={[styles.optionText, tipoOrden === 'Llevar' && styles.optionTextActive]}>Para Llevar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput 
                  placeholder="Nombre del Cliente (Obligatorio)" 
                  style={[styles.cInput, cliente.trim().length < 3 && cliente.length > 0 && styles.inputError]} 
                  value={cliente} 
                  onChangeText={setCliente} 
                />
                {cliente.trim().length < 3 && cliente.length > 0 && <Text style={styles.errorText}>Mínimo 3 caracteres</Text>}
              </View>

              <ScrollView style={{ flex: 1 }}>
                {carrito.map(item => (
                  <View key={item.id} style={styles.cItem}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cItemText}>{item.nombre} x{item.cantidad}</Text>
                        <Text style={styles.cItemSub}>${(item.precio * item.cantidad).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => eliminarDelCarrito(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                onPress={handleEnviar} 
                disabled={!formularioValido}
                style={[styles.sendBtn, !formularioValido && styles.sendBtnDisabled]}
              >
                <Text style={styles.sendBtnText}>Enviar a Cocina</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ScrollView style={styles.orderListContainer}>
            <Text style={styles.title}>Estado de Órdenes</Text>
            {ordenes.length === 0 ? (
                <Text style={styles.emptyText}>No hay órdenes pendientes.</Text>
            ) : (
                ordenes.map((ord) => {
                    const style = getEstadoStyle(ord.estado);
                    return (
                        <View key={ord.id} style={styles.orderItemCard}>
                            <View style={styles.orderItemHeader}>
                                <Text style={styles.orderMesa}>{ord.mesa}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                                    <Text style={[styles.statusBadgeText, { color: style.color }]}>{ord.estado}</Text>
                                </View>
                            </View>
                            <Text style={styles.orderCliente}>Cliente: {ord.cliente}</Text>
                            <Text style={styles.orderTotal}>Total: ${ord.total}</Text>
                            
                            {ord.estado === 'Despachada' && (
                                <TouchableOpacity 
                                    style={styles.btnEntregada}
                                    onPress={() => handleEntregada(ord.id)}
                                >
                                    <Ionicons name="checkmark-done" size={18} color="white" />
                                    <Text style={styles.btnEntregadaText}>Marcar como Entregada</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                })
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9', paddingTop: 40 },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  miniLogo: { backgroundColor: '#FF6F00', padding: 8, borderRadius: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  headerUser: { fontSize: 12, color: '#888' },
  logout: { padding: 8, borderRadius: 5, backgroundColor: '#FFF1F0', flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 11 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabButton: { flex: 1, flexDirection: 'row', padding: 15, justifyContent: 'center', alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#FF6F00' },
  tabText: { marginLeft: 8, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#FF6F00' },
  dotNotif: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6F00', borderWidth: 2, borderColor: 'white' },
  menuSection: { flex: 1, padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 15 },
  pCard: { flex: 1, backgroundColor: 'white', margin: 5, padding: 12, borderRadius: 12, elevation: 1 },
  pName: { fontWeight: 'bold', fontSize: 13 },
  pPrice: { color: '#FF6F00', fontWeight: '900', marginVertical: 5 },
  pBtn: { backgroundColor: '#FF6F00', padding: 8, borderRadius: 6, alignItems: 'center' },
  pBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  cartCard: { flex: 1, backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 20, elevation: 10 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cartTitle: { fontWeight: 'bold', fontSize: 18 },
  cartTotal: { color: '#FF6F00', fontWeight: '900', fontSize: 18 },
  optionsContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 4, marginBottom: 10 },
  optionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  optionSelected: { backgroundColor: 'white', elevation: 2 },
  optionText: { color: '#666', fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: '#FF6F00' },
  inputWrapper: { marginBottom: 10 },
  cInput: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  inputError: { borderColor: '#FF3B30' },
  errorText: { color: '#FF3B30', fontSize: 10, marginTop: 2, marginLeft: 5 },
  cItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  cItemText: { fontSize: 13, color: '#444' },
  cItemSub: { fontSize: 12, color: '#999' },
  sendBtn: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  sendBtnDisabled: { backgroundColor: '#CCCCCC' },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  orderListContainer: { flex: 1, padding: 15 },
  orderItemCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  orderItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMesa: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  orderCliente: { color: '#666', marginTop: 5 },
  orderTotal: { fontWeight: 'bold', color: '#FF6F00', marginTop: 5 },
  btnEntregada: { backgroundColor: '#4CAF50', flexDirection: 'row', padding: 10, borderRadius: 10, marginTop: 12, justifyContent: 'center', alignItems: 'center' },
  btnEntregadaText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});