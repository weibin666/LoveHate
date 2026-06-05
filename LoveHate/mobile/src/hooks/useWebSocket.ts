import { useEffect, useRef, useCallback, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppStore } from '../store'

const WS_BASE = 'ws://10.0.2.2:8000'

export interface WSMessage {
  type: string
  [key: string]: any
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const { user, fetchCouple } = useAppStore()
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(async () => {
    if (!user?.couple_id) return

    const token = await AsyncStorage.getItem('lovehate_token')
    if (!token) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`${WS_BASE}/ws/notify?token=${token}`)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        setLastMessage(msg)

        if (msg.type === 'new_record' || msg.type === 'reconcile') {
          fetchCouple()
        }
      } catch {}
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectTimer.current = setTimeout(() => { connect() }, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [user?.couple_id, fetchCouple])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  const sendMessage = useCallback((msg: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { connected, lastMessage, sendMessage }
}
