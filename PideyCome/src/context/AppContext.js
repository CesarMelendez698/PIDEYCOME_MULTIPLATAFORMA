import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

  // Usuarios configurados según la imagen de prueba
  const [usuarios] = useState([
    { id: 1, nombre: 'Admin Central', username: 'admin', password: 'admin', rol: 'admin' },
    { id: 2, nombre: 'Juan Pérez', username: 'mesero1', password: '1234', rol: 'mesero' },
    { id: 3, nombre: 'Maria Garcia', username: 'cocina1', password: '1234', rol: 'cocina' },
    { id: 4, nombre: 'Cajera 1', username: 'cajera1', password: '1234', rol: 'caja' },
  ]);

  const [productos] = useState([
    { id: 1, nombre: 'Hamburguesa Clásica', precio: 8.50, categoria: 'Comida' },
    { id: 2, nombre: 'Pizza Margarita', precio: 12.00, categoria: 'Comida' },
    { id: 3, nombre: 'Ensalada César', precio: 7.00, categoria: 'Comida' },
    { id: 4, nombre: 'Coca Cola', precio: 2.50, categoria: 'Bebidas' },
  ]);

  const [ordenes, setOrdenes] = useState([]);

  const crearOrden = (nuevaOrden) => {
    setOrdenes([...ordenes, { ...nuevaOrden, id: Date.now() }]);
  };

  return (
    <AppContext.Provider
      value={{
        usuario, setUsuario,
        usuarios,
        productos,
        ordenes, setOrdenes,
        crearOrden
      }}
    >
      {children}
    </AppContext.Provider>
  );
};