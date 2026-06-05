import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { postsApi, Post } from '../services'
import { uploadApi } from '../services'
import { useWebSocket } from '../hooks/useWebSocket'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'
import * as ImagePicker from 'expo-image-picker'

const MOODS = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'love', label: '甜蜜', emoji: '🥰' },
  { value: 'grateful', label: '感恩', emoji: '🙏' },
  { value: 'excited', label: '激动', emoji: '🎉' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'thinking', label: '思考', emoji: '🤔' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { lastMessage } = useWebSocket()

  const loadPosts = async () => {
    try {
      const r = await postsApi.getList({ limit: 30 })
      setPosts(r.data)
    } catch {}
  }

  useEffect(() => { loadPosts() }, [])

  useEffect(() => {
    if (lastMessage?.type === 'new_post') loadPosts()
  }, [lastMessage])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri)
  }

  const handleSubmit = async () => {
    if (!content.trim()) { Alert.alert('提示', '写点什么吧'); return }
    setSubmitting(true)
    try {
      let imageUrl: string | undefined
      if (imageUri) {
        const formData = new FormData()
        const filename = imageUri.split('/').pop() || 'photo.jpg'
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: filename } as any)
        const uploadRes = await uploadApi.uploadImage(formData)
        imageUrl = uploadRes.data.url
      }
      await postsApi.create({ content: content.trim(), image_url: imageUrl, mood: mood || undefined })
      setContent(''); setMood(null); setImageUri(null); setShowForm(false); loadPosts()
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || '发布失败')
    } finally { setSubmitting(false) }
  }

  const handleLike = async (postId: string) => {
    try {
      const r = await postsApi.toggleLike(postId)
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, is_liked: r.data.liked, likes: r.data.likes } : p
      ))
    } catch {}
  }

  const handleDelete = (postId: string) => {
    Alert.alert('删除动态', '确定删除这条动态吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try { await postsApi.delete(postId); loadPosts() } catch {}
      }},
    ])
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>💬 分享空间</Text>
        <TouchableOpacity style={s.postBtn} onPress={() => setShowForm(true)} activeOpacity={0.7}>
          <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.postBtnGrad}>
            <Text style={s.postBtnText}>发动态 ✏️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {posts.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 40 }}>💬</Text>
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm, fontSize: FontSizes.md }}>还没有动态</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: Spacing.xs }}>分享你们的故事吧～</Text>
          </View>
        ) : (
          posts.map((p) => (
            <View key={p.id} style={s.postCard}>
              <View style={s.postHeader}>
                <View style={[s.avatarSmall, { backgroundColor: p.author_id === posts[0]?.author_id ? Colors.love : Colors.hate }]}>
                  <Text style={s.avatarSmallText}>{p.author_nickname.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthor}>{p.author_nickname}</Text>
                  <Text style={s.postTime}>{timeAgo(p.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(p.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs }}>···</Text>
                </TouchableOpacity>
              </View>
              {p.mood && (
                <View style={s.moodTag}>
                  <Text style={s.moodTagText}>{MOODS.find((m) => m.value === p.mood)?.emoji} {MOODS.find((m) => m.value === p.mood)?.label}</Text>
                </View>
              )}
              <Text style={s.postContent}>{p.content}</Text>
              <View style={s.postActions}>
                <TouchableOpacity style={s.likeBtn} onPress={() => handleLike(p.id)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 16 }}>{p.is_liked ? '❤️' : '🤍'}</Text>
                  {p.likes > 0 && <Text style={[s.likeCount, { color: p.is_liked ? Colors.love : Colors.textMuted }]}>{p.likes}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>发动态 ✏️</Text>
            <Text style={s.sectionLabel}>心情（可选）</Text>
            <View style={s.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[s.moodBtn, mood === m.value && s.moodBtnActive]}
                  onPress={() => setMood(mood === m.value ? null : m.value)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 1 }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.textArea}
              placeholder="分享你们的日常、心情、故事..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
              <TouchableOpacity style={s.imageBtn} onPress={pickImage}>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.sm }}>{imageUri ? '📷 已选择' : '📷 添加图片'}</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={() => setImageUri(null)}>
                  <Text style={{ color: Colors.error, fontSize: FontSizes.sm }}>✕ 移除</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
                <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  <Text style={s.submitText}>{submitting ? '发布中...' : '发布 💬'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowForm(false); setImageUri(null) }}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800' },
  postBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  postBtnGrad: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  postBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.sm },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  postCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.card },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: '800' },
  postAuthor: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '700' },
  postTime: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 1 },
  moodTag: { backgroundColor: 'rgba(255,215,0,0.08)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginTop: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  moodTagText: { color: Colors.gold, fontSize: FontSizes.xs, fontWeight: '600' },
  postContent: { color: Colors.text, fontSize: FontSizes.md, lineHeight: 24, marginTop: Spacing.sm },
  postActions: { flexDirection: 'row', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  likeCount: { fontSize: FontSizes.sm, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', textAlign: 'center' },
  sectionLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1 },
  moodRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  moodBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surfaceLight, alignItems: 'center', minWidth: 52 },
  moodBtnActive: { borderColor: Colors.gold, backgroundColor: 'rgba(255,215,0,0.1)' },
  textArea: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSizes.md, minHeight: 100 },
  imageBtn: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md },
  submitBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  submitGrad: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md },
  submitText: { color: Colors.white, fontWeight: '800' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  disabled: { opacity: 0.5 },
})
