import { useState, useEffect } from 'react';

export const useInventory = () => {
  const [products, setProducts] = useState<any[]>([]);

  const refreshInventory = async () => {
    const data = await window.vahiAPI.getInventory();
    setProducts(data);
  };

  const addProduct = async (name: string, price: number, stock: number) => {
    await window.vahiAPI.addItem({ name, price, stock });
    await refreshInventory(); // Refresh the list after adding
  };

  useEffect(() => {
    refreshInventory();
  }, []);

  return { products, addProduct };
};