import React, { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import { Colors, Spacing } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Snowflake {
  id: number
  x: number
  size: number
  duration: number
  delay: number
}

export default function IceOverlay({ active }: { active: boolean }) {
  if (!active) return null

  const snowflakes: Snowflake[] = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    size: 8 + Math.random() * 16,
    duration: 3000 + Math.random() * 4000,
    delay: Math.random() * 2000,
  }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.iceBg} />
      {snowflakes.map((s) => (
        <SnowflakeItem key={s.id} {...s} />
      ))}
      <View style={styles.iceBorderTop} />
      <View style={styles.iceBorderBottom} />
    </View>
  )
}

function SnowflakeItem({ x, size, duration, delay }: Snowflake) {
  const translateY = useSharedValue(-20)
  const opacity = useSharedValue(0)
  const rotate = useSharedValue(0)

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withTiming(Dimensions.get('window').height + 20, { duration, easing: Easing.linear }),
      -1
    ))
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 500 }),
        withTiming(0.8, { duration: duration - 1500 }),
        withTiming(0, { duration: 1000 })
      ),
      -1
    ))
    rotate.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: duration * 0.7, easing: Easing.linear }),
      -1
    ))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.snowflake, { left: x, width: size, height: size }, style]}>
      <View style={[styles.snowInner, { width: size, height: size }]} />
    </Animated.View>
  )
}

function withDelay(delay: number, animation: any) {
  return withSequence(withTiming(0, { duration: delay }), animation)
}

const styles = StyleSheet.create({
  iceBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  iceBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  iceBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  snowflake: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snowInner: {
    backgroundColor: 'rgba(191, 219, 254, 0.6)',
    borderRadius: 999,
  },
})
