const app = getApp()

Page({
  data: {
    mode: 'password',
    isLogin: true,
    username: '',
    nickname: '',
    password: '',
    phone: '',
    smsCode: '',
    submitting: false,
    codeCooldown: 0,
  },

  cooldownTimer: null,

  onUnload() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer)
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  switchTab(e) {
    this.setData({ isLogin: e.currentTarget.dataset.tab === 'login' })
  },

  startCooldown() {
    this.setData({ codeCooldown: 60 })
    this.cooldownTimer = setInterval(() => {
      const cd = this.data.codeCooldown - 1
      if (cd <= 0) {
        clearInterval(this.cooldownTimer)
        this.setData({ codeCooldown: 0 })
      } else {
        this.setData({ codeCooldown: cd })
      }
    }, 1000)
  },

  async sendSms() {
    const { phone } = this.data
    if (!phone || phone.length < 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
    }
    try {
      await app.request({ url: '/auth/sms/send', method: 'POST', data: { phone } })
      this.startCooldown()
      wx.showToast({ title: '验证码已发送', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '发送失败', icon: 'none' })
    }
  },

  async handleSubmit() {
    const { mode, isLogin, username, nickname, password, phone, smsCode } = this.data
    this.setData({ submitting: true })

    try {
      let token
      if (mode === 'sms') {
        if (!phone || phone.length < 11) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return }
        if (!smsCode) { wx.showToast({ title: '请输入验证码', icon: 'none' }); return }
        const res = await app.request({ url: '/auth/sms/login', method: 'POST', data: { phone, code: smsCode } })
        token = res.access_token
      } else {
        if (!username || !password) { wx.showToast({ title: '请输入用户名和密码', icon: 'none' }); return }
        if (!isLogin && !nickname) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return }
        if (isLogin) {
          const res = await app.request({ url: '/auth/login', method: 'POST', data: { username, password } })
          token = res.access_token
        } else {
          await app.request({ url: '/auth/register', method: 'POST', data: { username, nickname, password } })
          const res = await app.request({ url: '/auth/login', method: 'POST', data: { username, password } })
          token = res.access_token
        }
      }

      app.globalData.token = token
      wx.setStorageSync('lovehate_token', token)
      const userRes = await app.request({ url: '/auth/me' })
      app.globalData.user = userRes

      if (userRes.couple_id) {
        await app.fetchCouple()
        wx.switchTab({ url: '/pages/home/home' })
      } else {
        wx.redirectTo({ url: '/pages/couple/couple' })
      }
    } catch (err) {
      wx.showToast({ title: err.data?.detail || '操作失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
