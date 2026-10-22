import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User, Role } from '@/types'

interface AuthContextType {
  user: User | null
  role: Role
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isManager: boolean
  canEdit: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Carrega o usuário da sessão atual do PocketBase
    if (pb.authStore.isValid && pb.authStore.model) {
      const m = pb.authStore.model
      setUser({
        id: m.id,
        email: m.email,
        name: m.name || m.email.split('@')[0],
        avatar: m.avatar,
        role: (m.role as Role) || 'Administrador',
        status: m.status || 'Ativo',
        permissions: m.permissions || [],
        created: m.created,
        updated: m.updated,
      })
    } else {
      setUser(null)
    }
    setIsLoading(false)

    // Escuta mudanças de authStore
    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid && pb.authStore.model) {
        const m = pb.authStore.model
        setUser({
          id: m.id,
          email: m.email,
          name: m.name || m.email.split('@')[0],
          avatar: m.avatar,
          role: (m.role as Role) || 'Administrador',
          status: m.status || 'Ativo',
          permissions: m.permissions || [],
          created: m.created,
          updated: m.updated,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword(email, pass)
    const m = authData.record
    setUser({
      id: m.id,
      email: m.email,
      name: m.name || m.email.split('@')[0],
      avatar: m.avatar,
      role: (m.role as Role) || 'Administrador',
      status: m.status || 'Ativo',
      permissions: m.permissions || [],
      created: m.created,
      updated: m.updated,
    })
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const role: Role = user?.role || 'Administrador'
  const isAdmin = role === 'Administrador'
  const isManager = isAdmin || role === 'Gestor do Arquivo'
  const canEdit = isAdmin || isManager || role === 'Operador'

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        logout,
        isAdmin,
        isManager,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
