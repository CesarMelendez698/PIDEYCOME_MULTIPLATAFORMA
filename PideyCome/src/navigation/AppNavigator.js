import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native'; // Para el estado de carga

// Pantallas
import LoginScreen from '../screens/LoginScreen';
import MeseroScreen from '../screens/MeseroScreen';
import CocinaScreen from '../screens/CocinaScreen';
import CajaScreen from '../screens/CajaScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { usuario, cargando } = useContext(AppContext); // Asumiendo que añades 'cargando' al contexto

  // Si aún estamos validando la sesión con Firebase
  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario == null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {/* Usamos .trim() por si hay espacios accidentales en el string del rol */}
          {usuario.rol?.toLowerCase().trim() === 'mesero' && (
            <Stack.Screen name="MeseroHome" component={MeseroScreen} />
          )}
          
          {usuario.rol?.toLowerCase().trim() === 'cocina' && (
            <Stack.Screen name="CocinaHome" component={CocinaScreen} />
          )}
          
          {usuario.rol?.toLowerCase().trim() === 'caja' && (
            <Stack.Screen name="CajaHome" component={CajaScreen} />
          )}
          
          {usuario.rol?.toLowerCase().trim() === 'admin' && (
            <Stack.Screen name="AdminHome" component={AdminScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}