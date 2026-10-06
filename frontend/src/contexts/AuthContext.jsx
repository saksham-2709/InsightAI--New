import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Auth initialization failed:', error)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      const { access_token } = response

      // The backend returns the token only. Fetch the authenticated
      // user before reporting login success so ProtectedRoute has
      // user state ready when navigation happens.
      localStorage.setItem('token', access_token)
      setToken(access_token)

      const userData = await authService.getCurrentUser()
      setUser(userData)

      return { success: true }
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)

      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      return { success: true, user: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 