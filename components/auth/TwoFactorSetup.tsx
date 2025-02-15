import { useState, useEffect } from 'react'
import { TwoFactorAuth } from '@/lib/auth/twoFactorAuth'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Input from '@/components/ui/input'

interface TwoFactorSetupProps {
  userId: string
  userEmail: string
}

export function TwoFactorSetup({ userId, userEmail }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [token, setToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const enabled = await TwoFactorAuth.is2FAEnabled(userId)
      setIsEnabled(enabled)
      setIsLoading(false)
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      toast({
        title: 'Error',
        description: 'No se pudo verificar el estado de 2FA',
        variant: 'destructive',
      })
    }
  }

  const setupNewDevice = async () => {
    try {
      setIsLoading(true)
      const { qrCode, secret } = await TwoFactorAuth.generateSecret(userId, userEmail)
      setQrCode(qrCode)
      setSecret(secret)
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast({
        title: 'Error',
        description: 'No se pudo configurar 2FA',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const enableTwoFactor = async () => {
    try {
      setIsLoading(true)
      const success = await TwoFactorAuth.enable2FA(userId, token)
      if (success) {
        setIsEnabled(true)
        const codes = await TwoFactorAuth.generateNewBackupCodes(userId, token)
        setBackupCodes(codes)
        setShowBackupCodes(true)
        toast({
          title: 'Éxito',
          description: '2FA habilitado correctamente',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Código inválido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      toast({
        title: 'Error',
        description: 'No se pudo habilitar 2FA',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setToken('')
    }
  }

  const disableTwoFactor = async () => {
    try {
      setIsLoading(true)
      const success = await TwoFactorAuth.disable2FA(userId, token)
      if (success) {
        setIsEnabled(false)
        toast({
          title: 'Éxito',
          description: '2FA deshabilitado correctamente',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Código inválido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast({
        title: 'Error',
        description: 'No se pudo deshabilitar 2FA',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setToken('')
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (showBackupCodes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Códigos de Respaldo</CardTitle>
          <CardDescription>
            Guarda estos códigos en un lugar seguro. Los necesitarás si pierdes acceso a tu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code key={index} className="p-2 bg-gray-100 rounded">
                {code}
              </code>
            ))}
          </div>
          <Button
            className="mt-4"
            onClick={() => setShowBackupCodes(false)}
          >
            He guardado los códigos
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isEnabled && !qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autenticación de Dos Factores</CardTitle>
          <CardDescription>
            Mejora la seguridad de tu cuenta habilitando la autenticación de dos factores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={setupNewDevice} disabled={isLoading}>
            Configurar 2FA
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isEnabled && qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configura tu Aplicación</CardTitle>
          <CardDescription>
            Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Image
              src={qrCode}
              alt="QR Code"
              width={200}
              height={200}
              className="border p-2"
            />
            <Alert>
              <AlertTitle>Código Manual</AlertTitle>
              <AlertDescription className="font-mono">{secret}</AlertDescription>
            </Alert>
            <div className="w-full max-w-sm space-y-2">
              <Input
                type="text"
                placeholder="Ingresa el código de verificación"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={enableTwoFactor}
                disabled={isLoading || !token}
              >
                Verificar y Activar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autenticación de Dos Factores</CardTitle>
        <CardDescription>
          2FA está actualmente habilitado. Ingresa un código para deshabilitarlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Ingresa el código de verificación"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={disableTwoFactor}
            disabled={isLoading || !token}
          >
            Deshabilitar 2FA
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 