import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../services/api'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    api.get('/achievements').then((r) => setAchievements(r.data)).catch(() => {})
  }, [])

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)
  const progress = achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.summaryCard}>
          <LinearGradient colors={Gradients.heroLove} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summaryGlow} />
          <Text style={s.summaryIcon}>🏅</Text>
          <Text style={s.summaryTitle}>成就徽章</Text>
          <Text style={s.summaryCount}>{unlocked.length} / {achievements.length}</Text>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${progress}%` }]}>
              <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.progressGrad} />
            </View>
          </View>
        </View>

        {unlocked.length > 0 && (
          <>
            <Text style={s.sectionTitle}>已解锁</Text>
            <View style={s.grid}>
              {unlocked.map((a) => (
                <View key={a.id} style={[s.card, s.cardUnlocked]}>
                  <View style={s.cardGlow}>
                    <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cardGlowGrad} />
                  </View>
                  <Text style={s.cardIcon}>{a.icon}</Text>
                  <Text style={s.cardName}>{a.name}</Text>
                  <Text style={s.cardDesc}>{a.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={s.sectionTitle}>未解锁</Text>
            <View style={s.grid}>
              {locked.map((a) => (
                <View key={a.id} style={[s.card, s.cardLocked]}>
                  <Text style={[s.cardIcon, { opacity: 0.3 }]}>{a.icon}</Text>
                  <Text style={[s.cardName, { opacity: 0.4 }]}>{a.name}</Text>
                  <Text style={s.cardDesc}>{a.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', position: 'relative', overflow: 'hidden', ...Shadows.card, borderWidth: 1, borderColor: Colors.borderLight },
  summaryGlow: { position: 'absolute', top: -80, width: 250, height: 250, borderRadius: 125, opacity: 0.08 },
  summaryIcon: { fontSize: 48 },
  summaryTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', marginTop: Spacing.sm },
  summaryCount: { color: Colors.gold, fontSize: FontSizes.lg, fontWeight: '700', marginTop: Spacing.xs },
  progressBarBg: { width: '80%', height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  progressGrad: { width: '100%', height: '100%', borderRadius: 3 },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: { width: '48%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, position: 'relative', overflow: 'hidden' },
  cardUnlocked: { borderColor: 'rgba(255,215,0,0.2)', ...Shadows.glow('#ffd700') },
  cardLocked: { borderColor: Colors.borderLight, opacity: 0.7 },
  cardGlow: { position: 'absolute', top: -20, width: 80, height: 80, borderRadius: 40, opacity: 0.3 },
  cardGlowGrad: { width: '100%', height: '100%', borderRadius: 40 },
  cardIcon: { fontSize: 36, marginTop: Spacing.sm },
  cardName: { color: Colors.text, fontWeight: '700', fontSize: FontSizes.sm, marginTop: Spacing.sm },
  cardDesc: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'center', marginTop: 2, marginBottom: Spacing.sm },
})
