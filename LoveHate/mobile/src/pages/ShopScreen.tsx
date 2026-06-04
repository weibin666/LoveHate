import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { shopApi, ShopItem, Purchase } from '../services'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

export default function ShopScreen() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [tab, setTab] = useState<'shop' | 'bag'>('shop')
  const [showCreate, setShowCreate] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', description: '', item_type: 'punishment', price: 20 })
  const [buying, setBuying] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [r1, r2] = await Promise.all([shopApi.getItems(), shopApi.getPurchases()])
      setItems(r1.data); setPurchases(r2.data)
    } catch {}
  }

  useEffect(() => { loadData() }, [])

  const handleBuy = async (itemId: string) => {
    setBuying(itemId)
    try { await shopApi.buyItem(itemId); loadData() }
    catch (err: any) { Alert.alert('购买失败', err.response?.data?.detail || '请重试') }
    finally { setBuying(null) }
  }

  const handleCreate = async () => {
    if (!newItem.name.trim()) return
    try {
      await shopApi.createItem({ name: newItem.name.trim(), description: newItem.description || undefined, item_type: newItem.item_type, price: newItem.price })
      setShowCreate(false); setNewItem({ name: '', description: '', item_type: 'punishment', price: 20 }); loadData()
    } catch {}
  }

  const punishments = items.filter((i) => i.item_type === 'punishment')
  const rewards = items.filter((i) => i.item_type === 'reward')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'shop' && styles.tabActive]} onPress={() => setTab('shop')}>
          <Text style={[styles.tabText, tab === 'shop' && styles.tabTextActive]}>🏪 商店</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'bag' && styles.tabActive]} onPress={() => setTab('bag')}>
          <Text style={[styles.tabText, tab === 'bag' && styles.tabTextActive]}>🎒 我的券</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tab === 'shop' ? (
          <>
            {punishments.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNameRed}>🔨 {item.name}</Text>
                  {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                </View>
                <TouchableOpacity style={[styles.buyBtn, styles.buyBtnHate, buying === item.id && styles.disabled]} onPress={() => handleBuy(item.id)} disabled={buying === item.id}>
                  <Text style={styles.buyBtnText}>{buying === item.id ? '...' : `${item.price} 💰`}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.sectionTitle}>🎁 甜蜜券</Text>
            {rewards.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNamePink}>💝 {item.name}</Text>
                  {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                </View>
                <TouchableOpacity style={[styles.buyBtn, styles.buyBtnLove, buying === item.id && styles.disabled]} onPress={() => handleBuy(item.id)} disabled={buying === item.id}>
                  <Text style={styles.buyBtnText}>{buying === item.id ? '...' : `${item.price} 💰`}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.addBtnText}>+ 自定义商品</Text>
            </TouchableOpacity>
          </>
        ) : (
          purchases.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36 }}>🎫</Text>
              <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>还没有购买任何券</Text>
            </View>
          ) : (
            purchases.map((p) => (
              <View key={p.id} style={[styles.itemCard, p.is_used && { opacity: 0.5 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.white, fontWeight: '600' }}>🎫 {p.item_name}</Text>
                  <Text style={styles.itemDesc}>{new Date(p.created_at).toLocaleDateString('zh-CN')}</Text>
                </View>
                <View style={[styles.badge, p.is_used ? styles.badgeUsed : styles.badgeActive]}>
                  <Text style={styles.badgeText}>{p.is_used ? '已使用' : '待使用'}</Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>自定义商品</Text>
            <TextInput style={styles.input} placeholder="商品名称" placeholderTextColor={Colors.textMuted} value={newItem.name} onChangeText={(t) => setNewItem({ ...newItem, name: t })} />
            <TextInput style={styles.input} placeholder="描述（可选）" placeholderTextColor={Colors.textMuted} value={newItem.description} onChangeText={(t) => setNewItem({ ...newItem, description: t })} />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                style={[styles.typeBtn, newItem.item_type === 'punishment' && { backgroundColor: Colors.hate }]}
                onPress={() => setNewItem({ ...newItem, item_type: 'punishment' })}
              >
                <Text style={{ color: Colors.white, fontWeight: '600' }}>惩罚券 🔨</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newItem.item_type === 'reward' && { backgroundColor: Colors.love }]}
                onPress={() => setNewItem({ ...newItem, item_type: 'reward' })}
              >
                <Text style={{ color: Colors.white, fontWeight: '600' }}>甜蜜券 💝</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="价格" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={String(newItem.price)} onChangeText={(t) => setNewItem({ ...newItem, price: parseInt(t) || 0 })} />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity style={styles.loveBtnFull} onPress={handleCreate}><Text style={styles.btnText}>添加</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>取消</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  itemCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  itemNameRed: { color: '#fca5a5', fontWeight: '600', fontSize: FontSizes.md },
  itemNamePink: { color: '#f9a8d4', fontWeight: '600', fontSize: FontSizes.md },
  itemDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
  buyBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  buyBtnHate: { backgroundColor: Colors.hate },
  buyBtnLove: { backgroundColor: Colors.love },
  buyBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm },
  disabled: { opacity: 0.5 },
  sectionTitle: { color: '#f9a8d4', fontSize: FontSizes.lg, fontWeight: 'bold', marginTop: Spacing.md },
  addBtn: { borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  addBtnText: { color: Colors.textMuted },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeActive: { backgroundColor: 'rgba(255,215,0,0.2)' },
  badgeUsed: { backgroundColor: Colors.surfaceLight },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', textAlign: 'center' },
  input: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, color: Colors.white, fontSize: FontSizes.md },
  typeBtn: { flex: 1, backgroundColor: Colors.surfaceLight, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  loveBtnFull: { flex: 1, backgroundColor: Colors.gold, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.bg, fontWeight: '700' },
})
