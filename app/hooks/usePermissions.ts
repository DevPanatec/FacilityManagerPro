import { useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Resource, Action } from '../lib/types/permissions'

export function usePermissions() {
  const supabase = createClientComponentClient()

  const checkPermission = useCallback(async (
    resource: Resource,
    action: Action,
    conditions?: Record<string, any>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data } = await supabase
        .from('user_roles')
        .select(`
          role:roles (
            permissions (
              resource,
              action,
              conditions
            ),
            parent_roles:role_hierarchy!child_role_id (
              parent:roles (
                permissions (
                  resource,
                  action,
                  conditions
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)

      if (!data?.length) return false

      // Verificar permisos directos y heredados
      return data.some(userRole => 
        hasPermission(userRole.role, resource, action, conditions)
      )
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }, [supabase])

  return { checkPermission }
} 