import { useState, useEffect } from 'react';

export const usePermissions = (user) => {
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    if (user?.role === 'enterprise') {
      const storedPermissions = localStorage.getItem('userPermissions');
      if (storedPermissions) {
        setPermissions(JSON.parse(storedPermissions));
      }
    }
  }, [user]);

  return { permissions };
}; 