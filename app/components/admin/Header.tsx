'use client';

import { User } from '@supabase/supabase-js';
import { useState } from 'react';

export default function Header({ user }: { user: User }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Panel de Administración</h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center"
              >
                <span className="mr-2">{user.email}</span>
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.user_metadata?.avatar_url || '/default-avatar.png'}
                  alt=""
                />
              </button>
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  {/* Menú desplegable */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 