'use client';

import React, { useState, useEffect } from 'react';

const InventoryPage = () => {
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem('inventoryItems');
      setInventoryItems(storedItems ? JSON.parse(storedItems) : []);
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventoryItems.map((item, index) => (
          <div key={index} className="border p-4 rounded-lg shadow">
            <h2 className="font-bold">{item.name}</h2>
            <p>Cantidad: {item.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryPage; 