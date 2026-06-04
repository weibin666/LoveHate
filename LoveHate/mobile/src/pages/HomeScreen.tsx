import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { recordApi, coldWarApi, CoupleInfo, User, Record } from '../services'
import { uploadApi } from '../services'
import { useAppStore } from '../store'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'
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

  const filteredEmotions = formType === 'good'
    ? EMOTIONS.filter((e) => GOOD_EMOTIONS.includes(e.value))
    : EMOTIONS.filter((e) => GRUDGE_EMOTIONS.includes(e.value))

  const renderRecord = ({ item }: { item: Record }) => {
    const emo = EMOTIONS.find((e) => e.value === item.emotion) || EMOTIONS[0]
    const isGood = item.record_type === 'good'
    return (
      <View style={[styles.recordCard, { borderLeftColor: isGood ? Colors.success : Colors.hate }]}>
        <View style={styles.recordHeader}>
          <Text style={{ fontSize: 18 }}>{emo.emoji}</Text>
          <Text style={styles.recordMeta}>{item.author_nickname} → {item.target_nickname}</Text>
        </View>
        <Text style={styles.recordContent}>{item.content}</Text>
        <View style={styles.recordFooter}>
          <Text style={styles.recordDate}>
            {new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[styles.recordCoins, { color: item.coins_change >= 0 ? Colors.gold : Colors.textMuted }]}>
            {item.coins_change >= 0 ? '+' : ''}{item.coins_change} 💰
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <IceOverlay active={isColdWar} />
      <CoinRain trigger={coinTrigger} count={formType === 'good' ? 10 : 5} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isColdWar && (
          <View style={styles.coldWarBanner}>
            <Text style={{ fontSize: 40 }}>🧊</Text>
            <Text style={styles.coldWarTitle}>冷战模式进行中</Text>
            <Text style={styles.coldWarDesc}>冰层正在蔓延...</Text>
            <TouchableOpacity style={styles.loveBtn} onPress={handleReconcile}>
              <Text style={styles.btnText}>我想和好 💔➡️❤️</Text>
            </TouchableOpacity>
          </View>
        )}

        <TemperatureBar temperature={couple.temperature} />

        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 24 }}>💚</Text>
              <Text style={styles.statNum}>{stats.good_count}</Text>
              <Text style={styles.statLabel}>记好</Text>
            </View>
            <View style={[styles.statCard, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 24 }}>💜</Text>
              <Text style={[styles.statNum, { color: Colors.hate }]}>{stats.grudge_count}</Text>
              <Text style={styles.statLabel}>记仇</Text>
            </View>
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.goodBtn}
          onPress={() => { setFormType('good'); setEmotion(''); setImageUri(null); setShowForm(true) }}
        >
          <Text style={styles.bigBtnText}>💚 记好</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.grudgeBtn}
          onPress={() => { setFormType('grudge'); setEmotion(''); setImageUri(null); setShowForm(true) }}
          >
            <Text style={styles.bigBtnText}>💜 记仇</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>📜 最近记录</Text>
        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>📝</Text>
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>还没有记录，快去记好或记仇吧！</Text>
          </View>
        ) : (
          records.map((r) => <View key={r.id}>{renderRecord({ item: r })}</View>)
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{formType === 'good' ? '💚 记个好' : '💜 记个仇'}</Text>
            <Text style={styles.emotionLabel}>选择情绪</Text>
            <View style={styles.emotionGrid}>
              {filteredEmotions.map((e) => (
                <TouchableOpacity
                  key={e.value}
                  style={[
                    styles.emotionBtn,
                    emotion === e.value && (formType === 'good' ? styles.emotionBtnGoodActive : styles.emotionBtnHateActive),
                  ]}
                  onPress={() => setEmotion(e.value)}
                >
                  <Text style={{ fontSize: 28 }}>{e.emoji}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={formType === 'good' ? '记录对方做的暖心事...' : '记下对方的"罪行"...'}
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                <Text style={{ color: Colors.textSecondary }}>{imageUri ? '📷 已选择图片' : '📷 添加图片'}</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={() => setImageUri(null)}>
                  <Text style={{ color: Colors.error }}>✕ 移除</Text>
                </TouchableOpacity>
              )}
            </View>
            {uploading && <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs }}>上传图片中...</Text>}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalSubmit, formType === 'good' ? { backgroundColor: Colors.love } : { backgroundColor: Colors.hate }, submitting && styles.disabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.btnText}>{submitting ? '提交中...' : '提交'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowForm(false); setImageUri(null) }}>
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  coldWarBanner: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center' },
  coldWarTitle: { color: '#93c5fd', fontSize: FontSizes.lg, fontWeight: 'bold' },
  coldWarDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statNum: { color: Colors.success, fontSize: FontSizes.xxl, fontWeight: 'bold' },
  statLabel: { color: Colors.textMuted, fontSize: FontSizes.xs },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  goodBtn: { flex: 1, backgroundColor: Colors.love, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  grudgeBtn: { flex: 1, backgroundColor: Colors.hate, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  bigBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: '700' },
  sectionTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  recordCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  recordMeta: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  recordContent: { color: Colors.white, marginTop: Spacing.sm, fontSize: FontSizes.md },
  recordFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  recordDate: { color: Colors.textMuted, fontSize: FontSizes.xs },
  recordCoins: { fontSize: FontSizes.xs, fontWeight: '600' },
  loveBtn: { backgroundColor: Colors.love, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  btnText: { color: Colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', textAlign: 'center' },
  emotionLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  emotionGrid: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  emotionBtn: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight, alignItems: 'center', minWidth: 80 },
  emotionBtnGoodActive: { borderColor: Colors.success, backgroundColor: 'rgba(74,222,128,0.1)' },
  emotionBtnHateActive: { borderColor: Colors.hate, backgroundColor: 'rgba(132,94,194,0.1)' },
  textArea: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.white, fontSize: FontSizes.md, minHeight: 96 },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md },
  modalSubmit: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  modalCancel: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  disabled: { opacity: 0.5 },
  imageBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
})
