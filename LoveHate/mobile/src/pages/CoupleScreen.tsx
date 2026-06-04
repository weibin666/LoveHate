import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { coupleApi } from '../services'
import { useAppStore } from '../store'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

export default function CoupleScreen() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { couple, fetchCouple } = useAppStore()

  const handleCreate = async () => {
    setLoading(true)
    try { await coupleApi.create(); await fetchCouple() }
    catch (err: any) { Alert.alert('错误', err.response?.data?.detail || '创建失败') }
    finally { setLoading(false) }
  }

  const handlePair = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    try { await coupleApi.pair(inviteCode.trim()); await fetchCouple() }
    catch (err: any) { Alert.alert('错误', err.response?.data?.detail || '配对失败') }
    finally { setLoading(false) }
  }

  if (couple) {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.heroCard}>
            <LinearGradient colors={Gradients.heroLove} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad} />
            <Text style={s.heroEmoji}>💑</Text>
            <Text style={s.heroTitle}>已配对成功！</Text>
            {couple.partner ? (
              <Text style={s.heroSub}>
                你和 <Text style={s.heroName}>{couple.partner.nickname}</Text> 已结对
              </Text>
            ) : (
              <Text style={s.heroSub}>等待对方加入...</Text>
            )}
          </View>
          <View style={s.codeCard}>
            <Text style={s.codeLabel}>邀请码</Text>
            <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.codeGrad}>
              <Text style={s.codeText}>{couple.invite_code}</Text>
            </LinearGradient>
            <Text style={s.codeHint}>把邀请码发给另一半吧</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heroCard}>
          <LinearGradient colors={Gradients.heroLove} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad} />
          <Text style={s.heroEmoji}>💑</Text>
          <Text style={s.heroTitle}>情侣配对</Text>
          <Text style={s.heroSub}>创建或加入一个情侣空间</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>创建新空间</Text>
          <Text style={s.cardDesc}>生成邀请码，让另一半加入</Text>
          <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={handleCreate} disabled={loading} activeOpacity={0.7}>
            <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
              <Text style={s.btnText}>{loading ? '创建中...' : '创建空间 ❤️'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <View style={s.dividerDot} />
          <View style={s.dividerLine} />
        </View>

        <View style={s.card}>
          <Text style={[s.cardTitle, { textAlign: 'center' }]}>加入已有空间</Text>
          <View style={s.codeInputWrap}>
            <TextInput
              style={s.codeInput}
              placeholder="输入邀请码"
              placeholderTextColor={Colors.textMuted}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity style={[s.btn, (loading || !inviteCode.trim()) && s.disabled]} onPress={handlePair} disabled={loading || !inviteCode.trim()} activeOpacity={0.7}>
            <LinearGradient colors={Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
              <Text style={s.btnText}>{loading ? '配对中...' : '加入空间 💜'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
  heroCard: { alignItems: 'center', paddingVertical: Spacing.xl, position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.xl },
  heroGrad: { position: 'absolute', top: -80, width: 300, height: 300, borderRadius: 150, opacity: 0.1 },
  heroEmoji: { fontSize: 64, textAlign: 'center' },
  heroTitle: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  heroSub: { color: Colors.textSecondary, fontSize: FontSizes.md, marginTop: Spacing.xs, textAlign: 'center' },
  heroName: { color: Colors.love, fontWeight: '700' },
  codeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', ...Shadows.card, borderWidth: 1, borderColor: Colors.borderLight },
  codeLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },
  codeGrad: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, ...Shadows.glow('#ffd700') },
  codeText: { color: Colors.bg, fontSize: FontSizes.xxl, fontWeight: '900', letterSpacing: 8, fontFamily: 'monospace' },
  codeHint: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.card },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  btn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: BorderRadius.md },
  btnText: { color: Colors.white, fontWeight: '800', fontSize: FontSizes.md, letterSpacing: 1 },
  disabled: { opacity: 0.5 },
  codeInputWrap: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md, overflow: 'hidden' },
  codeInput: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, color: Colors.text, fontSize: FontSizes.xl, textAlign: 'center', letterSpacing: 6, fontFamily: 'monospace' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
})
