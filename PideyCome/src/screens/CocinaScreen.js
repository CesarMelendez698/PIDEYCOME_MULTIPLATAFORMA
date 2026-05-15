import React, { useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export default function CocinaScreen() {
  const { ordenes, usuario, setUsuario } = useContext(AppContext);

  // --- FILTRADO: Solo órdenes que no han sido despachadas/pagadas ---
  const ordenesActivas = useMemo(() => {
    return ordenes.filter(o => ['Ordenada', 'Recibida', 'Preparando'].includes(o.estado));
  }, [ordenes]);

  const cambiarEstado = async (id, estadoActual) => {
    let proximoEstado = '';
    if (estadoActual === 'Ordenada') proximoEstado = 'Recibida';
    else if (estadoActual === 'Recibida') proximoEstado = 'Preparando';
    else if (estadoActual === 'Preparando') proximoEstado = 'Despachada';

    if (proximoEstado) {
      try {
        const ordenRef = doc(db, "ordenes", id);
        await updateDoc(ordenRef, { estado: proximoEstado });
      } catch (error) {
        Alert.alert("Error", "No se pudo actualizar el estado.");
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de salir de cocina?", [
      { text: "No" },
      { text: "Sí", onPress: () => setUsuario(null) }
    ]);
  };

  const renderOrden = ({ item }) => {
    // Configuración visual por colores y botones según el estado
    let config = { 
      label: 'NUEVA', 
      color: '#FFB300', 
      btnText: 'RECIBIR PEDIDO', 
      icon: 'hand-left-outline' 
    };

    if (item.estado === 'Recibida') {
      config = { label: 'EN COLA', color: '#2196F3', btnText: 'EMPEZAR COCINA', icon: 'flame-outline' };
    } else if (item.estado === 'Preparando') {
      config = { label: 'EN COCCIÓN', color: '#FF6F00', btnText: 'MARCAR LISTO', icon: 'checkmark-done-outline' };
    }

    return (
      <View style={[styles.card, { borderLeftColor: config.color }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.mesaText}>{item.mesa || "LLEVAR"}</Text>
            <Text style={styles.meseroText}>Atiende: {item.nombreMesero || 'General'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
            <Text style={styles.statusBadgeText}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.clienteRow}>
          <Ionicons name="person-outline" size={16} color="#8E8E93" />
          <Text style={styles.clienteText}> Cliente: <Text style={{fontWeight: 'bold', color: '#1C1C1E'}}>{item.cliente}</Text></Text>
        </View>

        <View style={styles.divider} />

        {item.productos.map((prod, index) => (
          <View key={index} style={styles.productRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{prod.cantidad}</Text>
            </View>
            <Text style={styles.productName}>{prod.nombre}</Text>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.btnAccion, { backgroundColor: config.color }]}
          onPress={() => cambiarEstado(item.id, item.estado)}
        >
          <Ionicons name={config.icon} size={20} color="white" />
          <Text style={styles.btnAccionText}>{config.btnText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER ESTILO ADMIN */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Panel de Control</Text>
          <Text style={styles.headerTitle}>Monitor de Cocina</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Ionicons name="flash" size={14} color="#FF6F00" />
        <Text style={styles.infoBarText}> {ordenesActivas.length} PEDIDOS EN CURSO</Text>
      </View>

      <FlatList
        data={ordenesActivas}
        keyExtractor={(item) => item.id}
        renderItem={renderOrden}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
    paddingBottom: 25, 
    paddingHorizontal: 25, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: { padding: 10, backgroundColor: '#FFF1F0', borderRadius: 12 },

  infoBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 15, 
    marginBottom: 5 
  },
  infoBarText: { fontSize: 11, fontWeight: 'bold', color: '#8E8E93', letterSpacing: 1 },

  listContent: { padding: 20, paddingBottom: 40 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 4, 
    borderLeftWidth: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mesaText: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  meseroText: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  clienteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  clienteText: { fontSize: 14, color: '#3A3A3C' },
  
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 15 },
  
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qtyBadge: { 
    backgroundColor: '#F2F2F7', 
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  qtyText: { fontWeight: 'bold', fontSize: 13, color: '#1C1C1E' },
  productName: { fontSize: 16, color: '#3A3A3C', fontWeight: '500' },

  btnAccion: { 
    flexDirection: 'row', 
    marginTop: 10, 
    padding: 16, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2 
  },
  btnAccionText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 14, letterSpacing: 0.5 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#8E8E93', marginTop: 15, fontSize: 16, fontWeight: '500' }
});