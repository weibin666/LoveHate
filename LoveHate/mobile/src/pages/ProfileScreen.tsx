import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppStore } from '../store'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

export default function ProfileScreen() {
  const { user, couple, logout } = useAppStore()
  const navigation = useNavigation()

  if (!user) return null

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.profileHero}>
          <LinearGradient colors={Gradients.heroLove} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.profileGlow} />
          <View style={s.avatar}>
            <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarGrad}>
              <Text style={s.avatarText}>{user.nickname.charAt(0)}</Text>
            </LinearGradient>
          </View>
          <Text style={s.nickname}>{user.nickname}</Text>
          <Text style={s.username}>@{user.username}</Text>
          <View style={s.coinsBadge}>
            <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.coinsGrad}>
              <Text style={s.coinsText}>{user.coins} 💰 爱情币</Text>
            </LinearGradient>
          </View>
        </View>

        {couple && (
          <View style={s.card}>
            <Text style={s.cardTitle}>💑 情侣信息</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>状态</Text>
              <View style={s.statusBadge}>
                <Text style={s.statusText}>甜蜜中 💕</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>邀请码</Text>
              <Text style={s.infoCode}>{couple.invite_code}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>关系温度</Text>
              <Text style={s.infoValue}>{couple.temperature.toFixed(1)}°</Text>
            </View>
            {couple.partner && (
              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={s.infoLabel}>另一半</Text>
                <Text style={[s.infoValue, { color: Colors.love }]}>{couple.partner.nickname}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={s.achievementEntry} onPress={() => (navigation as any).navigate('Achievements')} activeOpacity={0.7}>
          <View style={s.achievementIcon}>
            <Text style={{ fontSize: 20 }}>🏅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.text, fontWeight: '700', fontSize: FontSizes.md }}>成就徽章</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>查看你的成就进度</Text>
          </View>
          <Text style={{ color: Colors.textMuted }}>▶</Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.cardTitle}>🎮 玩法说明</Text>
          <View style={s.helpItem}>
            <Text style={s.helpDot}>💚</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.success, fontWeight: '700', fontSize: FontSizes.sm }}>记好</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>记录对方暖心事，积攒爱情币</Text>
            </View>
          </View>
          <View style={s.helpItem}>
            <Text style={s.helpDot}>💜</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.hateLight, fontWeight: '700', fontSize: FontSizes.sm }}>记仇</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>记录惹你生气的事，扣爱情币（30天自动过期）</Text>
            </View>
          </View>
          <View style={s.helpItem}>
            <Text style={s.helpDot}>🌡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: FontSizes.sm }}>温度计</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>根据记录实时变化</Text>
            </View>
          </View>
          <View style={s.helpItem}>
            <Text style={s.helpDot}>🧊</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.ice, fontWeight: '700', fontSize: FontSizes.sm }}>冷战模式</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>24小时内3条记仇自动触发</Text>
            </View>
          </View>
          <View style={[s.helpItem, { borderBottomWidth: 0 }]}>
            <Text style={s.helpDot}>🏪</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: FontSizes.sm }}>复仇商店</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 }}>用爱情币兑换惩罚券或甜蜜券</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={{ color: Colors.error, fontWeight: '700', fontSize: FontSizes.md }}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.lg },
  profileHero: { alignItems: 'center', paddingVertical: Spacing.xl, position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.card },
  profileGlow: { position: 'absolute', top: -60, width: 240, height: 240, borderRadius: 120, opacity: 0.1 },
  avatar: { borderRadius: 40, overflow: 'hidden', ...Shadows.glow(Colors.love) },
  avatarGrad: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  nickname: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', marginTop: Spacing.md },
  username: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
  coinsBadge: { marginTop: Spacing.md, borderRadius: BorderRadius.full, overflow: 'hidden' },
  coinsGrad: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  coinsText: { color: Colors.bg, fontWeight: '800', fontSize: FontSizes.sm },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.card },
  cardTitle: { color: Colors.text, fontSize: FontSizes.lg, fontWeight: '800', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { color: Colors.textSecondary, fontSize: FontSizes.md },
  infoValue: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600' },
  infoCode: { color: Colors.gold, fontSize: FontSizes.md, fontWeight: '800', letterSpacing: 3, fontFamily: 'monospace' },
  statusBadge: { backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { color: Colors.success, fontWeight: '700', fontSize: FontSizes.sm },
  achievementEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', ...Shadows.card, gap: Spacing.md },
  achievementIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  helpItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  helpDot: { fontSize: 16, marginTop: 2 },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center', backgroundColor: 'rgba(248,113,113,0.05)' },
})
