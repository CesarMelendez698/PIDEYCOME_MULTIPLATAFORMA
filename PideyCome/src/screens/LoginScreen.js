import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { AppContext } from '../context/AppContext'; 
import { Ionicons } from '@expo/vector-icons'; 

// --- IMPORTACIONES DE FIREBASE ---
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // Importamos auth y la base de datos firestore
import { doc, getDoc } from 'firebase/firestore'; // Funciones para leer documentos

export default function LoginScreen() {
  // Extraemos setUsuario del contexto global para actualizar el estado de la sesión
  const { setUsuario } = useContext(AppContext);
  
  // Estados locales para el formulario y el indicador de carga
  const [user, setUser] = useState(''); 
  const [pass, setPass] = useState(''); 
  const [loading, setLoading] = useState(false); 

  /**
   * Maneja el proceso de autenticación y obtención de perfil
   */
  const handleLogin = async () => {
    // Validación básica de campos vacíos
    if (!user.trim() || !pass.trim()) {
      Alert.alert('Error', 'Por favor, ingrese sus credenciales');
      return;
    }

    setLoading(true); // Iniciamos el spinner de carga

    try {
      // 1. Autenticación con Firebase Auth (Verifica correo y contraseña)
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        user.toLowerCase().trim(), 
        pass
      );
      const firebaseUser = userCredential.user; 

      // 2. Consulta a Firestore para obtener el ROL del usuario
      // Referencia al documento en la colección 'usuarios' usando el UID de la imagen image_ce1db9.png
      const docRef = doc(db, "usuarios", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datosDB = docSnap.data();
        
        // Creamos el objeto de usuario con la información real de la base de datos
        const usuarioLogueado = {
          id: firebaseUser.uid,
          nombre: datosDB.nombre, // Trae el nombre configurado (ej: Cesar Lara)
          rol: datosDB.rol.toLowerCase().trim(), // Limpia espacios y convierte a minúsculas
          email: firebaseUser.email
        };

        // Actualizamos el contexto global. 
        // Esto dispara el AppNavigator y redirige al usuario según su rol.
        setUsuario(usuarioLogueado);
        
      } else {
        // Caso donde el usuario existe en Auth pero no tiene documento en Firestore
        Alert.alert('Error de Perfil', 'No se encontró un rol asignado para este usuario.');
        await auth.signOut(); // Cerramos sesión para evitar estados inconsistentes
      }
      
    } catch (error) {
      console.log("Error Firebase:", error.code);
      let mensajeError = "Ocurrió un error inesperado.";
      
      // Manejo de errores específicos de Firebase Auth
      if (error.code === 'auth/invalid-credential') {
        mensajeError = "El correo o la contraseña son incorrectos.";
      } else if (error.code === 'auth/network-request-failed') {
        mensajeError = "Error de conexión. Revisa tu internet.";
      } else if (error.code === 'auth/too-many-requests') {
        mensajeError = "Demasiados intentos fallidos. Intenta más tarde.";
      }

      Alert.alert('Acceso Denegado', mensajeError);
    } finally {
      setLoading(false); // Detenemos el spinner independientemente del resultado
    }
  };

  return (
    <SafeAreaView style={styles.containerMain}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* LOGO E IDENTIDAD VISUAL */}
          <View style={styles.headerIcon}>
            <View style={styles.circle}>
              <Ionicons name="restaurant" size={45} color="white" />
            </View>
          </View>

          <Text style={styles.title}>PideyCome</Text>
          <Text style={styles.subtitle}>Sistema de Gestión Gastronómica</Text>
          
          {/* FORMULARIO DE ACCESO */}
          <View style={styles.form}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                placeholder="ejemplo@pideycome.com" 
                style={styles.input} 
                value={user} 
                onChangeText={setUser} 
                autoCapitalize="none" 
                keyboardType="email-address" 
              />
            </View>
            
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                placeholder="******" 
                style={styles.input} 
                value={pass} 
                onChangeText={setPass} 
                secureTextEntry 
              />
            </View>

            {/* BOTÓN DE ACCIÓN */}
            <TouchableOpacity 
              onPress={handleLogin} 
              style={styles.btnPrincipal}
              disabled={loading} // Desactivar mientras carga
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.btnContent}>
                   <Text style={styles.btnText}>Iniciar Sesión</Text>
                   <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 10}} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* INDICADOR DE ESTADO (Para depuración en la UDB) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Estado de Conexión:</Text>
            <View style={styles.statusRow}>
               <View style={styles.dot} />
               <Text style={styles.roleText}>Firebase Cloud Activo</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerMain: { flex: 1, backgroundColor: '#FDF2E9' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  card: { backgroundColor: 'white', borderRadius: 25, padding: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  headerIcon: { alignItems: 'center', marginBottom: 15 },
  circle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FF6F00', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#999', marginBottom: 30 },
  form: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginLeft: 5 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F4F6F8', 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#E1E4E8',
    paddingHorizontal: 15
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#333' },
  btnPrincipal: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  testSection: { marginTop: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 20 },
  testTitle: { fontSize: 11, color: '#AAA', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#4CAF50' }, 
});