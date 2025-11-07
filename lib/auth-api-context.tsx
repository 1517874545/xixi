"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  username?: string
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthApiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // 验证token并获取用户信息
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token无效，清除本地存储
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Token验证失败:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok) {
        const token = result.session?.access_token
        if (token) {
          localStorage.setItem('auth_token', token)
          setUser(result.user)
        }
        return { error: null }
      } else {
        return { error: result.error || '登录失败' }
      }
    } catch (error) {
      return { error: '网络错误，请重试' }
    }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      })

      const result = await response.json()

      if (response.ok) {
        // 注册成功后自动登录
        const token = result.session?.access_token
        if (token) {
          localStorage.setItem('auth_token', token)
          setUser(result.user)
        }
        return { error: null }
      } else {
        return { error: result.error || '注册失败' }
      }
    } catch (error) {
      return { error: '网络错误，请重试' }
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signUp, 
      signOut,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthApi() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthApi must be used within an AuthApiProvider")
  }
  return context
}