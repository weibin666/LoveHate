import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { letterApi, Letter } from '../services'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✉️ 信箱</Text>
        <TouchableOpacity style={styles.writeBtn} onPress={() => setShowForm(true)}>
          <Text style={{ color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm }}>写信 ✉️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {letters.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>信箱空空如也</Text>
          </View>
        ) : (
          letters.map((l) => (
            <View key={l.id} style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <Text style={{ fontSize: 18 }}>{l.letter_type === 'apology' ? '🙏' : '💕'}</Text>
                <Text style={styles.letterMeta}>{l.sender_nickname}</Text>
                <Text style={styles.letterDate}>
                  {new Date(l.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.letterContent}>{l.content}</Text>
              {l.is_accepted === null && (
                <View style={styles.letterActions}>
                  <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: Colors.love }]} onPress={() => handleAccept(l.id, true)}>
                    <Text style={{ color: Colors.white, fontWeight: '600' }}>接受 ❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAccept(l.id, false)}>
                    <Text style={{ color: Colors.textSecondary }}>拒绝 💔</Text>
                  </TouchableOpacity>
                </View>
              )}
              {l.is_accepted === true && <Text style={styles.acceptedText}>✅ 已接受</Text>}
              {l.is_accepted === false && <Text style={styles.rejectedText}>💔 已拒绝</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>写信 ✉️</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, formType === 'apology' && { backgroundColor: Colors.hate }]} onPress={() => setFormType('apology')}>
                <Text style={{ color: Colors.white, fontWeight: '600' }}>🙏 道歉信</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, formType === 'love' && { backgroundColor: Colors.love }]} onPress={() => setFormType('love')}>
                <Text style={{ color: Colors.white, fontWeight: '600' }}>💕 情书</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: Colors.textMuted, fontSize: FontSizes.xs }}>快速模板：</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {TEMPLATES[formType].map((tpl, i) => (
                <TouchableOpacity key={i} style={styles.templateBtn} onPress={() => setContent(tpl)}>
                  <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.xs }} numberOfLines={1}>{tpl.slice(0, 15)}...</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.textArea} placeholder={formType === 'apology' ? '写下你的歉意...' : '写下你想说的话...'} placeholderTextColor={Colors.textMuted} value={content} onChangeText={setContent} multiline numberOfLines={5} textAlignVertical="top" />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity style={[styles.submitBtn, formType === 'apology' ? { backgroundColor: Colors.hate } : { backgroundColor: Colors.love }, submitting && styles.disabled]} onPress={handleSend} disabled={submitting}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>{submitting ? '发送中...' : '发送 ✉️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerTitle: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: 'bold' },
  writeBtn: { backgroundColor: Colors.love, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  letterCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  letterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  letterMeta: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  letterDate: { color: Colors.textMuted, fontSize: FontSizes.xs },
  letterContent: { color: Colors.white, fontSize: FontSizes.md, lineHeight: 24 },
  letterActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  acceptBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
  rejectBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  acceptedText: { color: Colors.success, fontSize: FontSizes.sm, marginTop: Spacing.sm },
  rejectedText: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', textAlign: 'center' },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: { flex: 1, backgroundColor: Colors.surfaceLight, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  templateBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  textArea: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.white, fontSize: FontSizes.md, minHeight: 120 },
  submitBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  disabled: { opacity: 0.5 },
})
