import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppStore } from '../store'
import { authApi } from '../services'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

const { width: W } = Dimensions.get('window')

type LoginMode = 'password' | 'sms'

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('password')
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { login, register, smsLogin } = useAppStore()

  const startCooldown = () => {
    setCodeCooldown(60)
    timerRef.current = setInterval(() => {
      setCodeCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!phone.trim() || phone.trim().length < 11) {
      Alert.alert('提示', '请输入正确的手机号')
      return
    }
    try {
      await authApi.smsSend(phone.trim())
      startCooldown()
      Alert.alert('成功', '验证码已发送')
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '发送失败')
    }
  }

  const handleSubmit = async () => {
    if (mode === 'sms') {
      if (!phone.trim() || phone.trim().length < 11) { Alert.alert('提示', '请输入正确的手机号'); return }
      if (!smsCode.trim()) { Alert.alert('提示', '请输入验证码'); return }
      setSubmitting(true)
      try { await smsLogin(phone.trim(), smsCode.trim()) }
      catch (err: any) { Alert.alert('错误', err.response?.data?.detail || '登录失败') }
      finally { setSubmitting(false) }
      return
    }
    if (!username.trim() || !password.trim()) { Alert.alert('提示', '请输入用户名和密码'); return }
    if (!isLogin && !nickname.trim()) { Alert.alert('提示', '请输入昵称'); return }
    setSubmitting(true)
    try {
      if (isLogin) await login(username.trim(), password)
      else await register(username.trim(), nickname.trim(), password)
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '操作失败')
    } finally { setSubmitting(false) }
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.hero}>
          <LinearGradient colors={Gradients.heroLove} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGlow} />
          <Text style={s.brand}>
            <Text style={s.brandLove}>Love</Text>
            <Text style={s.brandHate}>Hate</Text>
          </Text>
          <Text style={s.tagline}>爱恨情仇 · 情侣情绪博弈场</Text>
        </View>

        <View style={s.modeSwitch}>
          <View style={s.modeTrack}>
            <View style={[s.modeIndicator, mode === 'sms' && { left: '50%' }]} />
            <TouchableOpacity style={s.modeBtn} onPress={() => setMode('password')} activeOpacity={0.7}>
              <Text style={[s.modeBtnText, mode === 'password' && s.modeBtnActive]}>密码</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modeBtn} onPress={() => setMode('sms')} activeOpacity={0.7}>
              <Text style={[s.modeBtnText, mode === 'sms' && s.modeBtnActive]}>短信</Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'sms' ? (
          <View style={s.form}>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>📱</Text>
              <TextInput style={s.input} placeholder="手机号" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} autoCapitalize="none" />
            </View>
            <View style={s.smsRow}>
              <View style={[s.inputWrap, { flex: 1 }]}>
                <Text style={s.inputIcon}>🔐</Text>
                <TextInput style={s.input} placeholder="验证码" placeholderTextColor={Colors.textMuted} value={smsCode} onChangeText={setSmsCode} keyboardType="number-pad" maxLength={6} />
              </View>
              <TouchableOpacity style={[s.smsBtn, codeCooldown > 0 && s.disabled]} onPress={handleSendCode} disabled={codeCooldown > 0}>
                <Text style={s.smsBtnText}>{codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
              <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                <Text style={s.submitText}>{submitting ? '请稍候...' : '登录 ❤️'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.tabSwitch}>
              <TouchableOpacity style={[s.tabBtn, isLogin && s.tabBtnActive]} onPress={() => setIsLogin(true)} activeOpacity={0.7}>
                {isLogin && <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabGrad} />}
                <Text style={[s.tabBtnText, isLogin && s.tabBtnTextActive]}>登录</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tabBtn, !isLogin && s.tabBtnActive]} onPress={() => setIsLogin(false)} activeOpacity={0.7}>
                {!isLogin && <LinearGradient colors={Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabGrad} />}
                <Text style={[s.tabBtnText, !isLogin && s.tabBtnTextActive]}>注册</Text>
              </TouchableOpacity>
            </View>

            <View style={s.form}>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>👤</Text>
                <TextInput style={s.input} placeholder="用户名" placeholderTextColor={Colors.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
              </View>
              {!isLogin && (
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>💕</Text>
                  <TextInput style={s.input} placeholder="昵称（对方看到的名称）" placeholderTextColor={Colors.textMuted} value={nickname} onChangeText={setNickname} />
                </View>
              )}
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🔑</Text>
                <TextInput style={s.input} placeholder="密码" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
                <LinearGradient colors={isLogin ? Gradients.love : Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  <Text style={s.submitText}>{submitting ? '请稍候...' : isLogin ? '登录 ❤️' : '注册 💜'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  hero: { alignItems: 'center', marginBottom: Spacing.xxl },
  heroGlow: { position: 'absolute', top: -60, width: 280, height: 280, borderRadius: 140, opacity: 0.12 },
  brand: { fontSize: FontSizes.hero, fontWeight: '800', letterSpacing: -1 },
  brandLove: { color: Colors.love },
  brandHate: { color: Colors.hate },
  tagline: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.xs, letterSpacing: 2 },

  modeSwitch: { alignItems: 'center', marginBottom: Spacing.lg },
  modeTrack: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.full, padding: 3, width: 200, position: 'relative' },
  modeIndicator: { position: 'absolute', top: 3, left: 3, width: '50%', height: '100%', backgroundColor: Colors.love, borderRadius: BorderRadius.full, opacity: 0.2 },
  modeBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', zIndex: 1 },
  modeBtnText: { color: Colors.textMuted, fontWeight: '600', fontSize: FontSizes.sm },
  modeBtnActive: { color: Colors.white },

  tabSwitch: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tabBtn: { flex: 1, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, overflow: 'hidden' },
  tabBtnActive: {},
  tabGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BorderRadius.md },
  tabBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: FontSizes.md, zIndex: 1 },
  tabBtnTextActive: { color: Colors.white },

  form: { gap: Spacing.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: Spacing.md, ...Shadows.small },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: { flex: 1, paddingVertical: Spacing.md, color: Colors.text, fontSize: FontSizes.md },
  smsRow: { flexDirection: 'row', gap: Spacing.sm },
  smsBtn: { backgroundColor: Colors.love, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, justifyContent: 'center', minWidth: 110, alignItems: 'center', ...Shadows.glow(Colors.love) },
  smsBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.sm },
  submitBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.card },
  submitGrad: { paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: BorderRadius.md },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: FontSizes.lg, letterSpacing: 1 },
  disabled: { opacity: 0.5 },
})
