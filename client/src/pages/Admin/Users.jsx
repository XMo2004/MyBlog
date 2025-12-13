import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Shield, UserPlus, UserMinus, Trash2, Crown } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Toast from '../../components/Toast'

const RoleBadge = ({ role }) => {

  const cls = role === 'admin'
    ? 'bg-purple-500/10 text-purple-500'
    : role === 'editor'
    ? 'bg-blue-500/10 text-blue-500'
    : 'bg-muted/50 text-muted-foreground'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{role}</span>
}

const MembershipBadge = ({ type }) => {
  const cls = type === 'pro'
    ? 'bg-yellow-500/10 text-yellow-600'
    : type === 'plus'
    ? 'bg-blue-500/10 text-blue-600'
    : 'bg-muted/50 text-muted-foreground'
  
  const label = type === 'pro' ? 'Pro' : type === 'plus' ? 'Plus' : 'Regular'

  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
    {type !== 'regular' && <Crown size={10} />}
    {label}
  </span>
}

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [order, setOrder] = useState('asc')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selected, setSelected] = useState([])
  const [passwordEditId, setPasswordEditId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * pageSize
      const res = await adminApi.listUsers({ q: query, limit: pageSize, offset, order })
      setUsers(res.data.data)
      setTotal(res.data.total)
      setSelected([])
    } catch {
      setMessage({ type: 'error', text: '加载用户列表失败' })
    } finally {
      setLoading(false)
    }
  }, [query, page, pageSize, order])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  

  const updateRole = async (id, role) => {
    setBusyId(id)
    setMessage({ type: '', text: '' })
    try {
      await adminApi.updateUserRole(id, role)
      setMessage({ type: 'success', text: '角色更新成功' })
      await fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || '角色更新失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setBusyId(null)
    }
  }

  const updateMembership = async (id, membershipType) => {
    setBusyId(id)
    setMessage({ type: '', text: '' })
    try {
      await adminApi.updateUserMembership(id, membershipType)
      setMessage({ type: 'success', text: '会员等级更新成功' })
      await fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || '会员等级更新失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setBusyId(null)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('确定要删除此用户吗？这将删除该用户的所有文章和评论，且无法恢复！')) return
    setBusyId(id)
    setMessage({ type: '', text: '' })
    try {
      await adminApi.deleteUser(id)
      setMessage({ type: 'success', text: '用户已删除' })
      await fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || '删除用户失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setBusyId(null)
    }
  }

  const beginEditPassword = (id) => {

    setPasswordEditId(id)
    setNewPassword('')
    setConfirmPassword('')
    setMessage({ type: '', text: '' })
  }

  const cancelEditPassword = () => {
    setPasswordEditId(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  const savePassword = async (id) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: '密码至少 6 位' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入不一致' })
      return
    }
    setBusyId(id)
    try {
      await adminApi.updateUserPassword(id, newPassword)
      setMessage({ type: 'success', text: '密码已更新' })
      cancelEditPassword()
    } catch (err) {
      const msg = err.response?.data?.message || '更新密码失败'
      setMessage({ type: 'error', text: msg })
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => u.username.toLowerCase().includes(q))
  }, [users, query])

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    const ids = filtered.filter(u => u.username !== 'xmo2004').map(u => u.id)
    const allSelected = ids.every(id => selected.includes(id))
    setSelected(allSelected ? [] : ids)
  }

  const batchUpdate = async (role) => {
    if (selected.length === 0) return
    setMessage({ type: '', text: '' })
    try {
      await adminApi.batchUpdateRole(selected, role)
      setMessage({ type: 'success', text: '批量更新成功' })
      await fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || '批量更新失败'
      setMessage({ type: 'error', text: msg })
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="space-y-6 max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户与角色管理</h1>
          <p className="text-sm text-muted-foreground mt-1">分配编辑权限，撤销编辑权限，仅管理员可操作。</p>
        </div>
      </div>

      <Toast 
        message={message.text} 
        type={message.type} 
        onClose={() => setMessage({ type: '', text: '' })} 
      />

      <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            id="search-users"
            name="search-users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按用户名搜索..."
            aria-label="搜索用户"
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm 2xl:text-base 2xl:px-4 2xl:py-3 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => batchUpdate('editor')}
            disabled={selected.length === 0}
            className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-md font-medium hover:bg-blue-500/20 disabled:opacity-50 text-xs"
          >批量设为编辑</button>
          <button
            onClick={() => batchUpdate('user')}
            disabled={selected.length === 0}
            className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-md font-medium hover:bg-muted/70 disabled:opacity-50 text-xs"
          >批量撤销编辑</button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground">排序</label>
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="bg-background border border-border rounded-md px-2 py-1 text-xs">
              <option value="desc">创建时间倒序</option>
              <option value="asc">创建时间正序</option>
            </select>
            <label className="text-xs text-muted-foreground">每页</label>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)) }} className="bg-background border border-border rounded-md px-2 py-1 text-xs">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto border border-border rounded-md">
          <table className="w-full text-sm 2xl:text-base">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left text-muted-foreground font-medium">
                <th className="p-3 2xl:p-4"><input type="checkbox" id="select-all-users" name="select-all-users" aria-label="全选用户" onChange={toggleSelectAll} checked={filtered.filter(u => u.username !== 'xmo2004').map(u => u.id).every(id => selected.includes(id)) && filtered.filter(u => u.username !== 'xmo2004').length > 0} /></th>
                <th className="p-3 2xl:p-4">ID</th>
                <th className="p-3 2xl:p-4">用户名</th>
                <th className="p-3 2xl:p-4">角色</th>
                <th className="p-3 2xl:p-4">会员等级</th>
                <th className="p-3 2xl:p-4">创建时间</th>
                <th className="p-3 2xl:p-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <React.Fragment key={u.id}>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 2xl:p-4"><input type="checkbox" id={`select-user-${u.id}`} name={`select-user-${u.id}`} aria-label={`选择用户 ${u.username}`} disabled={u.username === 'xmo2004'} checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td className="p-3 2xl:p-4 font-mono text-xs 2xl:text-sm text-muted-foreground">{u.id}</td>
                  <td className="p-3 2xl:p-4 font-medium">{u.username}</td>
                  <td className="p-3 2xl:p-4"><RoleBadge role={u.role} /></td>
                  <td className="p-3 2xl:p-4"><MembershipBadge type={u.membershipType || 'regular'} /></td>
                  <td className="p-3 2xl:p-4 text-xs 2xl:text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="p-3 2xl:p-4">
                    {u.username === 'xmo2004' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Shield size={14} /> 管理员不可修改</span>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            disabled={busyId === u.id}
                            onClick={() => updateRole(u.id, u.role === 'editor' ? 'user' : 'editor')}
                            type="button"
                            className={`px-3 py-1 rounded-md font-medium disabled:opacity-50 text-xs inline-flex items-center gap-1 ${
                              u.role === 'editor'
                                ? 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                                : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                            }`}
                          >
                            {u.role === 'editor' ? <UserMinus size={14} /> : <UserPlus size={14} />}
                            {u.role === 'editor' ? '撤销编辑' : '设为编辑'}
                          </button>
                          
                          <select 
                            value={u.membershipType || 'regular'} 
                            onChange={(e) => updateMembership(u.id, e.target.value)}
                            disabled={busyId === u.id}
                            className="px-2 py-1 bg-background border border-border rounded-md text-xs"
                          >
                            <option value="regular">普通会员</option>
                            <option value="plus">Plus会员</option>
                            <option value="pro">Pro会员</option>
                          </select>

                          {passwordEditId === u.id ? null : (
                            <button
                              disabled={busyId === u.id}
                              onClick={() => beginEditPassword(u.id)}
                              type="button"
                              className="px-3 py-1 bg-secondary/50 text-muted-foreground rounded-md font-medium hover:bg-secondary disabled:opacity-50 text-xs"
                            >修改密码</button>
                          )}
                          <button
                            disabled={busyId === u.id}
                            onClick={() => deleteUser(u.id)}
                            type="button"
                            className="px-3 py-1 bg-red-500/10 text-red-500 rounded-md font-medium hover:bg-red-500/20 disabled:opacity-50 text-xs inline-flex items-center gap-1"
                          >
                            <Trash2 size={14} /> 删除
                          </button>
                        </div>

                        
                      </div>
                    )}
                  </td>
                </tr>
                {passwordEditId === u.id && (
                  <tr>
                    <td colSpan="6" className="p-3 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="password"
                          id={`new-password-${u.id}`}
                          name="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="新密码至少 6 位"
                          aria-label="新密码"
                          autoComplete="new-password"
                          className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          type="password"
                          id={`confirm-password-${u.id}`}
                          name="confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="确认新密码"
                          aria-label="确认新密码"
                          autoComplete="new-password"
                          className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          disabled={busyId === u.id}
                          onClick={() => savePassword(u.id)}
                          type="button"
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 text-xs"
                        >保存密码</button>
                        <button
                          disabled={busyId === u.id}
                          onClick={cancelEditPassword}
                          type="button"
                          className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-md font-medium hover:bg-muted/70 disabled:opacity-50 text-xs"
                        >取消</button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">未找到匹配用户</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">共 {total} 项</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-md text-xs disabled:opacity-50"
            >上一页</button>
            <span className="text-xs">第 {page} 页</span>
            <button
              disabled={page * pageSize >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-md text-xs disabled:opacity-50"
            >下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
