const app = getApp()

Page({
  data: {
    user: null,
    couple: null,
    initial: '',
    hasCouple: false,
    partnerName: '',
    coupleStatus: '',
    rules: [
      { icon: '💚', title: '记好加分', desc: '记录对方的暖心事，双方各得 5 爱情币' },
      { icon: '💜', title: '记仇扣分', desc: '记录对方的罪行，对方扣 3 爱情币' },
      { icon: '💰', title: '爱情商店', desc: '用爱情币兑换道具和礼物' },
      { icon: '🧊', title: '冷战模式', desc: '温度低于 30° 触发冷战，每日扣除额外爱情币' },
      { icon: '🔥', title: '关系温度', desc: '记录影响温度，温度越高关系越好' },
      { icon: '💌', title: '情书系统', desc: '给对方写信，解锁特殊成就' },
    ],
  },

  onLoad() {
    this.refreshData()
  },

  onShow() {
    this.refreshData()
  },

  refreshData() {
    const user = app.globalData.user
    const couple = app.globalData.couple
    if (!user) return

    const initial = (user.nickname || user.username || '?').charAt(0).toUpperCase()
    const hasCouple = !!(couple && couple.partner)
    const partnerName = hasCouple ? couple.partner.nickname || couple.partner.username : ''
    let coupleStatus = '单身'
    if (hasCouple) {
      if (couple.cold_war_status === 'active') {
        coupleStatus = '冷战'
      } else if (couple.temperature >= 80) {
        coupleStatus = '热恋'
      } else {
        coupleStatus = '在一起'
      }
    }

    this.setData({
      user,
      couple,
      initial,
      hasCouple,
      partnerName,
      coupleStatus,
    })
  },

  goToAchievements() {
    wx.navigateTo({ url: '/pages/achievements/achievements' })
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      confirmColor: '#ff4d6d',
      success: (res) => {
        if (res.confirm) {
          app.doLogout()
        }
      },
    })
  },

  copyInviteCode() {
    const couple = this.data.couple
    if (!couple || !couple.invite_code) return
    wx.setClipboardData({
      data: couple.invite_code,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' })
      },
    })
  },

  onShareAppMessage() {
    return { title: 'LoveHate - 爱恨情仇', path: '/pages/login/login' }
  },
})
