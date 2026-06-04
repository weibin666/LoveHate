import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { shopApi, ShopItem, Purchase } from '../services'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

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
    <SafeAreaView style={s.container}>
      <View style={s.tabWrap}>
        <View style={s.tabTrack}>
          <TouchableOpacity style={[s.tab, tab === 'shop' && s.tabActive]} onPress={() => setTab('shop')} activeOpacity={0.7}>
            {tab === 'shop' && <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabIndicator} />}
            <Text style={[s.tabText, tab === 'shop' && s.tabTextActive]}>🏪 商店</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'bag' && s.tabActive]} onPress={() => setTab('bag')} activeOpacity={0.7}>
            {tab === 'bag' && <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabIndicator} />}
            <Text style={[s.tabText, tab === 'bag' && s.tabTextActive]}>🎒 我的券</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'shop' ? (
          <>
            <Text style={s.sectionLabel}>🔨 惩罚券</Text>
            {punishments.map((item) => (
              <View key={item.id} style={s.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemNameRed}>{item.name}</Text>
                  {item.description ? <Text style={s.itemDesc}>{item.description}</Text> : null}
                </View>
                <TouchableOpacity style={[s.buyBtnWrap, buying === item.id && s.disabled]} onPress={() => handleBuy(item.id)} disabled={buying === item.id} activeOpacity={0.7}>
                  <LinearGradient colors={Gradients.hate} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.buyGrad}>
                    <Text style={s.buyBtnText}>{buying === item.id ? '...' : `${item.price} 💰`}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={s.sectionLabel}>🎁 甜蜜券</Text>
            {rewards.map((item) => (
              <View key={item.id} style={s.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemNamePink}>{item.name}</Text>
                  {item.description ? <Text style={s.itemDesc}>{item.description}</Text> : null}
                </View>
                <TouchableOpacity style={[s.buyBtnWrap, buying === item.id && s.disabled]} onPress={() => handleBuy(item.id)} disabled={buying === item.id} activeOpacity={0.7}>
                  <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.buyGrad}>
                    <Text style={s.buyBtnText}>{buying === item.id ? '...' : `${item.price} 💰`}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)} activeOpacity={0.7}>
              <Text style={s.addBtnText}>+ 自定义商品</Text>
            </TouchableOpacity>
          </>
        ) : (
          purchases.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 36 }}>🎫</Text>
              <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>还没有购买任何券</Text>
            </View>
          ) : (
            purchases.map((p) => (
              <View key={p.id} style={[s.itemCard, p.is_used && { opacity: 0.45 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text, fontWeight: '700', fontSize: FontSizes.md }}>🎫 {p.item_name}</Text>
                  <Text style={s.itemDesc}>{new Date(p.created_at).toLocaleDateString('zh-CN')}</Text>
                </View>
                <View style={[s.badge, p.is_used ? s.badgeUsed : s.badgeActive]}>
                  <Text style={[s.badgeText, p.is_used ? { color: Colors.textMuted } : { color: Colors.gold }]}>{p.is_used ? '已使用' : '待使用'}</Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>自定义商品</Text>
            <TextInput style={s.input} placeholder="商品名称" placeholderTextColor={Colors.textMuted} value={newItem.name} onChangeText={(t) => setNewItem({ ...newItem, name: t })} />
            <TextInput style={s.input} placeholder="描述（可选）" placeholderTextColor={Colors.textMuted} value={newItem.description} onChangeText={(t) => setNewItem({ ...newItem, description: t })} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={[s.typeBtn, newItem.item_type === 'punishment' && { borderColor: Colors.hate, backgroundColor: 'rgba(132,94,194,0.15)' }]}
                onPress={() => setNewItem({ ...newItem, item_type: 'punishment' })}
              >
                <Text style={{ color: Colors.text, fontWeight: '600' }}>惩罚券 🔨</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, newItem.item_type === 'reward' && { borderColor: Colors.love, backgroundColor: 'rgba(255,77,109,0.15)' }]}
                onPress={() => setNewItem({ ...newItem, item_type: 'reward' })}
              >
                <Text style={{ color: Colors.text, fontWeight: '600' }}>甜蜜券 💝</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={s.input} placeholder="价格" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={String(newItem.price)} onChangeText={(t) => setNewItem({ ...newItem, price: parseInt(t) || 0 })} />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity style={s.createBtn} onPress={handleCreate} activeOpacity={0.7}>
                <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.createGrad}>
                  <Text style={s.createText}>添加</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}>
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
  tabWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  tabTrack: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 3, ...Shadows.small },
  tab: { flex: 1, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tabActive: {},
  tabIndicator: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BorderRadius.md },
  tabText: { color: Colors.textMuted, fontWeight: '700', fontSize: FontSizes.sm, zIndex: 1 },
  tabTextActive: { color: Colors.bg },
  scrollContent: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  sectionLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: Spacing.sm, marginBottom: Spacing.xs },
  itemCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.small },
  itemNameRed: { color: '#fca5a5', fontWeight: '700', fontSize: FontSizes.md },
  itemNamePink: { color: '#f9a8d4', fontWeight: '700', fontSize: FontSizes.md },
  itemDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
  buyBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  buyGrad: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  buyBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.sm },
  addBtn: { borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  addBtnText: { color: Colors.textMuted, fontWeight: '600' },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  badgeActive: { backgroundColor: 'rgba(255,215,0,0.12)' },
  badgeUsed: { backgroundColor: Colors.surfaceLight },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.sm },
  modalTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', textAlign: 'center' },
  input: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, color: Colors.text, fontSize: FontSizes.md },
  typeBtn: { flex: 1, backgroundColor: Colors.surfaceLight, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  createBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  createGrad: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md },
  createText: { color: Colors.bg, fontWeight: '800' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  disabled: { opacity: 0.5 },
})
