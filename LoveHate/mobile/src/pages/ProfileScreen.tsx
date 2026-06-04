import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAppStore } from '../store'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.nickname.charAt(0)}</Text>
          </View>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <View style={styles.coinsBadge}>
            <Text style={styles.coinsText}>{user.coins} 💰 爱情币</Text>
          </View>
        </View>

        {couple && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>💑 情侣信息</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>状态</Text>
              <Text style={[styles.infoValue, { color: Colors.success }]}>甜蜜中 💕</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>邀请码</Text>
              <Text style={[styles.infoValue, { color: Colors.gold, fontFamily: 'monospace', letterSpacing: 2 }]}>{couple.invite_code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>关系温度</Text>
              <Text style={styles.infoValue}>{couple.temperature.toFixed(1)}°</Text>
            </View>
            {couple.partner && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>另一半</Text>
                <Text style={[styles.infoValue, { color: Colors.love }]}>{couple.partner.nickname}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.achievementEntry} onPress={() => (navigation as any).navigate('Achievements')}>
          <Text style={{ fontSize: 24 }}>🏅</Text>
          <Text style={{ color: Colors.white, fontWeight: '600', fontSize: FontSizes.md, marginLeft: Spacing.sm }}>成就徽章</Text>
          <Text style={{ color: Colors.textMuted, marginLeft: 'auto' }}>▶</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>🎮 玩法说明</Text>
          <Text style={styles.helpItem}>💚 <Text style={{ color: Colors.success, fontWeight: '600' }}>记好</Text>：记录对方暖心事，积攒爱情币</Text>
          <Text style={styles.helpItem}>💜 <Text style={{ color: Colors.hate, fontWeight: '600' }}>记仇</Text>：记录惹你生气的事，扣爱情币（30天自动过期原谅）</Text>
          <Text style={styles.helpItem}>🌡️ <Text style={{ color: '#eab308', fontWeight: '600' }}>温度计</Text>：根据记录实时变化</Text>
          <Text style={styles.helpItem}>🧊 <Text style={{ color: Colors.ice, fontWeight: '600' }}>冷战模式</Text>：24小时内3条记仇自动触发</Text>
          <Text style={styles.helpItem}>🏪 <Text style={{ color: Colors.gold, fontWeight: '600' }}>复仇商店</Text>：用爱情币兑换惩罚券或甜蜜券</Text>
          <Text style={styles.helpItem}>✉️ <Text style={{ color: '#f9a8d4', fontWeight: '600' }}>信箱</Text>：写道歉信或情书，接受后获额外爱情币</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: Colors.error, fontWeight: '600' }}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.lg },
  avatarCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.love, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: 'bold' },
  nickname: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: 'bold', marginTop: Spacing.md },
  username: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 2 },
  coinsBadge: { backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  coinsText: { color: Colors.gold, fontWeight: '700' },
  infoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { color: Colors.textSecondary, fontSize: FontSizes.md },
  infoValue: { color: Colors.white, fontSize: FontSizes.md },
  helpItem: { color: Colors.textSecondary, fontSize: FontSizes.sm, lineHeight: 22, marginBottom: Spacing.xs },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  achievementEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
})
