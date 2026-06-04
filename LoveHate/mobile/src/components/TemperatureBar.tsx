import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

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

function getTempGradient(t: number): readonly [string, string] {
  if (t <= 20) return ['#1e40af', '#3b82f6'] as const
  if (t <= 30) return ['#0891b2', '#22d3ee'] as const
  if (t <= 40) return ['#16a34a', '#4ade80'] as const
  if (t <= 60) return ['#ca8a04', '#facc15'] as const
  if (t <= 80) return ['#ea580c', '#f97316'] as const
  return ['#dc2626', '#ef4444'] as const
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
    width: `${Math.max(progress.value, 2)}%`,
  }))

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }))

  return (
    <View style={s.card}>
      <Animated.View style={[s.emojiWrap, emojiStyle]}>
        <Text style={s.emoji}>{getTempEmoji(temperature)}</Text>
      </Animated.View>
      <Text style={s.label}>关系温度</Text>
      <View style={s.valueRow}>
        <Text style={s.value}>{temperature.toFixed(1)}°</Text>
        <View style={s.tag}>
          <Text style={s.tagText}>{getTempLabel(temperature)}</Text>
        </View>
      </View>
      <View style={s.barBg}>
        <Animated.View style={[s.barFillWrap, barStyle]}>
          <LinearGradient
            colors={getTempGradient(temperature)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.barGrad}
          />
        </Animated.View>
      </View>
      <View style={s.rangeRow}>
        <Text style={s.range}>🧊 冰封</Text>
        <Text style={s.range}>🔥 沸腾</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  emojiWrap: { marginBottom: Spacing.xs },
  emoji: { fontSize: 48, textAlign: 'center' },
  label: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', letterSpacing: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  value: { color: Colors.text, fontSize: FontSizes.xxxl, fontWeight: '900' },
  tag: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  tagText: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '600' },
  barBg: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  barFillWrap: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  barGrad: { width: '100%', height: '100%', borderRadius: 4 },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.sm,
  },
  range: { color: Colors.textMuted, fontSize: 10 },
})
