import { useAppStore } from '../store'

export default function Profile() {
  const { user, couple, logout } = useAppStore()

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 pb-24">
      <div className="glass-card p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-love to-hate rounded-full mx-auto flex items-center justify-center text-3xl mb-4">
          {user.nickname.charAt(0)}
        </div>
        <h2 className="text-xl font-bold">{user.nickname}</h2>
        <p className="text-gray-400 text-sm">@{user.username}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-gold/20 px-4 py-2 rounded-full">
          <span className="text-gold font-bold">{user.coins}</span>
          <span className="text-gold text-sm">💰 爱情币</span>
        </div>
      </div>

      {couple && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">💑 情侣信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">状态</span>
              <span className={couple.status === 'active' ? 'text-green-400' : 'text-gray-400'}>
                {couple.status === 'active' ? '甜蜜中 💕' : '已分开'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">邀请码</span>
              <span className="text-gold font-mono">{couple.invite_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">关系温度</span>
              <span className="text-white">{couple.temperature.toFixed(1)}°</span>
            </div>
            {couple.partner && (
              <div className="flex justify-between">
                <span className="text-gray-400">另一半</span>
                <span className="text-love">{couple.partner.nickname}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">🎮 玩法说明</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p>💚 <strong className="text-green-400">记好</strong>：记录对方做的暖心事，积攒爱情币</p>
          <p>💜 <strong className="text-purple-400">记仇</strong>：记录对方惹你生气的事，扣爱情币（30天自动过期原谅）</p>
          <p>🌡️ <strong className="text-yellow-400">温度计</strong>：根据记录实时变化</p>
          <p>🧊 <strong className="text-blue-400">冷战模式</strong>：24小时内3条记仇自动触发</p>
          <p>🏪 <strong className="text-gold">复仇商店</strong>：用爱情币兑换惩罚券或甜蜜券</p>
          <p>✉️ <strong className="text-pink-400">信箱</strong>：写道歉信或情书，对方接受后可获得额外爱情币</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors"
      >
        退出登录
      </button>
    </div>
  )
}
