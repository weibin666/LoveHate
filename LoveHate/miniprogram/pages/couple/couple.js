const app = getApp()

Page({
  data: { loading: false },

  async handleCreate() {
    this.setData({ loading: true })
    try {
      await app.request({ url: '/couple/create', method: 'POST' })
      await app.fetchCouple()
      const couple = app.globalData.couple
      if (couple) this.setData({ couple })
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '创建失败', icon: 'none' })
    } finally { this.setData({ loading: false }) }
  },

  handleInput(e) { this.setData({ inviteCode: e.detail.value.toUpperCase() }) },

  async handlePair() {
    const { inviteCode } = this.data
    if (!inviteCode || !inviteCode.trim()) return
    this.setData({ loading: true })
    try {
      await app.request({ url: '/couple/pair', method: 'POST', data: { invite_code: inviteCode.trim() } })
      await app.fetchCouple()
      wx.switchTab({ url: '/pages/home/home' })
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '配对失败', icon: 'none' })
    } finally { this.setData({ loading: false }) }
  },
})
