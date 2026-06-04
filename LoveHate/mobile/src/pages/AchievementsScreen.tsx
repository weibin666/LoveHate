import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../services/api'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🏅</Text>
          <Text style={styles.summaryText}>已解锁 {unlocked.length}/{achievements.length} 个成就</Text>
        </View>

        {unlocked.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ 已解锁</Text>
            <View style={styles.grid}>
              {unlocked.map((a) => (
                <View key={a.id} style={[styles.card, styles.cardUnlocked]}>
                  <Text style={styles.cardIcon}>{a.icon}</Text>
                  <Text style={styles.cardName}>{a.name}</Text>
                  <Text style={styles.cardDesc}>{a.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔒 未解锁</Text>
            <View style={styles.grid}>
              {locked.map((a) => (
                <View key={a.id} style={[styles.card, styles.cardLocked]}>
                  <Text style={[styles.cardIcon, { opacity: 0.4 }]}>{a.icon}</Text>
                  <Text style={[styles.cardName, { opacity: 0.5 }]}>{a.name}</Text>
                  <Text style={styles.cardDesc}>{a.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  summaryIcon: { fontSize: 40 },
  summaryText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', marginTop: Spacing.sm },
  sectionTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: { width: '48%', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
  cardUnlocked: { borderColor: Colors.gold + '44' },
  cardLocked: { borderColor: 'rgba(255,255,255,0.06)' },
  cardIcon: { fontSize: 32 },
  cardName: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm, marginTop: Spacing.xs },
  cardDesc: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'center', marginTop: 2 },
})
