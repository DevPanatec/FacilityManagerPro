'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect } from 'react';

const SupabaseContext = createContext<any>(null);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const supabase = createClientComponentClient({
    options: {
      realtime: {
        params: {
          eventsPerSecond: 1
        }
      },
      db: {
        schema: 'public'
      }
    }
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
}; 