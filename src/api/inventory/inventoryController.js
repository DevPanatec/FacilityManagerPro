const updateInventory = async (req, res) => {
  try {
    const { user } = req;
    
    console.log('Usuario en controlador:', user);
    console.log('Permisos en controlador:', user?.permissions);
    
    // Verificación estricta de permisos
    if (user?.permissions?.inventory?.edit !== true) {
      console.log('Acceso denegado - sin permisos de edición');
      return res.status(403).json({
        error: 'No tienes permisos para modificar el inventario'
      });
    }

    // Resto del código...
  } catch (error) {
    console.error('Error en updateInventory:', error);
    res.status(500).json({ error: error.message });
  }
};

const useInventoryItem = async (req, res) => {
  try {
    const { user } = req;
    
    // Verificar permisos
    if (!user.permissions.inventory.use) {
      return res.status(403).json({
        error: 'No tienes permisos para usar items del inventario'
      });
    }

    // Resto del código...
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Asegurarnos de exportar los controladores
export {
  updateInventory,
  useInventoryItem
}; 