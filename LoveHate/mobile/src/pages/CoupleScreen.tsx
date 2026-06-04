import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { coupleApi } from '../services'
import { useAppStore } from '../store'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

export default function CoupleScreen() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { couple, fetchCouple } = useAppStore()

  const handleCreate = async () => {
    setLoading(true)
    try {
      await coupleApi.create()
      await fetchCouple()
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePair = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      await coupleApi.pair(inviteCode.trim())
      await fetchCouple()
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '配对失败')
    } finally {
      setLoading(false)
    }
  }

  if (couple) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.emoji}>💑</Text>
            <Text style={styles.successTitle}>已配对成功！</Text>
            {couple.partner ? (
              <Text style={styles.partnerText}>
                你和 <Text style={styles.partnerName}>{couple.partner.nickname}</Text> 已结对
              </Text>
            ) : (
              <Text style={styles.partnerText}>等待对方加入...</Text>
            )}
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>邀请码</Text>
              <Text style={styles.codeText}>{couple.invite_code}</Text>
              <Text style={styles.codeHint}>把邀请码发给另一半</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💑</Text>
          <Text style={styles.title}>情侣配对</Text>
          <Text style={styles.subtitle}>创建或加入一个情侣空间</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>创建新空间</Text>
          <Text style={styles.sectionDesc}>生成邀请码，让另一半加入</Text>
          <TouchableOpacity
            style={[styles.loveBtn, loading && styles.disabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? '创建中...' : '创建空间 ❤️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>或者</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>加入已有空间</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="输入邀请码"
            placeholderTextColor={Colors.textMuted}
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.hateBtn, (loading || !inviteCode.trim()) && styles.disabled]}
            onPress={handlePair}
            disabled={loading || !inviteCode.trim()}
          >
            <Text style={styles.btnText}>{loading ? '配对中...' : '加入空间 💜'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.white, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'center', marginTop: Spacing.xs },
  successTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.white, textAlign: 'center' },
  partnerText: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, fontSize: FontSizes.md },
  partnerName: { color: Colors.love, fontWeight: 'bold' },
  codeBox: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.lg, marginTop: Spacing.lg, alignItems: 'center' },
  codeLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginBottom: Spacing.xs },
  codeText: { color: Colors.gold, fontSize: FontSizes.xxl, fontWeight: 'bold', letterSpacing: 8, fontFamily: 'monospace' },
  codeHint: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: Spacing.xs },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.white },
  sectionDesc: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  loveBtn: { backgroundColor: Colors.love, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  hateBtn: { backgroundColor: Colors.hate, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.md },
  codeInput: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.white,
    fontSize: FontSizes.xl,
    textAlign: 'center',
    letterSpacing: 6,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSizes.sm },
})
