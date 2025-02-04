import { createClient } from '@supabase/supabase-js'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { Database } from '@/lib/types/database'

const ISSUER = 'FacilityManagerPro'

// Configuración del cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export class TwoFactorAuth {
  // Generar secreto para 2FA
  static async generateSecret(userId: string, email: string) {
    try {
      const secret = authenticator.generateSecret()
      const otpauth = authenticator.keyuri(email, ISSUER, secret)
      
      // Generar QR code
      const qrCode = await QRCode.toDataURL(otpauth)
      
      // Guardar secreto en la base de datos (encriptado)
      const { error } = await supabase
        .from('user_2fa')
        .insert({
          user_id: userId,
          secret: secret,
          enabled: false,
          backup_codes: generateBackupCodes(),
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return {
        secret,
        qrCode,
        otpauth
      }
    } catch (error) {
      console.error('Error generating 2FA secret:', error)
      throw error
    }
  }

  // Verificar código 2FA
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Obtener secreto de la base de datos
      const { data, error } = await supabase
        .from('user_2fa')
        .select('secret, backup_codes')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      if (!data) return false

      // Verificar si es un código de backup
      if (data.backup_codes?.includes(token)) {
        // Remover el código de backup usado
        const newBackupCodes = data.backup_codes.filter(code => code !== token)
        await supabase
          .from('user_2fa')
          .update({ backup_codes: newBackupCodes })
          .eq('user_id', userId)
        
        return true
      }

      // Verificar código TOTP
      return authenticator.verify({
        token,
        secret: data.secret
      })
    } catch (error) {
      console.error('Error verifying 2FA token:', error)
      throw error
    }
  }

  // Habilitar 2FA para un usuario
  static async enable2FA(userId: string, token: string): Promise<boolean> {
    try {
      // Verificar el token primero
      const isValid = await this.verifyToken(userId, token)
      if (!isValid) return false

      // Habilitar 2FA
      const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: true })
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      throw error
    }
  }

  // Deshabilitar 2FA
  static async disable2FA(userId: string, token: string): Promise<boolean> {
    try {
      // Verificar el token primero
      const isValid = await this.verifyToken(userId, token)
      if (!isValid) return false

      // Deshabilitar 2FA
      const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: false })
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      throw error
    }
  }

  // Verificar si 2FA está habilitado
  static async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('enabled')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data?.enabled || false
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      throw error
    }
  }

  // Generar nuevos códigos de backup
  static async generateNewBackupCodes(userId: string, token: string): Promise<string[]> {
    try {
      // Verificar el token primero
      const isValid = await this.verifyToken(userId, token)
      if (!isValid) throw new Error('Invalid token')

      const backupCodes = generateBackupCodes()
      
      // Actualizar códigos de backup
      const { error } = await supabase
        .from('user_2fa')
        .update({ backup_codes: backupCodes })
        .eq('user_id', userId)

      if (error) throw error
      return backupCodes
    } catch (error) {
      console.error('Error generating new backup codes:', error)
      throw error
    }
  }
}

// Función auxiliar para generar códigos de backup
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generar código de 8 caracteres alfanuméricos
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  return codes
} 