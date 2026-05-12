import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { AppContext } from '../context/AppContext';

export default function AdminScreen({ navigation }) {
  const { productos, setProductos, usuarios, ordenes } = useContext(AppContext);
  const [tab, setTab] = useState('Productos');
  const [modalVisible, setModalVisible] = useState(false);

  // Estados para el formulario de nuevo producto
  const [nombreP, setNombreP] = useState('');
  const [precioP, setPrecioP] = useState('');

  // OPERACIÓN CRUD: Crear producto
  const handleGuardar = () => {
    if (!nombreP || !precioP) return Alert.alert("Error", "Campos incompletos");
    const nuevo = { id: Date.now(), nombre: nombreP, precio: parseFloat(precioP), stock: 0 };
    setProductos([...productos, nuevo]);
    setModalVisible(false);
    setNombreP(''); setPrecioP('');
  };

  // OPERACIÓN CRUD: Actualizar (Aumentar stock)
  const sumarStock = (id) => {
    setProductos(productos.map(p => p.id === id ? { ...p, stock: p.stock + 10 } : p));
  };

  // OPERACIÓN CRUD: Eliminar
  const eliminar = (id) => {
    Alert.alert("Confirmar", "¿Eliminar este producto?", [
      { text: "Cancelar" },
      { text: "Eliminar", onPress: () => setProductos(productos.filter(p => p.id !== id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Modal para CRUD funcional */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Producto</Text>
            <TextInput placeholder="Nombre" style={styles.input} value={nombreP} onChangeText={setNombreP} />
            <TextInput placeholder="Precio" style={styles.input} value={precioP} onChangeText={setPrecioP} keyboardType="numeric" />
            <TouchableOpacity onPress={handleGuardar} style={styles.btnGuardar}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.btnCancelar}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.header}>Gestión de {tab}</Text>
      
      {/* Tabs de navegación */}
      <View style={styles.tabContainer}>
        {['Productos', 'Inventario', 'Usuarios'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista dinámica */}
      <FlatList
        data={tab === 'Usuarios' ? usuarios : productos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.nombre}</Text>
              <Text>{tab === 'Usuarios' ? `Rol: ${item.rol}` : `$${item.precio} | Stock: ${item.stock}`}</Text>
            </View>
            <View style={styles.actions}>
              {tab === 'Inventario' && (
                <TouchableOpacity onPress={() => sumarStock(item.id)} style={styles.btnAccion}><Text>➕</Text></TouchableOpacity>
              )}
              {tab === 'Productos' && (
                <TouchableOpacity onPress={() => eliminar(item.id)} style={styles.btnAccion}><Text>🗑️</Text></TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {tab === 'Productos' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Text style={styles.fabText}>+</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#EEE', borderRadius: 10, padding: 5 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: 'white', elevation: 2 },
  tabTextActive: { color: '#FF6F00', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  btnAccion: { padding: 10, backgroundColor: '#F0F0F0', borderRadius: 8, marginLeft: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#FF6F00', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontSize: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '85%' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 20, padding: 10 },
  btnGuardar: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnCancelar: { textAlign: 'center', marginTop: 15, color: '#666' }
});