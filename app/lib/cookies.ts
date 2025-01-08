import { cookies } from 'next/headers'
import { RequestCookies } from '@edge-runtime/cookies'

export const getCookieStore = () => {
  return cookies() as unknown as RequestCookies
}

export const getCookie = (name: string) => {
  const cookieStore = getCookieStore()
  const cookie = cookieStore.get(name)
  return cookie?.value ?? ''
}

export const setCookie = (name: string, value: string) => {
  try {
    const cookieStore = getCookieStore()
    cookieStore.set(name, value)
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error)
  }
}

export const deleteCookie = (name: string) => {
  try {
    const cookieStore = getCookieStore()
    cookieStore.delete(name)
  } catch (error) {
    console.error(`Error deleting cookie ${name}:`, error)
  }
} 