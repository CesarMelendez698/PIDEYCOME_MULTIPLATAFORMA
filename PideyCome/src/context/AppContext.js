import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; 
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); // Usuario logueado
  const [productos, setProductos] = useState([]); // Lista de platillos/bebidas
  const [ordenes, setOrdenes] = useState([]); // Comandas para cocina/mesero/caja
  const [usuariosGlobales, setUsuariosGlobales] = useState([]); // Lista de empleados (para el Admin)
  const [cargando, setCargando] = useState(true);

  // 1. ESCUCHAR PRODUCTOS EN TIEMPO REAL
  // Usamos onSnapshot para que cualquier cambio (Edición/Eliminación) se vea al instante
  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setProductos(lista);
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHAR USUARIOS (PERSONAL) EN TIEMPO REAL
  // Esto permite al Admin ver y gestionar a Edwin, Cesar y otros empleados
  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setUsuariosGlobales(lista);
    });
    return () => unsubscribe();
  }, []);

  // 3. ESCUCHAR ÓRDENES EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "ordenes"), orderBy("fechaCreacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setOrdenes(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Función para crear órdenes desde MeseroScreen
   */
  const crearOrden = async (nuevaOrden) => {
    try {
      await addDoc(collection(db, "ordenes"), {
        ...nuevaOrden,
        fechaCreacion: new Date(),
        idMesero: usuario?.id || 'anonimo',
        nombreMesero: usuario?.nombre || 'Mesero',
        estado: 'Ordenada'
      });
    } catch (error) {
      console.error("Error al enviar a Firebase:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        usuario, setUsuario,
        productos,
        ordenes, setOrdenes,
        usuariosGlobales, // Nuevo: para el panel de administración
        crearOrden,
        cargando
      }}
    >
      {children}
    </AppContext.Provider>
  );
};