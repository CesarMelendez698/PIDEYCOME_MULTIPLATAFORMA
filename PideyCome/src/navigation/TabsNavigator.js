import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MeseroScreen from '../screens/MeseroScreen';
import CocinaScreen from '../screens/CocinaScreen';
import CajaScreen from '../screens/CajaScreen';
import AdminScreen from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Mesero" component={MeseroScreen} />
      <Tab.Screen name="Cocina" component={CocinaScreen} />
      <Tab.Screen name="Caja" component={CajaScreen} />
      <Tab.Screen name="Admin" component={AdminScreen} />
    </Tab.Navigator>
  );
}
