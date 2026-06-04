import { useState } from 'react'
import { coupleApi } from '../services'
import { useAppStore } from '../store'

export default function Couple() {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { couple, fetchCouple, user } = useAppStore()

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      await coupleApi.create()
      await fetchCouple()
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePair = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError('')
    try {
      await coupleApi.pair(inviteCode.trim())
      await fetchCouple()
    } catch (err: any) {
      setError(err.response?.data?.detail || '配对失败')
    } finally {
      setLoading(false)
    }
  }

  if (couple) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">💑</div>
          <h2 className="text-2xl font-bold mb-2">已配对成功！</h2>
          {couple.partner ? (
            <p className="text-gray-400 mb-4">
              你和 <span className="text-love font-bold">{couple.partner.nickname}</span> 已结对
            </p>
          ) : (
            <p className="text-gray-400 mb-4">等待对方加入...</p>
          )}
          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">邀请码</p>
            <p className="text-3xl font-mono font-bold text-gold tracking-widest">{couple.invite_code}</p>
            <p className="text-xs text-gray-500 mt-1">把邀请码发给另一半</p>
          </div>
          <p className="text-sm text-gray-500">邀请码: {couple.invite_code}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💑</div>
          <h2 className="text-2xl font-bold">情侣配对</h2>
          <p className="text-gray-400 text-sm mt-2">创建或加入一个情侣空间</p>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">创建新空间</h3>
            <p className="text-gray-400 text-sm mb-4">生成邀请码，让另一半加入</p>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-love w-full disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建空间 ❤️'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">或者</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <div className="bg-surface rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-center">加入已有空间</h3>
            <input
              type="text"
              placeholder="输入邀请码"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-surface-light rounded-lg border border-gray-700 focus:border-hate focus:outline-none text-white text-center text-xl tracking-widest font-mono mb-3"
              maxLength={6}
            />
            <button
              onClick={handlePair}
              disabled={loading || !inviteCode.trim()}
              className="btn-hate w-full disabled:opacity-50"
            >
              {loading ? '配对中...' : '加入空间 💜'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}
