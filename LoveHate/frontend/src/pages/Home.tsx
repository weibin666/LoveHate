import { useEffect, useState } from 'react'
import { recordApi, coldWarApi, CoupleInfo, User, Record } from '../services'
import { useAppStore } from '../store'

interface Props {
  couple: CoupleInfo
  user: User
}

const EMOTIONS = [
  { value: 'furious', label: '暴怒', emoji: '😡', color: 'text-red-500' },
  { value: 'angry', label: '不爽', emoji: '😤', color: 'text-orange-500' },
  { value: 'annoyed', label: '微烦', emoji: '😒', color: 'text-yellow-500' },
  { value: 'happy', label: '开心', emoji: '😊', color: 'text-green-400' },
  { value: 'warm', label: '超暖', emoji: '🥰', color: 'text-pink-400' },
  { value: 'heart', label: '心动', emoji: '😍', color: 'text-rose-400' },
]

export default function Home({ couple, user }: Props) {
  const [records, setRecords] = useState<Record[]>([])
  const [stats, setStats] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'good' | 'grudge'>('good')
  const [emotion, setEmotion] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const partner = couple.partner

  const loadData = async () => {
    try {
      const [recordsRes, statsRes] = await Promise.all([
        recordApi.getList({ limit: 20 }),
        recordApi.getStats(),
      ])
      setRecords(recordsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('loadData failed:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getTempEmoji = (temp: number) => {
    if (temp <= 20) return '🧊'
    if (temp <= 30) return '❄️'
    if (temp <= 40) return '🌡️'
    if (temp <= 60) return '🌤️'
    if (temp <= 80) return '☀️'
    return '🔥'
  }

  const getTempLabel = (temp: number) => {
    if (temp <= 20) return '冰封'
    if (temp <= 30) return '冰冻'
    if (temp <= 40) return '微凉'
    if (temp <= 60) return '温暖'
    if (temp <= 80) return '火热'
    return '沸腾'
  }

  const getTempColor = (temp: number) => {
    if (temp <= 20) return 'from-blue-800 to-blue-600'
    if (temp <= 30) return 'from-blue-600 to-cyan-500'
    if (temp <= 40) return 'from-cyan-500 to-green-400'
    if (temp <= 60) return 'from-green-400 to-yellow-400'
    if (temp <= 80) return 'from-yellow-400 to-orange-500'
    return 'from-orange-500 to-red-500'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!emotion) {
      setSubmitError('请选择一个情绪')
      return
    }
    if (!content.trim()) {
      setSubmitError('请输入内容')
      return
    }
    if (!partner) {
      setSubmitError('未找到另一半信息，请刷新页面重试')
      return
    }
    setSubmitting(true)
    try {
      await recordApi.create({
        target_id: partner.id,
        record_type: formType,
        emotion,
        content: content.trim(),
      })
      setContent('')
      setEmotion('')
      setShowForm(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.detail || '提交失败，请重试'
      setSubmitError(msg)
      console.error('submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await recordApi.delete(id)
      loadData()
    } catch {}
  }

  const getEmotionObj = (val: string) => EMOTIONS.find((e) => e.value === val) || EMOTIONS[0]

  const isColdWar = couple.cold_war_status === 'active'

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 pb-24">
      {isColdWar && (
        <div className="glass-card p-6 text-center border-blue-500/30 bg-blue-900/20">
          <div className="text-5xl mb-2">🧊</div>
          <h3 className="text-xl font-bold text-blue-300">冷战模式进行中</h3>
          <p className="text-gray-400 text-sm mt-1">冰层正在蔓延...</p>
          <button
            className="btn-love mt-4 text-sm"
            onClick={async () => {
              await coldWarApi.reconcile(true)
              const { fetchCouple } = useAppStore.getState()
              await fetchCouple()
            }}
          >
            我想和好 💔➡️❤️
          </button>
        </div>
      )}

      <div className="glass-card p-6 text-center">
        <div className="text-4xl mb-2">{getTempEmoji(couple.temperature)}</div>
        <h3 className="text-sm text-gray-400 mb-1">关系温度</h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold">{couple.temperature.toFixed(1)}°</span>
          <span className="text-sm text-gray-400">{getTempLabel(couple.temperature)}</span>
        </div>
        <div className="w-full h-3 bg-surface rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getTempColor(couple.temperature)} transition-all duration-1000`}
            style={{ width: `${couple.temperature}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>🧊 冰封</span>
          <span>🔥 沸腾</span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">💚</div>
            <p className="text-2xl font-bold text-green-400">{stats.good_count}</p>
            <p className="text-xs text-gray-400">记好</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">💜</div>
            <p className="text-2xl font-bold text-purple-400">{stats.grudge_count}</p>
            <p className="text-xs text-gray-400">记仇</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 btn-love py-4 text-lg"
          onClick={() => { setFormType('good'); setEmotion(''); setSubmitError(''); setShowForm(true) }}
        >
          💚 记好
        </button>
        <button
          className="flex-1 btn-hate py-4 text-lg"
          onClick={() => { setFormType('grudge'); setEmotion(''); setSubmitError(''); setShowForm(true) }}
        >
          💜 记仇
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">
            {formType === 'good' ? '💚 记个好' : '💜 记个仇'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">选择情绪</p>
              <div className="grid grid-cols-3 gap-2">
                {EMOTIONS.filter((e) =>
                  formType === 'good'
                    ? ['happy', 'warm', 'heart'].includes(e.value)
                    : ['annoyed', 'angry', 'furious'].includes(e.value)
                ).map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setEmotion(e.value)}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      emotion === e.value
                        ? formType === 'good'
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-purple-400 bg-purple-400/10'
                        : 'border-gray-700 bg-surface hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl">{e.emoji}</div>
                    <div className="text-xs mt-1">{e.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder={
                formType === 'good'
                  ? '记录对方做的暖心事...'
                  : '记下对方的"罪行"...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 focus:border-love focus:outline-none resize-none h-24 text-white"
              required
            />
            {submitError && (
              <p className="text-red-400 text-sm text-center">{submitError}</p>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className={`flex-1 ${formType === 'good' ? 'btn-love' : 'btn-hate'} disabled:opacity-50`}>
                {submitting ? '提交中...' : '提交'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white transition-colors">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold mb-3">📜 最近记录</h3>
        {records.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>还没有记录，快去记好或记仇吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const emo = getEmotionObj(record.emotion)
              return (
                <div
                  key={record.id}
                  className={`glass-card p-4 border-l-4 ${
                    record.record_type === 'good' ? 'border-l-green-400' : 'border-l-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{emo.emoji}</span>
                      <span className="text-sm text-gray-400">
                        {record.author_nickname} → {record.target_nickname}
                      </span>
                    </div>
                    {record.author_id === user.id && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-white">{record.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className={`text-xs font-medium ${record.coins_change >= 0 ? 'text-gold' : 'text-gray-400'}`}>
                      {record.coins_change >= 0 ? '+' : ''}{record.coins_change} 💰
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
