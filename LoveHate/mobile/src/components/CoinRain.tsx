import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface CoinProps {
  delay: number
  startX: number
  onDone: () => void
}

function CoinParticle({ delay, startX, onDone }: CoinProps) {
  const translateY = useSharedValue(-20)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)
  const rotateY = useSharedValue(0)

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(-60, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(40, { duration: 600, easing: Easing.in(Easing.quad) })
      )
    )
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 100 }), withTiming(1, { duration: 500 }), withTiming(0, { duration: 200 })))
    scale.value = withDelay(delay, withSequence(withTiming(1.2, { duration: 150 }), withTiming(1, { duration: 150 })))
    rotateY.value = withDelay(delay, withTiming(720, { duration: 800, easing: Easing.linear }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.coin, { left: startX }, style]}>
      <Text style={styles.coinText}>💰</Text>
    </Animated.View>
  )
}

interface Props {
  trigger: number
  count?: number
}

export default function CoinRain({ trigger, count = 8 }: Props) {
  const [coins, setCoins] = useState<{ id: number; delay: number; startX: number }[]>([])
  const counterRef = useRef(0)

  useEffect(() => {
    if (trigger > 0) {
      const newCoins = Array.from({ length: count }, (_, i) => ({
        id: counterRef.current++,
        delay: i * 80,
        startX: 40 + Math.random() * (Dimensions.get('window').width - 80),
      }))
      setCoins(newCoins)
      const timer = setTimeout(() => setCoins([]), (count * 80) + 1000)
      return () => clearTimeout(timer)
    }
  }, [trigger, count])

  if (coins.length === 0) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((c) => (
        <CoinParticle key={c.id} delay={c.delay} startX={c.startX} onDone={() => {}} />
      ))}
    </View>
  )
}

import { useState } from 'react'

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
  },
  coinText: {
    fontSize: 28,
  },
})
