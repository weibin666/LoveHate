import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios'
import api from '../services/api'
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme'

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

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, date: dateStr, ...days[dateStr] })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth}><Text style={styles.navBtn}>◀</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{year}年{month}月</Text>
        <TouchableOpacity onPress={nextMonth}><Text style={styles.navBtn}>▶</Text></TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={loadReport}>
          <Text style={{ color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm }}>📊 周报</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekCell}><Text style={styles.weekText}>{d}</Text></View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarCells.map((cell, i) => (
          <View key={i} style={styles.dayCell}>
            {cell ? (
              <View style={[styles.dayInner, cell.color ? { backgroundColor: cell.color + '33' } : null, { borderColor: cell.color || 'transparent' }]}>
                <Text style={[styles.dayText, cell.mood === 'good' ? { color: Colors.success } : cell.mood === 'bad' ? { color: '#a78bfa' } : null]}>
                  {cell.day}
                </Text>
                {cell.total > 0 && <Text style={styles.dayCount}>{cell.total}</Text>}
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {showReport && report && (
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>📊 关系周报</Text>
          <Text style={styles.reportPeriod}>{report.period.start} ~ {report.period.end}</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>💚 记好</Text>
            <Text style={[styles.reportValue, { color: Colors.success }]}>{report.good_count}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>💜 记仇</Text>
            <Text style={[styles.reportValue, { color: '#a78bfa' }]}>{report.grudge_count}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>💰 爱情币变化</Text>
            <Text style={[styles.reportValue, { color: Colors.gold }]}>{report.total_coins >= 0 ? '+' : ''}{report.total_coins}</Text>
          </View>
          <Text style={styles.verdict}>{report.verdict}</Text>
          <TouchableOpacity onPress={() => setShowReport(false)} style={styles.closeBtn}>
            <Text style={{ color: Colors.textSecondary }}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  navBtn: { color: Colors.textSecondary, fontSize: FontSizes.xl, padding: Spacing.sm },
  monthTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  reportBtn: { backgroundColor: Colors.love, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, position: 'absolute', right: 0 },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  weekCell: { flex: 1, alignItems: 'center' },
  weekText: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayInner: { flex: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.05)' },
  dayText: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600' },
  dayCount: { color: Colors.textMuted, fontSize: 9 },
  reportCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: Spacing.lg, gap: Spacing.sm },
  reportTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold', textAlign: 'center' },
  reportPeriod: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'center' },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  reportLabel: { color: Colors.textSecondary },
  reportValue: { fontWeight: 'bold', fontSize: FontSizes.md },
  verdict: { color: Colors.gold, textAlign: 'center', fontSize: FontSizes.md, marginTop: Spacing.sm, fontWeight: '600' },
  closeBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.sm },
})
