const app = getApp()

Page({
  data: {
    year: 0,
    month: 0,
    weeks: [],
    dayRecords: {},
    showReport: false,
    report: null,
    loading: true,
    monthLabel: '',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
  },

  onLoad() {
    const now = new Date()
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    })
    this.loadMonth()
    this.loadReport()
  },

  onShow() {
    if (this.data.year) this.loadMonth()
  },

  async loadMonth() {
    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: '/calendar/monthly',
        data: { year: this.data.year, month: this.data.month },
      })
      const dayRecords = res.days || {}
      const weeks = this.buildCalendar(this.data.year, this.data.month, dayRecords)
      this.setData({
        weeks,
        dayRecords,
        monthLabel: `${this.data.year}年${this.data.month}月`,
        loading: false,
      })
    } catch {
      this.setData({ loading: false })
    }
  },

  async loadReport() {
    try {
      const report = await app.request({ url: '/calendar/weekly-report' })
      this.setData({ report })
    } catch {}
  },

  buildCalendar(year, month, dayRecords) {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const weeks = []
    let week = new Array(7).fill(null)

    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = (firstDay + d - 1) % 7
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = dayRecords[dateStr]

      week[dayOfWeek] = {
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        hasRecord: !!record,
        color: record ? record.color : null,
        total: record ? record.total : 0,
        good: record ? record.good : 0,
        grudge: record ? record.grudge : 0,
        mood: record ? record.mood : null,
      }

      if (dayOfWeek === 6 || d === daysInMonth) {
        weeks.push([...week])
        week = new Array(7).fill(null)
      }
    }

    return weeks
  },

  prevMonth() {
    let { year, month } = this.data
    month--
    if (month < 1) { month = 12; year-- }
    this.setData({ year, month }, () => this.loadMonth())
  },

  nextMonth() {
    let { year, month } = this.data
    month++
    if (month > 12) { month = 1; year++ }
    this.setData({ year, month }, () => this.loadMonth())
  },

  showWeeklyReport() {
    this.setData({ showReport: true })
  },

  closeReport() {
    this.setData({ showReport: false })
  },

  onDayTap(e) {
    const { date, hasRecord } = e.currentTarget.dataset
    if (!hasRecord) return
    const record = this.data.dayRecords[date]
    if (record) {
      wx.showModal({
        title: date,
        content: `记录 ${record.total} 条\n✅ 好事 ${record.good}  💜 记仇 ${record.grudge}\n心情: ${record.mood || '无'}`,
        showCancel: false,
        confirmColor: '#ff4d6d',
      })
    }
  },
})
