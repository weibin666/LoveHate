const app = getApp()

Page({
  data: {
    letterType: 'love',
    content: '',
    submitting: false,
    apologyTemplates: ['亲爱的，我知道我错了，原谅我好吗？🥺', '我不应该那样做，对不起！以后一定改！', '你是对的，我错了。求求你原谅我吧～'],
    loveTemplates: ['遇见你是我最幸运的事 💕', '不管吵多少次架，我还是最爱你！', '谢谢你一直包容我，我会更努力对你好的！'],
  },

  onLoad(options) {
    if (options.type) this.setData({ letterType: options.type })
  },

  switchType(e) { this.setData({ letterType: e.currentTarget.dataset.type }) },
  handleInput(e) { this.setData({ content: e.detail.value }) },

  useTemplate(e) {
    this.setData({ content: e.currentTarget.dataset.text })
  },

  async handleSubmit() {
    const { letterType, content } = this.data
    if (!content.trim()) { wx.showToast({ title: '写点什么吧', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      await app.request({ url: '/game/letter', method: 'POST', data: { letter_type: letterType, content: content.trim() } })
      wx.showToast({ title: '发送成功 ✉️', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '发送失败', icon: 'none' })
    } finally { this.setData({ submitting: false }) }
  },
})
