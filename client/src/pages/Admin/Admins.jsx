import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Shield } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Toast from '../../components/Toast'
import Loading from '../../components/Loading'

const Admins = () => {
  const [account, setAccount] = useState({ id: null, username: '' })
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchMe()
  }, [])

  const fetchMe = async () => {
    try {
      const res = await adminApi.me()
      setAccount(res.data)
    } catch (e) {
      if (e.response && (e.response.status === 401 || e.response.status === 404)) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }
      setMessage({ type: 'error', text: '加载管理员信息失败' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' })
      setIsSaving(false)
      return
    }
    try {
      await adminApi.updateMe({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setMessage({ type: 'success', text: '账户已更新，部分变更需要重新登录生效' })
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }))
      await fetchMe()
    } catch (err) {
      const msg = err.response?.data?.message || '更新失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理员管理</h1>
          <p className="text-sm text-muted-foreground mt-1">修改管理员用户名与密码。</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? '保存中...' : '保存更改'}
        </motion.button>
      </div>

      <Toast 
        message={message.text} 
        type={message.type} 
        onClose={() => setMessage({ type: '', text: '' })} 
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl 2xl:max-w-4xl 3xl:max-w-5xl mx-auto">
        <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Shield size={18} className="text-primary" /> 当前账户
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">当前用户名</label>
            <input
              type="text"
              value={account.username || ''}
              readOnly
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground"
            />
          </div>
        </div>

        <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-foreground">修改账户信息</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">用户名</label>
            <input
              type="text"
              value={account.username || ''}
              readOnly
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">管理员用户名固定为 xmo2004，无法修改。</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">当前密码</label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="验证当前密码"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">新密码</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="至少 6 位字符"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">确认新密码</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={form.confirmNewPassword}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="再次输入"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">更改用户名后，显示信息将在重新登录后完全生效。</div>
        </div>
      </form>
    </div>
  )
}

export default Admins
