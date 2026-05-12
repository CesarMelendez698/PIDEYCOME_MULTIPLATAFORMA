import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function CocinaScreen() {
  const { ordenes, setOrdenes, usuario, setUsuario } = useContext(AppContext);

  // Filtrar para no mostrar las órdenes que ya fueron despachadas (opcional)
  const ordenesActivas = ordenes.filter(o => o.estado !== 'Despachada');

  const cambiarEstado = (id) => {
    const nuevas = ordenes.map(o => {
      if (o.id === id) {
        if (o.estado === 'Ordenada') return { ...o, estado: 'Recibida' };
        if (o.estado === 'Recibida') return { ...o, estado: 'Preparando' };
        if (o.estado === 'Preparando') return { ...o, estado: 'Despachada' };
      }
      return o;
    });
    setOrdenes(nuevas);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas salir del sistema de cocina?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", onPress: () => setUsuario(null) }
    ]);
  };

  const renderOrden = ({ item }) => {
    // Configuración dinámica según el estado de la imagen
    let config = { 
      label: 'Ordenada', 
      btnText: 'Recibir Orden', 
      color: '#FFB300', 
      btnColor: '#2196F3', 
      icon: 'notifications-outline' 
    };

    if (item.estado === 'Recibida') {
      config = { label: 'Recibida por Cocina', btnText: 'Iniciar Preparación', color: '#2196F3', btnColor: '#FF6F00', icon: 'restaurant-outline' };
    } else if (item.estado === 'Preparando') {
      config = { label: 'Preparando', btnText: 'Despachar Orden', color: '#FF6F00', btnColor: '#4CAF50', icon: 'checkmark-circle-outline' };
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.orderNumber}>Orden #{item.id.toString().slice(-3)}</Text>
          <Text style={styles.timeText}><Ionicons name="time-outline" size={12} /> Ahora</Text>
        </View>

        <Text style={styles.mesaTitle}>{item.mesa || 'MESA 1'}</Text>
        <Text style={styles.clienteText}>Cliente: <Text style={{ color: '#FF6F00' }}>{item.cliente}</Text></Text>

        <View style={styles.itemsContainer}>
          {item.productos.map((prod, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQty}>{prod.cantidad}x</Text>
              <Text style={styles.itemName}>{prod.nombre}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.meseroInfo}>Mesero: Juan Pérez</Text>

        <TouchableOpacity
          onPress={() => cambiarEstado(item.id)}
          style={[styles.actionButton, { backgroundColor: config.btnColor }]}
        >
          <Ionicons name={config.icon} size={18} color="white" />
          <Text style={styles.actionButtonText}> {config.btnText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER COCINA */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant" size={24} color="white" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Cocina</Text>
            <Text style={styles.headerSubtitle}>{ordenesActivas.length} órdenes activas</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ordenesActivas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrden}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, 
    backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FF6F00', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#888' },
  logoutBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  logoutText: { fontSize: 12, color: '#666' },

  listContent: { padding: 15 },
  card: { 
    backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  orderNumber: { fontSize: 12, color: '#888', flex: 1 },
  timeText: { fontSize: 12, color: '#888' },
  
  mesaTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  clienteText: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 15 },
  
  itemsContainer: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 15 },
  itemRow: { flexDirection: 'row', marginBottom: 6 },
  itemQty: { fontWeight: 'bold', color: '#333', marginRight: 10 },
  itemName: { color: '#555' },
  
  meseroInfo: { fontSize: 12, color: '#AAA', marginBottom: 15 },
  actionButton: { 
    flexDirection: 'row', padding: 14, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center' 
  },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});