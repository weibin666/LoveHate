const app = getApp()

Page({
  data: {
    activeTab: 'shop',
    items: [],
    purchases: [],
    showCreate: false,
    createType: 'punishment',
    createName: '',
    createDesc: '',
    createPrice: 10,
    buying: false,
    creating: false,
    loading: true,
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  onPullDownRefresh() { this.loadData().then(() => wx.stopPullDownRefresh()) },

  async loadData() {
    this.setData({ loading: true })
    try {
      if (this.data.activeTab === 'shop') {
        const items = await app.request({ url: '/game/shop' })
        this.setData({ items: items || [], loading: false })
      } else {
        const purchases = await app.request({ url: '/game/purchases' })
        this.setData({ purchases: purchases || [], loading: false })
      }
    } catch {
      this.setData({ loading: false })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    this.loadData()
  },

  async buyItem(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(i => i.id === id)
    if (!item) return
    const res = await new Promise((resolve) => {
      wx.showModal({
        title: '确认购买',
        content: `花费 ${item.price} 💰 购买「${item.name}」？`,
        confirmColor: '#ff4d6d',
        success: resolve,
      })
    })
    if (!res.confirm) return
    this.setData({ buying: true })
    try {
      await app.request({ url: `/game/shop/${id}/buy`, method: 'POST' })
      wx.showToast({ title: '购买成功！', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '购买失败', icon: 'none' })
    } finally {
      this.setData({ buying: false })
    }
  },

  openCreate() {
    this.setData({ showCreate: true, createType: 'punishment', createName: '', createDesc: '', createPrice: 10 })
  },

  closeCreate() { this.setData({ showCreate: false }) },

  setCreateType(e) { this.setData({ createType: e.currentTarget.dataset.type }) },

  handleNameInput(e) { this.setData({ createName: e.detail.value }) },
  handleDescInput(e) { this.setData({ createDesc: e.detail.value }) },
  handlePriceInput(e) { this.setData({ createPrice: Number(e.detail.value) || 0 }) },

  async handleCreate() {
    const { createName, createDesc, createType, createPrice } = this.data
    if (!createName.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    if (createPrice <= 0) { wx.showToast({ title: '价格需大于0', icon: 'none' }); return }
    this.setData({ creating: true })
    try {
      await app.request({
        url: '/game/shop', method: 'POST',
        data: { name: createName.trim(), description: createDesc.trim() || undefined, item_type: createType, price: createPrice },
      })
      this.setData({ showCreate: false })
      wx.showToast({ title: '创建成功！', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '创建失败', icon: 'none' })
    } finally {
      this.setData({ creating: false })
    }
  },
})