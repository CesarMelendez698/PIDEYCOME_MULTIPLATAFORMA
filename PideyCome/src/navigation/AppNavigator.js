import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';

// Importación de pantallas
import LoginScreen from '../screens/LoginScreen';
import MeseroScreen from '../screens/MeseroScreen';
import CocinaScreen from '../screens/CocinaScreen';
import CajaScreen from '../screens/CajaScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { usuario } = useContext(AppContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario == null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {/* Navegación Condicional por Roles */}
          {usuario.rol === 'mesero' && (
            <Stack.Screen name="Mesero" component={MeseroScreen} />
          )}
          {usuario.rol === 'cocina' && (
            <Stack.Screen name="Cocina" component={CocinaScreen} />
          )}
          {usuario.rol === 'caja' && (
            <Stack.Screen name="Caja" component={CajaScreen} />
          )}
          {usuario.rol === 'admin' && (
            <Stack.Screen name="Admin" component={AdminScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}