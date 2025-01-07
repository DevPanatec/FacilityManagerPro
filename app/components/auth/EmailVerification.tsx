'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/ssr'
import { toast } from 'sonner'

interface EmailVerificationProps {
  email: string
  onVerified?: () => void
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  
  const supabase = createClientComponentClient()

  async function sendVerificationEmail() {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('auth.create_email_verification', {
        email
      })

      if (error) throw error

      setShowVerification(true)
      toast.success('Verification code sent to your email')
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  async function verifyEmail() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('mfa_challenges')
        .select('*')
        .eq('code', verificationCode)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Invalid verification code')
        return
      }

      if (data.verified_at) {
        toast.error('Code already used')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error('Code has expired')
        return
      }

      // Mark challenge as verified
      const { error: updateError } = await supabase
        .from('mfa_challenges')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', data.id)

      if (updateError) throw updateError

      // Update user's email verification status
      const { error: userError } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', data.user_id)

      if (userError) throw userError

      toast.success('Email verified successfully')
      onVerified?.()
    } catch (error) {
      console.error('Error verifying email:', error)
      toast.error('Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  if (!showVerification) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="text-yellow-800 font-medium">Email not verified</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Please verify your email address to access all features.
          </p>
        </div>
        <button
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={sendVerificationEmail}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send verification email'}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold">Verify your email</h2>
      <p className="text-gray-600">
        We've sent a verification code to {email}. Enter the code below to verify your email address.
      </p>
      <div className="space-y-2">
        <input
          type="text"
          className="block w-full px-3 py-2 border rounded"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter verification code"
          maxLength={8}
        />
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={verifyEmail}
            disabled={loading || verificationCode.length < 6}
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={sendVerificationEmail}
            disabled={loading}
          >
            Resend code
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Didn't receive the code? Check your spam folder or click "Resend code" to try again.
      </p>
    </div>
  )
} 
