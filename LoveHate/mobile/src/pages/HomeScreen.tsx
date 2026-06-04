import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { recordApi, coldWarApi, CoupleInfo, User, Record } from '../services'
import { uploadApi } from '../services'
import { useAppStore } from '../store'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'
import TemperatureBar from '../components/TemperatureBar'
import IceOverlay from '../components/IceOverlay'
import CoinRain from '../components/CoinRain'
import * as ImagePicker from 'expo-image-picker'

const EMOTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'furious', label: '暴怒', emoji: '😡' },
  { value: 'angry', label: '不爽', emoji: '😤' },
  { value: 'annoyed', label: '微烦', emoji: '😒' },
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'warm', label: '超暖', emoji: '🥰' },
  { value: 'heart', label: '心动', emoji: '😍' },
]

const GOOD_EMOTIONS = ['happy', 'warm', 'heart']
const GRUDGE_EMOTIONS = ['annoyed', 'angry', 'furious']

interface Props { couple: CoupleInfo; user: User }

export default function HomeScreen({ couple, user }: Props) {
  const [records, setRecords] = useState<Record[]>([])
  const [stats, setStats] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'good' | 'grudge'>('good')
  const [emotion, setEmotion] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [coinTrigger, setCoinTrigger] = useState(0)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const partner = couple.partner
  const isColdWar = couple.cold_war_status === 'active'

  const loadData = async () => {
    try {
      const [r1, r2] = await Promise.all([recordApi.getList({ limit: 20 }), recordApi.getStats()])
      setRecords(r1.data); setStats(r2.data)
    } catch {}
  }

  useEffect(() => { loadData() }, [])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!emotion) { Alert.alert('提示', '请选择一个情绪'); return }
    if (!content.trim()) { Alert.alert('提示', '请输入内容'); return }
    if (!partner) { Alert.alert('提示', '未找到另一半信息'); return }
    setSubmitting(true)
    try {
      let imageUrl: string | undefined
      if (imageUri) {
        setUploading(true)
        const formData = new FormData()
        const filename = imageUri.split('/').pop() || 'photo.jpg'
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: filename } as any)
        const uploadRes = await uploadApi.uploadImage(formData)
        imageUrl = uploadRes.data.url
        setUploading(false)
      }
      await recordApi.create({
        target_id: partner.id, record_type: formType, emotion,
        content: content.trim(), image_url: imageUrl,
      })
      setContent(''); setEmotion(''); setImageUri(null); setShowForm(false); loadData(); setCoinTrigger((v) => v + 1)
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '提交失败')
    } finally { setSubmitting(false) }
  }

  const handleReconcile = async () => {
    try {
      await coldWarApi.reconcile(true)
      const { fetchCouple } = useAppStore.getState()
      await fetchCouple()
    } catch {}
  }

  const handleRenew = async (recordId: string) => {
    Alert.alert('续期记仇', '花费 10 💰 续期30天？', [
      { text: '取消', style: 'cancel' },
      {
        text: '续期', style: 'destructive', onPress: async () => {
          try {
            await recordApi.renew(recordId)
            Alert.alert('成功', '记仇已续期！又多了30天～')
            loadData()
          } catch (err: any) {
            Alert.alert('错误', err.response?.data?.detail || '续期失败')
          }
        },
      },
    ])
  }

  const filteredEmotions = formType === 'good'
    ? EMOTIONS.filter((e) => GOOD_EMOTIONS.includes(e.value))
    : EMOTIONS.filter((e) => GRUDGE_EMOTIONS.includes(e.value))

  const renderRecord = ({ item }: { item: Record }) => {
    const emo = EMOTIONS.find((e) => e.value === item.emotion) || EMOTIONS[0]
    const isGood = item.record_type === 'good'
    return (
      <View style={[s.recordCard, isGood ? s.recordGood : s.recordGrudge]}>
        <View style={s.recordHeader}>
          <View style={[s.emojiBadge, { backgroundColor: isGood ? 'rgba(74,222,128,0.15)' : 'rgba(132,94,194,0.15)' }]}>
            <Text style={{ fontSize: 18 }}>{emo.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.recordMeta}>{item.author_nickname} → {item.target_nickname}</Text>
            <Text style={s.recordDate}>
              {new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[s.coinBadge, { backgroundColor: item.coins_change >= 0 ? 'rgba(255,215,0,0.12)' : 'rgba(248,113,113,0.12)' }]}>
            <Text style={[s.coinText, { color: item.coins_change >= 0 ? Colors.gold : Colors.error }]}>
              {item.coins_change >= 0 ? '+' : ''}{item.coins_change} 💰
            </Text>
          </View>
        </View>
        <Text style={s.recordContent}>{item.content}</Text>
        {!isGood && !item.is_expired && (
          <TouchableOpacity style={s.renewBtn} onPress={() => handleRenew(item.id)}>
            <Text style={s.renewBtnText}>🔄 花费10💰续期30天</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <IceOverlay active={isColdWar} />
      <CoinRain trigger={coinTrigger} count={formType === 'good' ? 10 : 5} />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {isColdWar && (
          <View style={s.coldWarBanner}>
            <LinearGradient colors={['rgba(59,130,246,0.2)', 'rgba(99,102,241,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.coldWarGrad} />
            <Text style={{ fontSize: 40 }}>🧊</Text>
            <Text style={s.coldWarTitle}>冷战模式进行中</Text>
            <Text style={s.coldWarDesc}>冰层正在蔓延...</Text>
            <TouchableOpacity style={s.reconcileBtn} onPress={handleReconcile} activeOpacity={0.7}>
              <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.reconcileGrad}>
                <Text style={s.reconcileText}>我想和好 💔➡️❤️</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <TemperatureBar temperature={couple.temperature} />

        {stats && (
          <View style={s.statsRow}>
            <View style={[s.statCard, s.statGood]}>
              <Text style={{ fontSize: 20 }}>💚</Text>
              <Text style={[s.statNum, { color: Colors.success }]}>{stats.good_count}</Text>
              <Text style={s.statLabel}>记好</Text>
            </View>
            <View style={[s.statCard, s.statGrudge]}>
              <Text style={{ fontSize: 20 }}>💜</Text>
              <Text style={[s.statNum, { color: Colors.hateLight }]}>{stats.grudge_count}</Text>
              <Text style={s.statLabel}>记仇</Text>
            </View>
            <View style={[s.statCard, s.statCoins]}>
              <Text style={{ fontSize: 20 }}>💰</Text>
              <Text style={[s.statNum, { color: Colors.gold }]}>{user.coins}</Text>
              <Text style={s.statLabel}>爱情币</Text>
            </View>
          </View>
        )}

        <View style={s.btnRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => { setFormType('good'); setEmotion(''); setImageUri(null); setShowForm(true) }} activeOpacity={0.7}>
            <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionGrad}>
              <Text style={s.actionText}>💚 记好</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => { setFormType('grudge'); setEmotion(''); setImageUri(null); setShowForm(true) }} activeOpacity={0.7}>
            <LinearGradient colors={Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionGrad}>
              <Text style={s.actionText}>💜 记仇</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>最近记录</Text>
        {records.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 36 }}>📝</Text>
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>还没有记录，快去记好或记仇吧！</Text>
          </View>
        ) : (
          records.map((r) => <View key={r.id}>{renderRecord({ item: r })}</View>)
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{formType === 'good' ? '💚 记个好' : '💜 记个仇'}</Text>
            <Text style={s.sectionLabel}>选择情绪</Text>
            <View style={s.emotionGrid}>
              {filteredEmotions.map((e) => (
                <TouchableOpacity
                  key={e.value}
                  style={[
                    s.emotionBtn,
                    emotion === e.value && (formType === 'good' ? s.emotionGoodActive : s.emotionHateActive),
                  ]}
                  onPress={() => setEmotion(e.value)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 28 }}>{e.emoji}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.textArea}
              placeholder={formType === 'good' ? '记录对方做的暖心事...' : '记下对方的"罪行"...'}
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
              <TouchableOpacity style={s.imageBtn} onPress={pickImage}>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.sm }}>{imageUri ? '📷 已选择图片' : '📷 添加图片'}</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={() => setImageUri(null)}>
                  <Text style={{ color: Colors.error, fontSize: FontSizes.sm }}>✕ 移除</Text>
                </TouchableOpacity>
              )}
            </View>
            {uploading && <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs }}>上传图片中...</Text>}
            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={[s.modalSubmit, submitting && s.disabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={formType === 'good' ? Gradients.love : Gradients.hate}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.modalSubmitGrad}
                >
                  <Text style={s.modalSubmitText}>{submitting ? '提交中...' : '提交'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setShowForm(false); setImageUri(null) }}>
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },

  coldWarBanner: { borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  coldWarGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  coldWarTitle: { color: '#93c5fd', fontSize: FontSizes.lg, fontWeight: '800', marginTop: Spacing.sm },
  coldWarDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 4 },
  reconcileBtn: { marginTop: Spacing.md, borderRadius: BorderRadius.md, overflow: 'hidden' },
  reconcileGrad: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, alignItems: 'center', borderRadius: BorderRadius.md },
  reconcileText: { color: Colors.white, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.small },
  statGood: { borderTopWidth: 2, borderTopColor: Colors.success },
  statGrudge: { borderTopWidth: 2, borderTopColor: Colors.hate },
  statCoins: { borderTopWidth: 2, borderTopColor: Colors.gold },
  statNum: { fontSize: FontSizes.xxl, fontWeight: '800', marginTop: 2 },
  statLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 },

  btnRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.card },
  actionGrad: { paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: BorderRadius.md },
  actionText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: '800' },

  sectionTitle: { color: Colors.text, fontSize: FontSizes.lg, fontWeight: '800', letterSpacing: 0.5 },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },

  recordCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.small, marginBottom: Spacing.sm },
  recordGood: { borderLeftWidth: 3, borderLeftColor: Colors.success },
  recordGrudge: { borderLeftWidth: 3, borderLeftColor: Colors.hate },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emojiBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recordMeta: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
  recordDate: { color: Colors.textMuted, fontSize: FontSizes.xs },
  coinBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  coinText: { fontSize: FontSizes.xs, fontWeight: '700' },
  recordContent: { color: Colors.text, marginTop: Spacing.sm, fontSize: FontSizes.md, lineHeight: 22 },

  renewBtn: { marginTop: Spacing.sm, alignSelf: 'flex-start', backgroundColor: 'rgba(132,94,194,0.12)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(132,94,194,0.25)' },
  renewBtnText: { color: Colors.hateLight, fontSize: FontSizes.xs, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', textAlign: 'center' },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', letterSpacing: 1 },
  emotionGrid: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  emotionBtn: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surfaceLight, alignItems: 'center', minWidth: 76 },
  emotionGoodActive: { borderColor: Colors.success, backgroundColor: 'rgba(74,222,128,0.1)', ...Shadows.glow(Colors.success) },
  emotionHateActive: { borderColor: Colors.hate, backgroundColor: 'rgba(132,94,194,0.1)', ...Shadows.glow(Colors.hate) },
  textArea: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSizes.md, minHeight: 96 },
  imageBtn: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md },
  modalSubmit: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  modalSubmitGrad: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md },
  modalSubmitText: { color: Colors.white, fontWeight: '800', fontSize: FontSizes.md },
  modalCancel: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  disabled: { opacity: 0.5 },
})
