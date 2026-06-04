import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi, coupleApi, User, CoupleInfo } from '../services'

interface AppState {
  user: User | null
  couple: CoupleInfo | null
  loading: boolean
  setUser: (user: User | null) => void
  setCouple: (couple: CoupleInfo | null) => void
  setLoading: (loading: boolean) => void
  init: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, nickname: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchCouple: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  couple: null,
  loading: true,

  setUser: (user) => set({ user }),
  setCouple: (couple) => set({ couple }),
  setLoading: (loading) => set({ loading }),

  init: async () => {
    const token = await AsyncStorage.getItem('lovehate_token')
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const res = await authApi.getMe()
      set({ user: res.data, loading: false })
      if (res.data.couple_id) {
        await get().fetchCouple()
      }
    } catch {
      await AsyncStorage.removeItem('lovehate_token')
      set({ loading: false })
    }
  },

  login: async (username, password) => {
    const res = await authApi.login({ username, password })
    const token = res.data.access_token
    await AsyncStorage.setItem('lovehate_token', token)
    const userRes = await authApi.getMe()
    const user = userRes.data
    set({ user, loading: false })
    if (user.couple_id) {
      await get().fetchCouple()
    }
  },

  register: async (username, nickname, password) => {
    await authApi.register({ username, nickname, password })
    await get().login(username, password)
  },

  logout: async () => {
    await AsyncStorage.removeItem('lovehate_token')
    set({ user: null, couple: null })
  },

  fetchCouple: async () => {
    try {
      const res = await coupleApi.getInfo()
      set({ couple: res.data })
    } catch {
      set({ couple: null })
    }
  },
}))
