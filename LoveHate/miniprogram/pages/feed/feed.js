const app = getApp()

function relativeTime(dateStr) {
  const now = Date.now()
  const date = new Date(dateStr)
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MOODS = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'love', label: '恋爱', emoji: '🥰' },
  { value: 'grateful', label: '感恩', emoji: '🙏' },
  { value: 'excited', label: '兴奋', emoji: '🎉' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'thinking', label: '思考', emoji: '🤔' },
]

Page({
  data: {
    posts: [],
    showForm: false,
    content: '',
    mood: '',
    imageUri: null,
    submitting: false,
    uploading: false,
    moods: MOODS,
    user: null,
  },

  onLoad() {
    const user = app.globalData.user
    this.setData({ user })
  },

  onShow() {
    this.loadPosts()
  },

  onPullDownRefresh() {
    this.loadPosts().then(() => wx.stopPullDownRefresh())
  },

  async loadPosts() {
    try {
      const posts = await app.request({ url: '/posts', data: { limit: 30 } })
      const userId = app.globalData.user?.id
      const formatted = (posts || []).map(p => ({
        ...p,
        timeText: relativeTime(p.created_at),
        isMine: p.author_id === userId,
        moodObj: MOODS.find(m => m.value === p.mood),
      }))
      this.setData({ posts: formatted })
    } catch {}
  },

  openForm() {
    this.setData({ showForm: true, content: '', mood: '', imageUri: null })
  },

  closeForm() {
    this.setData({ showForm: false })
  },

  selectMood(e) {
    this.setData({ mood: e.currentTarget.dataset.value })
  },

  handleInput(e) {
    this.setData({ content: e.detail.value })
  },

  async pickImage() {
    const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] })
    if (res.tempFiles[0]) this.setData({ imageUri: res.tempFiles[0].tempFilePath })
  },

  removeImage() {
    this.setData({ imageUri: null })
  },

  async handleSubmit() {
    const { content, mood, imageUri } = this.data
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
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
        url: '/posts',
        method: 'POST',
        data: { content: content.trim(), image_url: imageUrl, mood: mood || undefined },
      })
      this.setData({ showForm: false, content: '', mood: '', imageUri: null })
      this.loadPosts()
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '发布失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async handleLike(e) {
    const id = e.currentTarget.dataset.id
    try {
      const res = await app.request({ url: `/posts/${id}/like`, method: 'POST' })
      const posts = this.data.posts.map(p => {
        if (p.id === id) {
          return { ...p, liked: res.liked, likes: res.likes }
        }
        return p
      })
      this.setData({ posts })
    } catch {}
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const res = await new Promise((resolve) => {
      wx.showModal({ title: '删除动态', content: '确定要删除这条动态吗？', confirmColor: '#ff4d6d', success: resolve })
    })
    if (!res.confirm) return
    try {
      await app.request({ url: `/posts/${id}`, method: 'DELETE' })
      this.setData({ posts: this.data.posts.filter(p => p.id !== id) })
      wx.showToast({ title: '已删除', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '删除失败', icon: 'none' })
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({ urls: [url], current: url })
  },

  onShareAppMessage() {
    return { title: 'LoveHate - 情侣空间', path: '/pages/login/login' }
  },
})
