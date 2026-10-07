import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://insightai-backend-0tru.onrender.com'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle expired/invalid tokens.
// IMPORTANT: do not redirect for login/register failures.
// A wrong password returns 401 and should be shown on the login page,
// not cause the browser to reload the page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isLoginOrRegister =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register')

    if (error.response?.status === 401 && !isLoginOrRegister) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async updateProfile(userData) {
    const response = await api.put('/auth/me', userData)
    return response.data
  },

  async deleteAccount() {
    const response = await api.delete('/auth/me')
    return response.data
  }
} 