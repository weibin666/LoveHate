import { useState } from 'react'
import { useAppStore } from '../store'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login, register } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isLogin) {
        await login(username, password)
      } else {
        if (!nickname.trim()) {
          setError('请输入昵称')
          setSubmitting(false)
          return
        }
        await register(username, nickname, password)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl animate-float opacity-20">💖</div>
        <div className="absolute top-40 right-20 text-5xl animate-float opacity-15" style={{ animationDelay: '1s' }}>💔</div>
        <div className="absolute bottom-30 left-20 text-4xl animate-float opacity-15" style={{ animationDelay: '0.5s' }}>💕</div>
        <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-20" style={{ animationDelay: '1.5s' }}>🔥</div>
      </div>

      <div className="glass-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-love">Love</span>
            <span className="text-hate">Hate</span>
          </h1>
          <p className="text-gray-400 text-sm">爱恨情仇 · 情侣情绪博弈场</p>
        </div>

        <div className="flex mb-6 bg-surface rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              isLogin ? 'bg-love text-white' : 'text-gray-400'
            }`}
            onClick={() => setIsLogin(true)}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              !isLogin ? 'bg-hate text-white' : 'text-gray-400'
            }`}
            onClick={() => setIsLogin(false)}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 focus:border-love focus:outline-none transition-colors text-white"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="昵称（对方看到的名称）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 focus:border-love focus:outline-none transition-colors text-white"
                required
              />
            </div>
          )}

          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 focus:border-love focus:outline-none transition-colors text-white"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-love disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '请稍候...' : isLogin ? '登录 ❤️' : '注册 💜'}
          </button>
        </form>
      </div>
    </div>
  )
}
