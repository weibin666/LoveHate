import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../store'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login, register } = useAppStore()

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入用户名和密码')
      return
    }
    if (!isLogin && !nickname.trim()) {
      Alert.alert('提示', '请输入昵称')
      return
    }
    setSubmitting(true)
    try {
      if (isLogin) {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), nickname.trim(), password)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || '操作失败，请重试'
      Alert.alert('错误', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.loveText}>Love</Text>
            <Text style={styles.hateText}>Hate</Text>
          </Text>
          <Text style={styles.subtitle}>爱恨情仇 · 情侣情绪博弈场</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>登录</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActiveHate]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>注册</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="昵称（对方看到的名称）"
              placeholderTextColor={Colors.textMuted}
              value={nickname}
              onChangeText={setNickname}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.submitBtn, isLogin ? styles.loveBtn : styles.hateBtn, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? '请稍候...' : isLogin ? '登录 ❤️' : '注册 💜'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: FontSizes.xxxl, fontWeight: 'bold' },
  loveText: { color: Colors.love },
  hateText: { color: Colors.hate },
  subtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.xs },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.love },
  tabActiveHate: { backgroundColor: Colors.hate },
  tabText: { color: Colors.textMuted, fontWeight: '600', fontSize: FontSizes.sm },
  tabTextActive: { color: Colors.white },
  form: { gap: Spacing.md },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.white,
    fontSize: FontSizes.md,
  },
  submitBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loveBtn: { backgroundColor: Colors.love },
  hateBtn: { backgroundColor: Colors.hate },
  disabled: { opacity: 0.5 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.md },
})
