import React, { useState, useContext, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, StyleSheet, 
  Modal, TextInput, ScrollView, Alert, SafeAreaView 
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function CajaScreen() {
  const { ordenes, setOrdenes, usuario, setUsuario } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState('Tarjeta');
  const [pasoPago, setPasoPago] = useState(1);
  const [tipoFiltro, setTipoFiltro] = useState('Comer Aquí');

  // --- CÁLCULOS ---
  const ventasDelDia = useMemo(() => 
    ordenes.filter(o => o.pagada).reduce((acc, o) => acc + parseFloat(o.total), 0).toFixed(2), 
  [ordenes]);

  const totalPagadas = useMemo(() => ordenes.filter(o => o.pagada).length, [ordenes]);
  const totalPendientes = useMemo(() => ordenes.filter(o => !o.pagada).length, [ordenes]);

  const ordenesFiltradas = useMemo(() => 
    ordenes.filter(o => !o.pagada && o.mesa === (tipoFiltro === 'Comer Aquí' ? 'Mesa 1' : 'Para Llevar')), 
  [ordenes, tipoFiltro]);

  // --- ACCIONES ---
  const finalizarPago = () => {
    setOrdenes(prev => prev.map(o => 
      o.id === ordenSeleccionada.id ? { ...o, pagada: true } : o
    ));
    setModalVisible(false);
    setOrdenSeleccionada(null);
    Alert.alert("Éxito", "Cobro registrado correctamente");
  };

  const renderOrdenPendiente = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderInfo}>
        <View style={styles.mesaBadge}>
          <Text style={styles.mesaText}>{item.mesa}</Text>
        </View>
        <Text style={styles.clienteText}>Cliente: {item.cliente}</Text>
        <View style={styles.itemList}>
          {item.productos.map((p, index) => (
            <Text key={index} style={styles.productRow}>{p.cantidad}x {p.nombre}</Text>
          ))}
        </View>
      </View>
      <View style={styles.orderAction}>
        <Text style={styles.totalAmount}>${item.total}</Text>
        <TouchableOpacity 
          style={styles.payButton} 
          onPress={() => { setOrdenSeleccionada(item); setPasoPago(1); setModalVisible(true); }}
        >
          <Ionicons name="cash-outline" size={18} color="white" />
          <Text style={styles.payButtonText}> Cobrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><Ionicons name="wallet-outline" size={24} color="white" /></View>
          <View>
            <Text style={styles.headerTitle}>Caja Registradora</Text>
            <Text style={styles.headerSubtitle}>Usuario: {usuario?.nombre || 'Cajera 1'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setUsuario(null)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CARDS DE RESUMEN (Estilo tarjetas de Mesero) */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderBottomColor: '#4CAF50' }]}>
            <Text style={styles.summaryLabel}>Ventas Hoy</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>${ventasDelDia}</Text>
          </View>
          <View style={[styles.summaryCard, { borderBottomColor: '#2196F3' }]}>
            <Text style={styles.summaryLabel}>Pagadas</Text>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>{totalPagadas}</Text>
          </View>
          <View style={[styles.summaryCard, { borderBottomColor: '#FF6F00' }]}>
            <Text style={styles.summaryLabel}>Pendientes</Text>
            <Text style={[styles.summaryValue, { color: '#FF6F00' }]}>{totalPendientes}</Text>
          </View>
        </View>

        {/* FILTRO TIPO ORDEN (Igual al de Mesero) */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterBtn, tipoFiltro === 'Comer Aquí' && styles.filterBtnActive]}
            onPress={() => setTipoFiltro('Comer Aquí')}
          >
            <Text style={[styles.filterBtnText, tipoFiltro === 'Comer Aquí' && styles.filterBtnTextActive]}>Mesa 1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, tipoFiltro === 'Llevar' && styles.filterBtnActive]}
            onPress={() => setTipoFiltro('Llevar')}
          >
            <Text style={[styles.filterBtnText, tipoFiltro === 'Llevar' && styles.filterBtnTextActive]}>Llevar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Órdenes por Cobrar</Text>
        
        {ordenesFiltradas.length === 0 ? (
          <Text style={styles.emptyText}>No hay órdenes pendientes en este sector.</Text>
        ) : (
          ordenesFiltradas.map(item => (
            <View key={item.id}>{renderOrdenPendiente({ item })}</View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* MODAL PROCESAR PAGO (Estilo corregido) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {pasoPago === 1 && (
              <>
                <Text style={styles.modalTitle}>Finalizar Cobro</Text>
                <Text style={styles.modalSubtitle}>{ordenSeleccionada?.mesa} - {ordenSeleccionada?.cliente}</Text>
                
                <Text style={styles.modalLabel}>Método de Pago</Text>
                <View style={styles.metodoRow}>
                  <TouchableOpacity 
                    style={[styles.metodoBtn, metodoPago === 'Tarjeta' && styles.metodoBtnActive]}
                    onPress={() => setMetodoPago('Tarjeta')}
                  >
                    <Ionicons name="card-outline" size={20} color={metodoPago === 'Tarjeta' ? 'white' : '#666'} />
                    <Text style={[styles.metodoTxt, { color: metodoPago === 'Tarjeta' ? 'white' : '#666' }]}> Tarjeta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.metodoBtn, metodoPago === 'Efectivo' && styles.metodoBtnActive]}
                    onPress={() => setMetodoPago('Efectivo')}
                  >
                    <Ionicons name="cash-outline" size={20} color={metodoPago === 'Efectivo' ? 'white' : '#666'} />
                    <Text style={[styles.metodoTxt, { color: metodoPago === 'Efectivo' ? 'white' : '#666' }]}> Efectivo</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.totalModalRow}>
                  <Text style={styles.totalModalLabel}>Total:</Text>
                  <Text style={styles.totalModalValue}>${ordenSeleccionada?.total}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}><Text style={{color: '#888'}}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.btnConfirm} onPress={() => setPasoPago(2)}><Text style={{color:'white', fontWeight:'bold'}}>Confirmar Pago</Text></TouchableOpacity>
                </View>
              </>
            )}

            {pasoPago === 2 && (
              <View style={styles.statusView}>
                <Ionicons name="sync-circle-outline" size={80} color="#FF6F00" />
                <Text style={styles.statusTitle}>Procesando...</Text>
                <TouchableOpacity style={styles.btnSuccess} onPress={finalizarPago}><Text style={{color:'white', fontWeight:'bold'}}>Finalizar</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  header: { 
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, 
    backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#EEE', elevation: 3
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { backgroundColor: '#FF6F00', padding: 8, borderRadius: 10, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#888' },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: '#FFF1F0' },
  logoutText: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold' },

  summaryRow: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  summaryCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, width: '31%', elevation: 2, borderBottomWidth: 3 },
  summaryLabel: { fontSize: 10, color: '#888', marginBottom: 5, fontWeight: 'bold' },
  summaryValue: { fontSize: 16, fontWeight: '900' },

  filterContainer: { flexDirection: 'row', marginHorizontal: 15, backgroundColor: '#E2E8F0', borderRadius: 10, padding: 4, marginBottom: 15 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: 'white', elevation: 2 },
  filterBtnText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterBtnTextActive: { color: '#FF6F00', fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15, color: '#444' },
  orderCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginHorizontal: 15, marginBottom: 12, flexDirection: 'row', elevation: 3, borderLeftWidth: 5, borderLeftColor: '#FF6F00' },
  orderInfo: { flex: 1 },
  mesaBadge: { backgroundColor: '#F0F4F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  mesaText: { color: '#333', fontWeight: 'bold', fontSize: 11 },
  clienteText: { fontWeight: 'bold', color: '#FF6F00', fontSize: 14 },
  itemList: { marginTop: 8 },
  productRow: { fontSize: 12, color: '#777' },

  orderAction: { alignItems: 'flex-end', justifyContent: 'center' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#333', marginBottom: 10 },
  payButton: { backgroundColor: '#4CAF50', flexDirection: 'row', padding: 10, borderRadius: 10, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { color: '#888', marginBottom: 20, fontSize: 13 },
  modalLabel: { fontWeight: 'bold', marginBottom: 10, color: '#666' },
  metodoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metodoBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', marginHorizontal: 5 },
  metodoBtnActive: { backgroundColor: '#333', borderColor: '#333' },
  metodoTxt: { fontWeight: 'bold', fontSize: 13 },
  totalModalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#EEE' },
  totalModalLabel: { fontSize: 16, color: '#888', fontWeight: 'bold' },
  totalModalValue: { fontSize: 26, fontWeight: '900', color: '#FF6F00' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  btnCancel: { padding: 10 },
  btnConfirm: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center', marginLeft: 15 },

  statusView: { alignItems: 'center', paddingVertical: 20 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#333' },
  btnSuccess: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 25 },
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 30, fontSize: 14 }
});