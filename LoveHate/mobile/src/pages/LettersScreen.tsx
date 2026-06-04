import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { letterApi, Letter } from '../services'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

const TEMPLATES = {
  apology: ['亲爱的，我知道我错了，原谅我好吗？🥺', '我不应该那样做，对不起！以后一定改！', '你是对的，我错了。求求你原谅我吧～'],
  love: ['遇见你是我最幸运的事 💕', '不管吵多少次架，我还是最爱你！', '谢谢你一直包容我，我会更努力对你好的！'],
}

export default function LettersScreen() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'apology' | 'love'>('love')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadLetters = async () => {
    try { const r = await letterApi.getList(); setLetters(r.data) } catch {}
  }

  useEffect(() => { loadLetters() }, [])

  const handleSend = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await letterApi.send({ letter_type: formType, content: content.trim() })
      setContent(''); setShowForm(false); loadLetters()
    } catch {} finally { setSubmitting(false) }
  }

  const handleAccept = async (id: string, accepted: boolean) => {
    try { await letterApi.accept(id, accepted); loadLetters() } catch {}
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>✉️ 信箱</Text>
        <TouchableOpacity style={s.writeBtn} onPress={() => setShowForm(true)} activeOpacity={0.7}>
          <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.writeBtnGrad}>
            <Text style={s.writeBtnText}>写信 ✉️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {letters.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm, fontSize: FontSizes.md }}>信箱空空如也</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: Spacing.xs }}>给对方写一封信吧～</Text>
          </View>
        ) : (
          letters.map((l) => (
            <View key={l.id} style={[s.letterCard, l.letter_type === 'apology' ? s.letterApology : s.letterLove]}>
              <View style={s.letterHeader}>
                <View style={[s.typeBadge, { backgroundColor: l.letter_type === 'apology' ? 'rgba(132,94,194,0.15)' : 'rgba(255,77,109,0.15)' }]}>
                  <Text style={{ fontSize: 14 }}>{l.letter_type === 'apology' ? '🙏' : '💕'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.letterMeta}>{l.sender_nickname}</Text>
                </View>
                <Text style={s.letterDate}>
                  {new Date(l.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={s.letterContent}>{l.content}</Text>
              {l.is_accepted === null && (
                <View style={s.letterActions}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(l.id, true)} activeOpacity={0.7}>
                    <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.acceptGrad}>
                      <Text style={s.acceptText}>接受 ❤️</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleAccept(l.id, false)}>
                    <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>拒绝 💔</Text>
                  </TouchableOpacity>
                </View>
              )}
              {l.is_accepted === true && <Text style={s.acceptedTag}>✅ 已接受</Text>}
              {l.is_accepted === false && <Text style={s.rejectedTag}>💔 已拒绝</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>写信 ✉️</Text>
            <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, formType === 'apology' && s.typeBtnActiveApology]}
                onPress={() => setFormType('apology')}
                activeOpacity={0.7}
              >
                {formType === 'apology' && <LinearGradient colors={Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.typeBtnGrad} />}
                <Text style={[s.typeBtnText, formType === 'apology' && s.typeBtnTextActive]}>🙏 道歉信</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, formType === 'love' && s.typeBtnActiveLove]}
                onPress={() => setFormType('love')}
                activeOpacity={0.7}
              >
                {formType === 'love' && <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.typeBtnGrad} />}
                <Text style={[s.typeBtnText, formType === 'love' && s.typeBtnTextActive]}>💕 情书</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.sectionLabel}>快速模板</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {TEMPLATES[formType].map((tpl, i) => (
                <TouchableOpacity key={i} style={s.templateBtn} onPress={() => setContent(tpl)}>
                  <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.xs }} numberOfLines={1}>{tpl.slice(0, 12)}...</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.textArea} placeholder={formType === 'apology' ? '写下你的歉意...' : '写下你想说的话...'} placeholderTextColor={Colors.textMuted} value={content} onChangeText={setContent} multiline numberOfLines={5} textAlignVertical="top" />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={handleSend} disabled={submitting} activeOpacity={0.7}>
                <LinearGradient colors={formType === 'apology' ? Gradients.hate : Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  <Text style={s.submitText}>{submitting ? '发送中...' : '发送 ✉️'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
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
  writeBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  writeBtnGrad: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  writeBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.sm },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  letterCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.card, marginBottom: Spacing.sm },
  letterApology: { borderLeftWidth: 3, borderLeftColor: Colors.hate },
  letterLove: { borderLeftWidth: 3, borderLeftColor: Colors.love },
  letterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  letterMeta: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
  letterDate: { color: Colors.textMuted, fontSize: FontSizes.xs },
  letterContent: { color: Colors.text, fontSize: FontSizes.md, lineHeight: 24 },
  letterActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  acceptBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  acceptGrad: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md },
  acceptText: { color: Colors.white, fontWeight: '700' },
  rejectBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  acceptedTag: { color: Colors.success, fontSize: FontSizes.sm, fontWeight: '600', marginTop: Spacing.sm },
  rejectedTag: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600', marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', textAlign: 'center' },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: { flex: 1, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  typeBtnActiveApology: { borderColor: Colors.hate },
  typeBtnActiveLove: { borderColor: Colors.love },
  typeBtnGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.9, borderRadius: BorderRadius.md },
  typeBtnText: { color: Colors.textMuted, fontWeight: '700', zIndex: 1 },
  typeBtnTextActive: { color: Colors.white },
  sectionLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1 },
  templateBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.borderLight },
  textArea: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSizes.md, minHeight: 120 },
  submitBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  submitGrad: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md },
  submitText: { color: Colors.white, fontWeight: '800' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  disabled: { opacity: 0.5 },
})
