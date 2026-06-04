import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = 'http://10.0.2.2:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('lovehate_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = await AsyncStorage.getItem('lovehate_token')
      if (token) {
        await AsyncStorage.removeItem('lovehate_token')
      }
    }
    return Promise.reject(error)
  }
)

export default api
