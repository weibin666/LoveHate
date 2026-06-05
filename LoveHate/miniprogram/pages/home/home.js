const app = getApp()

Page({
  data: {
    records: [],
    stats: null,
    showForm: false,
    formType: 'good',
    emotion: '',
    content: '',
    imageUri: null,
    submitting: false,
    uploading: false,
    notification: null,
    goodEmotions: [
      { value: 'happy', label: '开心', emoji: '😊' },
      { value: 'warm', label: '超暖', emoji: '🥰' },
      { value: 'heart', label: '心动', emoji: '😍' },
    ],
    grudgeEmotions: [
      { value: 'annoyed', label: '微烦', emoji: '😒' },
      { value: 'angry', label: '不爽', emoji: '😤' },
      { value: 'furious', label: '暴怒', emoji: '😡' },
    ],
  },

  onLoad() { this.loadData() },
  onShow() { if (app.globalData.couple) this.loadData() },

  async loadData() {
    try {
      const [records, stats] = await Promise.all([
        app.request({ url: '/records', data: { limit: 20 } }),
        app.request({ url: '/records/stats' }),
      ])
      this.setData({ records: records || [], stats })
    } catch {}
  },

  openForm(e) {
    this.setData({ showForm: true, formType: e.currentTarget.dataset.type, emotion: '', content: '', imageUri: null })
  },

  closeForm() { this.setData({ showForm: false }) },

  selectEmotion(e) { this.setData({ emotion: e.currentTarget.dataset.value }) },

  handleInput(e) { this.setData({ content: e.detail.value }) },

  async pickImage() {
    const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] })
    if (res.tempFiles[0]) this.setData({ imageUri: res.tempFiles[0].tempFilePath })
  },

  removeImage() { this.setData({ imageUri: null }) },

  async handleSubmit() {
    const { emotion, content, formType, imageUri } = this.data
    if (!emotion) { wx.showToast({ title: '请选择情绪', icon: 'none' }); return }
    if (!content.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    const couple = app.globalData.couple
    if (!couple || !couple.partner) { wx.showToast({ title: '未找到另一半', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      let imageUrl
      if (imageUri) {
        this.setData({ uploading: true })
        const uploadRes = await app.uploadFile(imageUri)
        imageUrl = uploadRes.url
        this.setData({ uploading: false })
      }
      await app.request({
        url: '/records', method: 'POST',
        data: { target_id: couple.partner.id, record_type: formType, emotion, content: content.trim(), image_url: imageUrl },
      })
      this.setData({ showForm: false, emotion: '', content: '', imageUri: null })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '提交失败', icon: 'none' })
    } finally { this.setData({ submitting: false }) }
  },

  async handleRenew(e) {
    const id = e.currentTarget.dataset.id
    const res = await new Promise((resolve) => {
      wx.showModal({ title: '续期记仇', content: '花费 10 💰 续期30天？', confirmColor: '#845ec2', success: resolve })
    })
    if (!res.confirm) return
    try {
      await app.request({ url: `/records/${id}/renew`, method: 'POST' })
      wx.showToast({ title: '续期成功！', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '续期失败', icon: 'none' })
    }
  },

  async handleReconcile() {
    try {
      await app.request({ url: '/game/coldwar/reconcile', method: 'POST', data: { want_reconcile: true } })
      await app.fetchCouple()
      this.loadData()
    } catch {}
  },

  getEmotions() {
    return this.data.formType === 'good' ? this.data.goodEmotions : this.data.grudgeEmotions
  },

  onShareAppMessage() {
    return { title: 'LoveHate - 爱恨情仇', path: '/pages/login/login' }
  },
})
