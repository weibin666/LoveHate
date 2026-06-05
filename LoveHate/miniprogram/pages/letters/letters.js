const app = getApp()

const TEMPLATES = {
  apology: ['亲爱的，我知道我错了，原谅我好吗？🥺', '我不应该那样做，对不起！以后一定改！', '你是对的，我错了。求求你原谅我吧～'],
  love: ['遇见你是我最幸运的事 💕', '不管吵多少次架，我还是最爱你！', '谢谢你一直包容我，我会更努力对你好的！'],
}

Page({
  data: {
    letters: [],
    showWrite: false,
    writeType: 'love',
    writeContent: '',
    templates: TEMPLATES.love,
    sending: false,
    loading: true,
  },

  onLoad() { this.loadLetters() },
  onShow() { this.loadLetters() },
  onPullDownRefresh() { this.loadLetters().then(() => wx.stopPullDownRefresh()) },

  async loadLetters() {
    this.setData({ loading: true })
    try {
      const letters = await app.request({ url: '/game/letters' })
      this.setData({ letters: letters || [], loading: false })
    } catch {
      this.setData({ loading: false })
    }
  },

  openWrite() {
    this.setData({ showWrite: true, writeType: 'love', writeContent: '', templates: TEMPLATES.love })
  },

  closeWrite() { this.setData({ showWrite: false }) },

  setWriteType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ writeType: type, templates: TEMPLATES[type] })
  },

  useTemplate(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ writeContent: this.data.templates[idx] })
  },

  handleContentInput(e) { this.setData({ writeContent: e.detail.value }) },

  async sendLetter() {
    const { writeType, writeContent } = this.data
    if (!writeContent.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    this.setData({ sending: true })
    try {
      await app.request({
        url: '/game/letter', method: 'POST',
        data: { letter_type: writeType, content: writeContent.trim() },
      })
      this.setData({ showWrite: false })
      wx.showToast({ title: '发送成功！', icon: 'success' })
      this.loadLetters()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '发送失败', icon: 'none' })
    } finally {
      this.setData({ sending: false })
    }
  },

  async handleAccept(e) {
    const { id, accept } = e.currentTarget.dataset
    this.setData({ sending: true })
    try {
      await app.request({
        url: `/game/letter/${id}/accept`, method: 'POST',
        data: { accepted: accept },
      })
      wx.showToast({ title: accept ? '已接受 💕' : '已拒绝', icon: 'success' })
      this.loadLetters()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '操作失败', icon: 'none' })
    } finally {
      this.setData({ sending: false })
    }
  },
})