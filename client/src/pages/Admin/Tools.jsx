import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, RefreshCw, Shield, ListFilter } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Toast from '../../components/Toast'

const AdminTools = () => {
  const [backups, setBackups] = useState([])
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const [logs, setLogs] = useState([])
  const [logFilters, setLogFilters] = useState({ model: '', action: '', userId: '' })

  const fetchBackups = async () => {
    try {
      const res = await adminApi.listBackups()
      setBackups(res.data)
    } catch (e) {}
  }

  const doBackup = async () => {
    setIsBackingUp(true)
    setMessage({ type: '', text: '' })
    try {
      await adminApi.backup()
      await fetchBackups()
      setMessage({ type: 'success', text: '备份成功' })
    } catch (error) {
      console.error('Failed to backup', error)
      setMessage({ type: 'error', text: '备份失败' })
    } finally {
      setIsBackingUp(false)
    }
  }

  const doRestore = async () => {
    if (!selectedBackup) return
    if (!window.confirm(`确定恢复到备份 ${selectedBackup} 吗？当前数据将被覆盖`)) return
    setMessage({ type: '', text: '' })
    try {
      await adminApi.restore(selectedBackup)
      setMessage({ type: 'success', text: '恢复完成，请刷新页面' })
    } catch (error) {
      console.error('Failed to restore', error)
      setMessage({ type: 'error', text: '恢复失败' })
    }
  }

  const fetchLogs = async () => {
    const params = {}
    if (logFilters.model) params.model = logFilters.model
    if (logFilters.action) params.action = logFilters.action
    if (logFilters.userId) params.userId = logFilters.userId
    const res = await adminApi.logs(params)
    setLogs(res.data)
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [logFilters])

  return (
        <>
            <Toast message={message.text} type={message.type} onClose={() => setMessage({ ...message, text: '' })} />
            <div className="space-y-6 max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">系统工具</h1>
                    <p className="text-sm text-muted-foreground mt-1">管理系统备份与查看操作日志。</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <Database size={18} className="text-primary" /> 数据备份与恢复
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={doBackup}
                                disabled={isBackingUp}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                <Shield size={16} /> {isBackingUp ? '备份中...' : '立即备份'}
                            </motion.button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">恢复备份</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedBackup}
                                    onChange={(e) => setSelectedBackup(e.target.value)}
                                    className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">选择备份文件...</option>
                                    {backups.map(b => (
                                        <option key={b.file} value={b.file}>{b.file} ({new Date(b.createdAt || Date.now()).toLocaleDateString()})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={doRestore}
                                    disabled={!selectedBackup}
                                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    恢复
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">注意：恢复将覆盖当前所有数据。备份文件位于服务端 `server/backups` 目录。</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4 2xl:col-span-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <ListFilter size={18} className="text-primary" /> 操作日志
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                            placeholder="模型 (如 Post)"
                            value={logFilters.model}
                            onChange={(e) => setLogFilters({ ...logFilters, model: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        />
                        <input
                            placeholder="动作 (create...)"
                            value={logFilters.action}
                            onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        />
                        <input
                            placeholder="用户ID"
                            value={logFilters.userId}
                            onChange={(e) => setLogFilters({ ...logFilters, userId: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-[400px] overflow-auto border border-border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr className="text-left text-muted-foreground font-medium">
                                    <th className="p-3 font-medium">时间</th>
                                    <th className="p-3 font-medium">模型</th>
                                    <th className="p-3 font-medium">动作</th>
                                    <th className="p-3 font-medium">目标ID</th>
                                    <th className="p-3 font-medium">用户</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-3 font-mono text-xs">{log.model}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action === 'delete' ? 'bg-destructive/10 text-destructive' : log.action === 'create' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-xs text-muted-foreground">{log.targetId ?? '-'}</td>
                                        <td className="p-3 font-mono text-xs text-muted-foreground">{log.userId ?? '-'}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-muted-foreground">暂无日志记录</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default AdminTools
