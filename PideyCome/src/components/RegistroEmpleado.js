import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegistroEmpleado({ onFinalizar, itemParaEditar }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('mesero');
  const [loading, setLoading] = useState(false);

  // EFECTO: Si recibimos un usuario para editar, llenamos el formulario
  useEffect(() => {
    if (itemParaEditar) {
      setNombre(itemParaEditar.nombre);
      setEmail(itemParaEditar.email);
      setRol(itemParaEditar.rol);
    }
  }, [itemParaEditar]);

  const handleGuardar = async () => {
    // Validaciones básicas
    if (!nombre.trim() || !email.trim()) {
      Alert.alert("Error", "El nombre y el correo son obligatorios");
      return;
    }

    // Si es nuevo, la contraseña es obligatoria
    if (!itemParaEditar && password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (itemParaEditar) {
        // --- LÓGICA DE EDICIÓN ---
        // Solo actualizamos nombre y rol en Firestore (Auth no se toca aquí)
        const userRef = doc(db, "usuarios", itemParaEditar.id);
        await updateDoc(userRef, {
          nombre: nombre.trim(),
          rol: rol
        });
        Alert.alert("Éxito", "Perfil de empleado actualizado");
      } else {
        // --- LÓGICA DE CREACIÓN ---
        // 1. Crear cuenta en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          email.toLowerCase().trim(), 
          password
        );
        
        // 2. Crear documento de perfil en Firestore
        await setDoc(doc(db, "usuarios", userCredential.user.uid), {
          nombre: nombre.trim(),
          email: email.toLowerCase().trim(),
          rol: rol, 
          uid: userCredential.user.uid,
          fechaAlta: new Date()
        });
        Alert.alert("Éxito", "Nuevo empleado registrado");
      }
      
      onFinalizar(); // Regresa a la lista
    } catch (e) {
      console.log("Error:", e.code);
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "Ese correo ya está en uso");
      } else {
        Alert.alert("Error", "No se pudo procesar la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.headerForm}>
        {itemParaEditar ? "Editar Empleado" : "Registrar Personal"}
      </Text>

      <Text style={styles.labelInput}>Nombre Completo</Text>
      <TextInput 
        placeholder="Ej: Juan Pérez" 
        style={styles.input} 
        value={nombre} 
        onChangeText={setNombre} 
      />

      <Text style={styles.labelInput}>Correo Electrónico</Text>
      <TextInput 
        placeholder="correo@pideycome.com" 
        style={[styles.input, itemParaEditar && styles.inputDisabled]} 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        editable={!itemParaEditar} // No permitimos editar el correo por integridad de Auth
      />

      {!itemParaEditar && (
        <>
          <Text style={styles.labelInput}>Contraseña Temporal</Text>
          <TextInput 
            placeholder="Mínimo 6 caracteres" 
            style={styles.input} 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
          />
        </>
      )}
      
      <Text style={styles.label}>Asignar Rol:</Text>
      <View style={styles.roles}>
        {['mesero', 'cocina', 'caja'].map(r => (
          <TouchableOpacity 
            key={r} 
            onPress={() => setRol(r)} 
            style={[styles.rolBtn, rol === r && styles.active]}
          >
            <Text style={rol === r ? {color: 'white', fontWeight: 'bold'} : {color: '#666'}}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        onPress={handleGuardar} 
        style={[styles.btnMain, itemParaEditar && {backgroundColor: '#2196F3'}]} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.textBtn}>
            {itemParaEditar ? "ACTUALIZAR DATOS" : "CREAR CUENTA"}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onFinalizar} style={styles.btnCancel}>
        <Text style={{color: '#888'}}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  headerForm: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  labelInput: { fontSize: 12, color: '#999', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  inputDisabled: { backgroundColor: '#EEE', color: '#888' },
  label: { fontWeight: 'bold', marginBottom: 10, color: '#555' },
  roles: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  rolBtn: { padding: 10, borderWidth: 1, borderColor: '#FF6F00', borderRadius: 8, width: '31%', alignItems: 'center' },
  active: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  btnMain: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnCancel: { marginTop: 15, alignItems: 'center' },
  textBtn: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});