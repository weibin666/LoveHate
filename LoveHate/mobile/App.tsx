import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useAppStore } from './src/store'
import AppNavigator from './src/navigation'

export default function App() {
  const { init } = useAppStore()

  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  )
}
