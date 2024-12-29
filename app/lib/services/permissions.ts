import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Resource, Action } from '../types/permissions'

export class PermissionService {
  private supabase

  constructor() {
    this.supabase = createServerComponentClient({ cookies })
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)

    return userRoles?.map(ur => ur.role_id) || []
  }

  async getAllInheritedRoles(roleIds: string[]): Promise<string[]> {
    const inheritedRoles = new Set(roleIds)
    
    const { data: hierarchy } = await this.supabase
      .from('role_hierarchy')
      .select('parent_role_id')
      .in('child_role_id', Array.from(inheritedRoles))

    if (hierarchy && hierarchy.length > 0) {
      const parentRoles = hierarchy.map(h => h.parent_role_id)
      const grandParentRoles = await this.getAllInheritedRoles(parentRoles)
      grandParentRoles.forEach(role => inheritedRoles.add(role))
    }

    return Array.from(inheritedRoles)
  }

  async hasPermission(
    userId: string, 
    resource: Resource, 
    action: Action, 
    conditions?: Record<string, any>
  ): Promise<boolean> {
    // 1. Obtener roles del usuario
    const userRoles = await this.getUserRoles(userId)
    if (!userRoles.length) return false

    // 2. Obtener todos los roles heredados
    const allRoles = await this.getAllInheritedRoles(userRoles)

    // 3. Verificar permisos
    const { data: permissions } = await this.supabase
      .from('permissions')
      .select('*')
      .in('role_id', allRoles)
      .eq('resource', resource)
      .eq('action', action)

    if (!permissions?.length) return false

    // 4. Verificar condiciones específicas si existen
    if (conditions) {
      return permissions.some(permission => {
        if (!permission.conditions) return true
        return this.matchConditions(permission.conditions, conditions)
      })
    }

    return true
  }

  private matchConditions(
    permissionConditions: Record<string, any>,
    requestConditions: Record<string, any>
  ): boolean {
    // Implementar lógica de matching de condiciones
    // Ejemplo: departmentId, organizationId, etc.
    return true
  }
} 