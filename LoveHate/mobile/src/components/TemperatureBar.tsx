import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

interface Props {
  temperature: number
}

function getTempEmoji(t: number) {
  if (t <= 20) return '🧊'; if (t <= 30) return '❄️'; if (t <= 40) return '🌡️'
  if (t <= 60) return '🌤️'; if (t <= 80) return '☀️'; return '🔥'
}

function getTempLabel(t: number) {
  if (t <= 20) return '冰封'; if (t <= 30) return '冰冻'; if (t <= 40) return '微凉'
  if (t <= 60) return '温暖'; if (t <= 80) return '火热'; return '沸腾'
}

function getTempColor(t: number) {
  if (t <= 20) return '#1e40af'; if (t <= 30) return '#0891b2'; if (t <= 40) return '#22c55e'
  if (t <= 60) return '#eab308'; if (t <= 80) return '#f97316'; return '#ef4444'
}

export default function TemperatureBar({ temperature }: Props) {
  const progress = useSharedValue(0)
  const emojiScale = useSharedValue(1)

  useEffect(() => {
    progress.value = withTiming(temperature, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    emojiScale.value = withSequence(
      withTiming(1.3, { duration: 300 }),
      withTiming(1, { duration: 300 })
    )
  }, [temperature])

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    backgroundColor: getTempColor(progress.value),
  }))

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }))

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.emojiWrap, emojiStyle]}>
        <Text style={styles.emoji}>{getTempEmoji(temperature)}</Text>
      </Animated.View>
      <Text style={styles.label}>关系温度</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{temperature.toFixed(1)}°</Text>
        <Text style={styles.tag}>{getTempLabel(temperature)}</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <View style={styles.rangeRow}>
        <Text style={styles.range}>🧊 冰封</Text>
        <Text style={styles.range}>🔥 沸腾</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emojiWrap: { marginBottom: Spacing.xs },
  emoji: { fontSize: 48, textAlign: 'center' },
  label: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  value: { color: Colors.white, fontSize: FontSizes.xxxl, fontWeight: 'bold' },
  tag: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  barBg: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 5,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.xs,
  },
  range: { color: Colors.textMuted, fontSize: 11 },
})
