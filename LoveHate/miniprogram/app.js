App({
  globalData: {
    user: null,
    couple: null,
    token: null,
    wsConnected: false,
    lastMessage: null,
    apiBase: 'https://lovsun.cn/api',
    wsBase: 'wss://lovsun.cn',
  },

  onLaunch() {
    const token = wx.getStorageSync('lovehate_token')
    if (token) {
      this.globalData.token = token
      this.initUser()
    }
  },

  async initUser() {
    try {
      const res = await this.request({ url: '/auth/me' })
      this.globalData.user = res.data
      if (res.data.couple_id) {
        await this.fetchCouple()
      }
    } catch {
      wx.removeStorageSync('lovehate_token')
      this.globalData.token = null
      this.globalData.user = null
    }
  },

  async fetchCouple() {
    try {
      const res = await this.request({ url: '/couple/info' })
      this.globalData.couple = res.data
      return res.data
    } catch {
      this.globalData.couple = null
      return null
    }
  },

  request(options) {
    const token = this.globalData.token
    const header = { 'Content-Type': 'application/json', ...(options.header || {}) }
    if (token) header.Authorization = `Bearer ${token}`

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header,
        success: (res) => {
          if (res.statusCode === 401) {
            this.refreshToken().then(() => {
              header.Authorization = `Bearer ${this.globalData.token}`
              wx.request({
                url: `${this.globalData.apiBase}${options.url}`,
                method: options.method || 'GET',
                data: options.data,
                header,
                success: (r) => { r.statusCode >= 400 ? reject(r) : resolve(r.data) },
                fail: reject,
              })
            }).catch(reject)
          } else if (res.statusCode >= 400) {
            reject(res)
          } else {
            resolve(res.data)
          }
        },
        fail: reject,
      })
    })
  },

  refreshToken() {
    const oldToken = this.globalData.token
    if (!oldToken) return Promise.reject(new Error('No token'))
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}/auth/refresh`,
        method: 'POST',
        data: { token: oldToken },
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200 && res.data.access_token) {
            this.globalData.token = res.data.access_token
            wx.setStorageSync('lovehate_token', res.data.access_token)
            resolve()
          } else {
            this.doLogout()
            reject()
          }
        },
        fail: () => { this.doLogout(); reject() },
      })
    })
  },

  doLogout() {
    wx.removeStorageSync('lovehate_token')
    this.globalData.token = null
    this.globalData.user = null
    this.globalData.couple = null
    wx.reLaunch({ url: '/pages/login/login' })
  },

  uploadFile(filePath) {
    const token = this.globalData.token
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.globalData.apiBase}/upload/image`,
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          const data = JSON.parse(res.data)
          resolve(data)
        },
        fail: reject,
      })
    })
  },
})
