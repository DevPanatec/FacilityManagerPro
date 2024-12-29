import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirigir al dashboard cuando se accede a /admin
  redirect('/admin/dashboard');
} 