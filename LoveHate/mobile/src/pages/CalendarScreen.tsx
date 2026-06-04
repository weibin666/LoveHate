import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../services/api'
import { Colors, Gradients, Spacing, FontSizes, BorderRadius, Shadows } from '../theme'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [days, setDays] = useState<Record<string, any>>({})
  const [report, setReport] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)

  const loadCalendar = async () => {
    try {
      const res = await api.get(`/calendar/monthly?year=${year}&month=${month}`)
      setDays(res.data.days)
    } catch {}
  }

  const loadReport = async () => {
    try {
      const res = await api.get('/calendar/weekly-report')
      setReport(res.data)
      setShowReport(true)
    } catch {}
  }

  useEffect(() => { loadCalendar() }, [year, month])

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1) } else setMonth(month + 1) }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, date: dateStr, ...days[dateStr] })
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={prevMonth} style={s.navBtn}><Text style={s.navBtnText}>◀</Text></TouchableOpacity>
        <Text style={s.monthTitle}>{year}年{month}月</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navBtn}><Text style={s.navBtnText}>▶</Text></TouchableOpacity>
        <TouchableOpacity style={s.reportBtn} onPress={loadReport} activeOpacity={0.7}>
          <LinearGradient colors={Gradients.love} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.reportBtnGrad}>
            <Text style={s.reportBtnText}>📊 周报</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={s.weekRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={s.weekCell}><Text style={s.weekText}>{d}</Text></View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.calendarGrid}>
          {calendarCells.map((cell, i) => (
            <View key={i} style={s.dayCell}>
              {cell ? (
                <View style={[
                  s.dayInner,
                  cell.mood === 'good' && s.dayGood,
                  cell.mood === 'bad' && s.dayBad,
                  cell.mood === 'neutral' && s.dayNeutral,
                ]}>
                  <Text style={[s.dayText, cell.mood === 'good' ? { color: Colors.success } : cell.mood === 'bad' ? { color: Colors.hateLight } : { color: Colors.gold }]}>{cell.day}</Text>
                  {cell.total > 0 && <View style={s.dayDot} />}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {showReport && report && (
        <View style={s.reportOverlay}>
          <View style={s.reportCard}>
            <View style={s.reportHandle} />
            <Text style={s.reportTitle}>📊 关系周报</Text>
            <Text style={s.reportPeriod}>{report.period.start} ~ {report.period.end}</Text>
            <View style={s.reportStats}>
              <View style={s.reportStatItem}>
                <Text style={s.reportStatEmoji}>💚</Text>
                <Text style={[s.reportStatValue, { color: Colors.success }]}>{report.good_count}</Text>
                <Text style={s.reportStatLabel}>记好</Text>
              </View>
              <View style={s.reportDivider} />
              <View style={s.reportStatItem}>
                <Text style={s.reportStatEmoji}>💜</Text>
                <Text style={[s.reportStatValue, { color: Colors.hateLight }]}>{report.grudge_count}</Text>
                <Text style={s.reportStatLabel}>记仇</Text>
              </View>
              <View style={s.reportDivider} />
              <View style={s.reportStatItem}>
                <Text style={s.reportStatEmoji}>💰</Text>
                <Text style={[s.reportStatValue, { color: Colors.gold }]}>{report.total_coins >= 0 ? '+' : ''}{report.total_coins}</Text>
                <Text style={s.reportStatLabel}>爱情币</Text>
              </View>
            </View>
            <View style={s.verdictWrap}>
              <Text style={s.verdict}>{report.verdict}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowReport(false)} style={s.closeBtn}>
              <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  navBtn: { padding: Spacing.sm },
  navBtnText: { color: Colors.textSecondary, fontSize: FontSizes.lg, fontWeight: '600' },
  monthTitle: { color: Colors.text, fontSize: FontSizes.lg, fontWeight: '800', letterSpacing: 1 },
  reportBtn: { position: 'absolute', right: 0, borderRadius: BorderRadius.md, overflow: 'hidden' },
  reportBtnGrad: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  reportBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.sm },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  weekCell: { flex: 1, alignItems: 'center' },
  weekText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayInner: { flex: 1, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surface, position: 'relative' },
  dayGood: { backgroundColor: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' },
  dayBad: { backgroundColor: 'rgba(132,94,194,0.08)', borderColor: 'rgba(132,94,194,0.2)' },
  dayNeutral: { backgroundColor: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.2)' },
  dayText: { fontSize: FontSizes.md, fontWeight: '700' },
  dayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  reportOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  reportCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', ...Shadows.card, borderWidth: 1, borderColor: Colors.borderLight },
  reportHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.lg },
  reportTitle: { color: Colors.text, fontSize: FontSizes.xl, fontWeight: '800', textAlign: 'center' },
  reportPeriod: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  reportStats: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  reportStatItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  reportStatEmoji: { fontSize: 20 },
  reportStatValue: { fontWeight: '800', fontSize: FontSizes.xxl },
  reportStatLabel: { color: Colors.textMuted, fontSize: FontSizes.xs },
  reportDivider: { width: 1, height: 40, backgroundColor: Colors.borderLight },
  verdictWrap: { backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  verdict: { color: Colors.gold, fontSize: FontSizes.md, fontWeight: '700', textAlign: 'center' },
  closeBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.md },
})
