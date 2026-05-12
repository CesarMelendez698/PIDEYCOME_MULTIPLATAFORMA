import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { setUsuario, usuarios } = useContext(AppContext);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = () => {
    if (!user.trim() || !pass.trim()) {
      Alert.alert('Error', 'Por favor, ingrese sus credenciales');
      return;
    }

    const encontrado = usuarios.find(
      (u) => u.username === user.toLowerCase() && u.password === pass
    );

    if (encontrado) {
      setUsuario(encontrado);
    } else {
      Alert.alert('Error', 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF2E9' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerIcon}>
            <View style={styles.circle}>
              <Ionicons name="restaurant" size={45} color="white" />
            </View>
          </View>

          <Text style={styles.title}>Sistema Restaurante</Text>
          <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>
          
          <View style={styles.form}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput 
              placeholder="Ingresa tu usuario" 
              style={styles.input} 
              value={user} 
              onChangeText={setUser} 
              autoCapitalize="none" 
            />
            
            <Text style={styles.label}>Contraseña</Text>
            <TextInput 
              placeholder="Ingresa tu contraseña" 
              style={styles.input} 
              value={pass} 
              onChangeText={setPass} 
              secureTextEntry 
            />

            <TouchableOpacity onPress={handleLogin} style={styles.btnPrincipal}>
              <Text style={styles.btnText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Usuarios de prueba:</Text>
            <View style={styles.grid}>
              {[
                { r: 'mesero1', c: 'mesero1 / 1234' },
                { r: 'cocina1', c: 'cocina1 / 1234' },
                { r: 'cajera1', c: 'cajera1 / 1234' },
                { r: 'admin1', c: 'admin / admin' }
              ].map((u, i) => (
                <View key={i} style={styles.gridItem}>
                  <Text style={styles.roleText}>{u.r}</Text>
                  <Text style={styles.credsText}>{u.c}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  headerIcon: { alignItems: 'center', marginBottom: 10 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6F00', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 13, textAlign: 'center', color: '#999', marginBottom: 25 },
  form: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  input: { backgroundColor: '#F4F6F8', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  btnPrincipal: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  testSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 },
  testTitle: { fontSize: 12, color: '#AAA', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, marginBottom: 8 },
  roleText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  credsText: { fontSize: 10, color: '#BBB' }
});