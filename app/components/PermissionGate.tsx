import { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Resource, Action } from '../lib/types/permissions'

interface PermissionGateProps {
  resource: Resource
  action: Action
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { checkPermission } = usePermissions()
  const hasPermission = await checkPermission(resource, action)

  return hasPermission ? children : fallback
} 