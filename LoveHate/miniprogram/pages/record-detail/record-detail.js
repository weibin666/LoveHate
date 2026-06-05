const app = getApp()

Page({
  data: { record: null, loading: true },

  onLoad(options) {
    if (options.id) this.loadRecord(options.id)
  },

  async loadRecord(id) {
    try {
      const records = await app.request({ url: '/records', data: { limit: 1 } })
      const record = (records || []).find((r) => r.id === id)
      this.setData({ record: record || null, loading: false })
    } catch { this.setData({ loading: false }) }
  },

  async handleRenew() {
    const { record } = this.data
    if (!record) return
    const res = await new Promise((resolve) => {
      wx.showModal({ title: '续期记仇', content: '花费 10 💰 续期30天？', confirmColor: '#845ec2', success: resolve })
    })
    if (!res.confirm) return
    try {
      await app.request({ url: `/records/${record.id}/renew`, method: 'POST' })
      wx.showToast({ title: '续期成功！', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '续期失败', icon: 'none' })
    }
  },

  async handleDelete() {
    const { record } = this.data
    if (!record) return
    const res = await new Promise((resolve) => {
      wx.showModal({ title: '删除记录', content: '确定删除这条记录吗？', confirmColor: '#f87171', success: resolve })
    })
    if (!res.confirm) return
    try {
      await app.request({ url: `/records/${record.id}`, method: 'DELETE' })
      wx.showToast({ title: '已删除', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },
})
