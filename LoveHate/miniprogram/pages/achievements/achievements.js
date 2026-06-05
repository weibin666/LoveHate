const app = getApp()

Page({
  data: {
    achievements: [],
    unlockedCount: 0,
    totalCount: 0,
    progress: 0,
    loading: true,
  },

  onLoad() {
    this.loadAchievements()
  },

  onPullDownRefresh() {
    this.loadAchievements().then(() => wx.stopPullDownRefresh())
  },

  async loadAchievements() {
    this.setData({ loading: true })
    try {
      const res = await app.request({ url: '/achievements' })
      const achievements = res || []
      const unlockedCount = achievements.filter(a => a.unlocked).length
      const totalCount = achievements.length
      const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
      this.setData({ achievements, unlockedCount, totalCount, progress, loading: false })
    } catch {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },
})
