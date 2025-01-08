import { redirect } from 'next/navigation'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string; next?: string }
}) {
  const { token_hash, type, next } = searchParams
  
  if (!token_hash || !type) {
    redirect('/auth/error?message=Parámetros inválidos')
  }

  // Redirigir al endpoint de API para la verificación
  redirect(`/api/auth/verify?token_hash=${token_hash}&type=${type}&next=${next || '/dashboard'}`)
} 
