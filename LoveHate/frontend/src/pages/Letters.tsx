import { useEffect, useState } from 'react'
import { letterApi, Letter } from '../services'

interface Props {
  coupleId: string
}

export default function Letters({ coupleId }: Props) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'apology' | 'love'>('love')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadLetters = async () => {
    try {
      const res = await letterApi.getList()
      setLetters(res.data)
    } catch {}
  }

  useEffect(() => {
    loadLetters()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await letterApi.send({ letter_type: formType, content: content.trim() })
      setContent('')
      setShowForm(false)
      loadLetters()
    } catch {}
    setSubmitting(false)
  }

  const handleAccept = async (letterId: string, accepted: boolean) => {
    try {
      await letterApi.accept(letterId, accepted)
      loadLetters()
    } catch {}
  }

  const TEMPLATES = {
    apology: [
      '亲爱的，我知道我错了，原谅我好吗？🥺',
      '我不应该那样做，对不起！以后一定改！',
      '你是对的，我错了。求求你原谅我吧～',
    ],
    love: [
      '遇见你是我最幸运的事 💕',
      '不管吵多少次架，我还是最爱你！',
      '谢谢你一直包容我，我会更努力对你好的！',
    ],
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">✉️ 信箱</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-love text-sm"
        >
          写信 ✉️
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSend} className="glass-card p-6 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormType('apology')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${formType === 'apology' ? 'bg-hate text-white' : 'bg-surface text-gray-400'}`}
            >
              🙏 道歉信
            </button>
            <button
              type="button"
              onClick={() => setFormType('love')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${formType === 'love' ? 'bg-love text-white' : 'bg-surface text-gray-400'}`}
            >
              💕 情书
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">快速模板：</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES[formType].map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setContent(tpl)}
                  className="text-xs px-3 py-1.5 bg-surface rounded-lg border border-gray-700 text-gray-300 hover:border-love transition-colors"
                >
                  {tpl.slice(0, 15)}...
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={formType === 'apology' ? '写下你的歉意...' : '写下你想说的话...'}
            className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 focus:border-love focus:outline-none resize-none h-32 text-white"
            required
          />
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className={`flex-1 ${formType === 'apology' ? 'btn-hate' : 'btn-love'} disabled:opacity-50`}>
              {submitting ? '发送中...' : '发送 ✉️'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400">
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {letters.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>信箱空空如也</p>
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter.id} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{letter.letter_type === 'apology' ? '🙏' : '💕'}</span>
                <span className="text-sm text-gray-400">{letter.sender_nickname}</span>
                <span className="text-xs text-gray-600">
                  {new Date(letter.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-white leading-relaxed">{letter.content}</p>
              {letter.is_accepted === null && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAccept(letter.id, true)}
                    className="flex-1 btn-love text-sm py-2"
                  >
                    接受 ❤️
                  </button>
                  <button
                    onClick={() => handleAccept(letter.id, false)}
                    className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 text-sm hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    拒绝 💔
                  </button>
                </div>
              )}
              {letter.is_accepted === true && (
                <div className="mt-3 text-sm text-green-400">✅ 已接受</div>
              )}
              {letter.is_accepted === false && (
                <div className="mt-3 text-sm text-gray-500">💔 已拒绝</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
