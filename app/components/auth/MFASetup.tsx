'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/ssr'
import QRCode from 'qrcode.react'
import { toast } from 'sonner'

interface MFAMethod {
  id: string
  type: 'totp' | 'sms' | 'email' | 'webauthn'
  identifier: string
  last_used_at: string | null
  created_at: string
}

export default function MFASetup() {
  const [methods, setMethods] = useState<MFAMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [setupStep, setSetupStep] = useState<'list' | 'setup-totp' | 'verify-totp'>('list')
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadMFAMethods()
  }, [])

  async function loadMFAMethods() {
    try {
      const { data: methods, error } = await supabase
        .from('mfa_methods')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMethods(methods || [])
    } catch (error) {
      console.error('Error loading MFA methods:', error)
      toast.error('Failed to load MFA methods')
    } finally {
      setLoading(false)
    }
  }

  async function startTOTPSetup() {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('auth.enroll_mfa_method', {
        p_type: 'totp',
        p_identifier: 'Authenticator App'
      })

      if (error) throw error

      // Get the TOTP secret from the response
      const { data: method, error: methodError } = await supabase
        .from('mfa_methods')
        .select('secret')
        .eq('id', data)
        .single()

      if (methodError) throw methodError

      setTotpSecret(method.secret)
      setSetupStep('setup-totp')
    } catch (error) {
      console.error('Error setting up TOTP:', error)
      toast.error('Failed to set up authenticator')
    } finally {
      setLoading(false)
    }
  }

  async function verifyTOTPCode() {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('auth.validate_totp_code', {
        code: verificationCode
      })

      if (error) throw error

      if (data) {
        toast.success('Authenticator verified successfully')
        setSetupStep('list')
        loadMFAMethods()
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error) {
      console.error('Error verifying TOTP:', error)
      toast.error('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  async function removeMFAMethod(methodId: string) {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('mfa_methods')
        .delete()
        .eq('id', methodId)

      if (error) throw error

      toast.success('MFA method removed')
      loadMFAMethods()
    } catch (error) {
      console.error('Error removing MFA method:', error)
      toast.error('Failed to remove MFA method')
    } finally {
      setLoading(false)
    }
  }

  if (loading && methods.length === 0) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  if (setupStep === 'setup-totp') {
    const totpUrl = totpSecret 
      ? `otpauth://totp/FacilityManagerPro:${encodeURIComponent(user?.email || '')}?secret=${totpSecret}&issuer=FacilityManagerPro`
      : ''

    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h2 className="text-lg font-semibold">Set up Authenticator App</h2>
        <ol className="list-decimal list-inside space-y-4">
          <li>Install an authenticator app like Google Authenticator or Authy</li>
          <li>
            Scan this QR code with your authenticator app:
            <div className="mt-2 bg-white p-4 inline-block rounded">
              <QRCode value={totpUrl} size={200} />
            </div>
          </li>
          <li>
            Enter the 6-digit code from your authenticator app:
            <input
              type="text"
              className="mt-2 block w-full px-3 py-2 border rounded"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
          </li>
        </ol>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={verifyTOTPCode}
            disabled={loading || verificationCode.length !== 6}
          >
            Verify
          </button>
          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={() => setSetupStep('list')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h2>
      
      {methods.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            No 2FA methods configured. Add one to improve your account security.
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={startTOTPSetup}
          >
            Set up authenticator app
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">
                  {method.type === 'totp' ? 'Authenticator App' : method.type}
                </div>
                <div className="text-sm text-gray-500">
                  {method.identifier}
                  {method.last_used_at && (
                    <span className="block">
                      Last used: {new Date(method.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="text-red-500 hover:text-red-600"
                onClick={() => removeMFAMethod(method.id)}
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
