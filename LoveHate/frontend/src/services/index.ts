import api from './api'

export interface User {
  id: string
  username: string
  nickname: string
  avatar: string | null
  coins: number
  couple_id: string | null
  created_at: string
}

export interface CoupleInfo {
  id: string
  invite_code: string
  status: string
  temperature: number
  cold_war_status: string
  partner: User | null
  anniversary: string | null
  created_at: string
}

export interface Record {
  id: string
  author_id: string
  target_id: string
  record_type: string
  emotion: string
  content: string
  coins_change: number
  is_expired: boolean
  created_at: string
  author_nickname: string
  target_nickname: string
}

export interface ShopItem {
  id: string
  name: string
  description: string | null
  item_type: string
  price: number
  is_custom: boolean
}

export interface Purchase {
  id: string
  buyer_id: string
  item_id: string
  target_id: string
  is_used: boolean
  created_at: string
  item_name: string
}

export interface Letter {
  id: string
  sender_id: string
  letter_type: string
  content: string
  is_accepted: boolean | null
  created_at: string
  sender_nickname: string
}

export const authApi = {
  register: (data: { username: string; nickname: string; password: string }) =>
    api.post<User>('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
}

export const coupleApi = {
  create: () => api.post<CoupleInfo>('/couple/create'),
  getInfo: () => api.get<CoupleInfo>('/couple/info'),
  pair: (invite_code: string) => api.post<CoupleInfo>('/couple/pair', { invite_code }),
}

export const recordApi = {
  create: (data: { target_id: string; record_type: string; emotion: string; content: string }) =>
    api.post<Record>('/records', data),
  getList: (params?: { record_type?: string; limit?: number; offset?: number }) =>
    api.get<Record[]>('/records', { params }),
  getStats: () => api.get('/records/stats'),
  delete: (id: string) => api.delete(`/records/${id}`),
}

export const shopApi = {
  getItems: () => api.get<ShopItem[]>('/game/shop'),
  createItem: (data: { name: string; description?: string; item_type: string; price: number }) =>
    api.post<ShopItem>('/game/shop', data),
  buyItem: (itemId: string) => api.post<Purchase>(`/game/shop/${itemId}/buy`),
  getPurchases: () => api.get<Purchase[]>('/game/purchases'),
}

export const letterApi = {
  send: (data: { letter_type: string; content: string }) =>
    api.post<Letter>('/game/letter', data),
  getList: () => api.get<Letter[]>('/game/letters'),
  accept: (letterId: string, accepted: boolean) =>
    api.post(`/game/letter/${letterId}/accept`, { accepted }),
}

export const coldWarApi = {
  reconcile: (want_reconcile: boolean) =>
    api.post('/game/coldwar/reconcile', { want_reconcile }),
}
