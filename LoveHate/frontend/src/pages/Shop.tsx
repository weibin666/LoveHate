import { useEffect, useState } from 'react'
import { shopApi, ShopItem, Purchase } from '../services'

interface Props {
  coupleId: string
}

export default function Shop({ coupleId }: Props) {
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [tab, setTab] = useState<'shop' | 'bag'>('shop')
  const [showCreate, setShowCreate] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', description: '', item_type: 'punishment', price: 20 })
  const [buying, setBuying] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [itemsRes, purchasesRes] = await Promise.all([
        shopApi.getItems(),
        shopApi.getPurchases(),
      ])
      setItems(itemsRes.data)
      setPurchases(purchasesRes.data)
    } catch {}
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleBuy = async (itemId: string) => {
    setBuying(itemId)
    try {
      await shopApi.buyItem(itemId)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '购买失败')
    }
    setBuying(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await shopApi.createItem(newItem)
      setShowCreate(false)
      setNewItem({ name: '', description: '', item_type: 'punishment', price: 20 })
      loadData()
    } catch {}
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 pb-24">
      <div className="flex gap-2">
        <button
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${tab === 'shop' ? 'bg-gold text-bg' : 'bg-surface text-gray-400'}`}
          onClick={() => setTab('shop')}
        >
          🏪 商店
        </button>
        <button
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${tab === 'bag' ? 'bg-gold text-bg' : 'bg-surface text-gray-400'}`}
          onClick={() => setTab('bag')}
        >
          🎒 我的券
        </button>
      </div>

      {tab === 'shop' ? (
        <>
          <div className="grid grid-cols-1 gap-3">
            {items
              .filter((i) => i.item_type === 'punishment')
              .map((item) => (
                <div key={item.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-red-300">🔨 {item.name}</h4>
                      {item.description && <p className="text-sm text-gray-400 mt-1">{item.description}</p>}
                      {item.is_custom && <span className="text-xs text-gold">自定义</span>}
                    </div>
                    <button
                      onClick={() => handleBuy(item.id)}
                      disabled={buying === item.id}
                      className="btn-hate text-sm px-4 disabled:opacity-50"
                    >
                      {buying === item.id ? '...' : `${item.price} 💰`}
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-bold mb-3 text-pink-300">🎁 甜蜜券</h3>
            <div className="grid grid-cols-1 gap-3">
              {items
                .filter((i) => i.item_type === 'reward')
                .map((item) => (
                  <div key={item.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-pink-300">💝 {item.name}</h4>
                        {item.description && <p className="text-sm text-gray-400 mt-1">{item.description}</p>}
                      </div>
                      <button
                        onClick={() => handleBuy(item.id)}
                        disabled={buying === item.id}
                        className="btn-love text-sm px-4 disabled:opacity-50"
                      >
                        {buying === item.id ? '...' : `${item.price} 💰`}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full py-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gold transition-colors"
          >
            + 自定义商品
          </button>

          {showCreate && (
            <form onSubmit={handleCreate} className="glass-card p-4 space-y-3">
              <input
                type="text"
                placeholder="商品名称"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 bg-surface rounded-lg border border-gray-700 focus:border-gold focus:outline-none text-white"
                required
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-2 bg-surface rounded-lg border border-gray-700 focus:border-gold focus:outline-none text-white"
              />
              <div className="flex gap-3">
                <select
                  value={newItem.item_type}
                  onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
                  className="flex-1 px-4 py-2 bg-surface rounded-lg border border-gray-700 focus:border-gold focus:outline-none text-white"
                >
                  <option value="punishment">惩罚券 🔨</option>
                  <option value="reward">甜蜜券 💝</option>
                </select>
                <input
                  type="number"
                  placeholder="价格"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                  className="w-24 px-4 py-2 bg-surface rounded-lg border border-gray-700 focus:border-gold focus:outline-none text-white"
                  min={1}
                />
              </div>
              <button type="submit" className="btn-gold w-full">添加商品</button>
            </form>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🎫</div>
              <p>还没有购买任何券</p>
            </div>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className={`glass-card p-4 ${p.is_used ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">🎫 {p.item_name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${p.is_used ? 'bg-gray-700 text-gray-400' : 'bg-gold/20 text-gold'}`}>
                    {p.is_used ? '已使用' : '待使用'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(p.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
