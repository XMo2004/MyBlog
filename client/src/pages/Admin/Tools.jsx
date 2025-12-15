import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, RefreshCw, Shield, ListFilter, HardDrive, FileJson, FileCode, Activity, Server, Cpu, Clock, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Toast from '../../components/Toast'
import Select from '../../components/Select'

const AdminTools = () => {
  const [backups, setBackups] = useState([])
  const [databaseType, setDatabaseType] = useState('')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const [logs, setLogs] = useState([])
  const [logFilters, setLogFilters] = useState({ model: '', action: '', userId: '' })
  const [isExporting, setIsExporting] = useState(false)

  // 系统健康状态
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)

  // 获取系统健康状态
  const fetchHealth = async () => {
    setHealthLoading(true)
    try {
      const res = await adminApi.getHealth()
      setHealth(res.data)
    } catch (error) {
      console.error('Failed to fetch health', error)
    } finally {
      setHealthLoading(false)
    }
  }

  // 导出日志
  const exportLogs = async (format) => {
    setIsExporting(true)
    try {
      const params = { ...logFilters, format }
      const res = await adminApi.exportLogs(params)
      const blob = new Blob([res.data], { 
        type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs_${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setMessage({ type: 'success', text: '日志导出成功' })
    } catch (error) {
      console.error('Failed to export logs', error)
      setMessage({ type: 'error', text: '导出失败' })
    } finally {
      setIsExporting(false)
    }
  }

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // 获取备份类型图标
  const getBackupIcon = (type) => {
    switch (type) {
      case 'postgresql': return <FileCode size={14} className="text-blue-500" />
      case 'prisma': return <FileJson size={14} className="text-green-500" />
      case 'sqlite': return <HardDrive size={14} className="text-orange-500" />
      default: return <Database size={14} />
    }
  }

  const fetchBackups = async () => {
    try {
      const res = await adminApi.listBackups()
      // 支持新旧两种响应格式
      if (res.data.backups) {
        setBackups(res.data.backups)
        setDatabaseType(res.data.databaseType || '')
      } else {
        setBackups(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch backups', error)
    }
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
    fetchHealth()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [logFilters])

  return (
        <>
            <Toast message={message.text} type={message.type} onClose={() => setMessage({ ...message, text: '' })} />
            <div className="space-y-8 max-w-[1600px] mx-auto p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">系统工具</h1>
                    <p className="text-muted-foreground">管理系统数据备份与监控操作日志。</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 系统健康监控卡片 */}
                    <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    系统健康状态
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    实时监控服务器和数据库状态
                                </p>
                            </div>
                            <button
                                onClick={fetchHealth}
                                disabled={healthLoading}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={healthLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        
                        {health && (
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {/* 状态指示 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            {health.status === 'healthy' ? (
                                                <CheckCircle className="text-green-500" size={18} />
                                            ) : (
                                                <XCircle className="text-red-500" size={18} />
                                            )}
                                            <span className="text-sm font-medium">系统状态</span>
                                        </div>
                                        <div className={`text-lg font-bold ${health.status === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>
                                            {health.status === 'healthy' ? '正常' : '异常'}
                                        </div>
                                    </div>

                                    {/* 数据库延迟 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="text-blue-500" size={18} />
                                            <span className="text-sm font-medium">数据库</span>
                                        </div>
                                        <div className="text-lg font-bold">{health.database?.latency || 0}ms</div>
                                        <div className="text-xs text-muted-foreground">{health.database?.type}</div>
                                    </div>

                                    {/* 运行时间 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="text-purple-500" size={18} />
                                            <span className="text-sm font-medium">运行时间</span>
                                        </div>
                                        <div className="text-lg font-bold truncate" title={health.server?.uptimeFormatted}>
                                            {health.server?.uptimeFormatted}
                                        </div>
                                    </div>

                                    {/* 内存使用 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cpu className="text-orange-500" size={18} />
                                            <span className="text-sm font-medium">内存使用</span>
                                        </div>
                                        <div className="text-lg font-bold">{health.server?.memory?.heapUsed}</div>
                                        <div className="text-xs text-muted-foreground">/ {health.server?.memory?.heapTotal}</div>
                                    </div>

                                    {/* 数据统计 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Server className="text-green-500" size={18} />
                                            <span className="text-sm font-medium">数据量</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">用户</span>
                                                <span className="font-medium">{health.counts?.users}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">文章</span>
                                                <span className="font-medium">{health.counts?.posts}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 最新备份 */}
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="text-cyan-500" size={18} />
                                            <span className="text-sm font-medium">备份</span>
                                        </div>
                                        <div className="text-sm">
                                            {health.backup?.latest ? (
                                                <>
                                                    <div className="font-medium truncate" title={health.backup.latest.file}>
                                                        {health.backup.total} 个备份
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        最新: {new Date(health.backup.latest.createdAt).toLocaleDateString()}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">无备份</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 备份管理卡片 */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-6 border-b border-border/50 bg-muted/20">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Database className="w-5 h-5 text-primary" />
                                    数据备份
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    当前数据库: 
                                    <span className={`ml-2 font-medium ${
                                        databaseType === 'postgresql' ? 'text-blue-500' : 'text-orange-500'
                                    }`}>
                                        {databaseType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}
                                    </span>
                                </p>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={doBackup}
                                        disabled={isBackingUp}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                    >
                                        <Shield size={18} />
                                        {isBackingUp ? '备份中...' : '新建备份'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={fetchBackups}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all"
                                    >
                                        <RefreshCw size={18} />
                                        刷新列表
                                    </motion.button>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <label className="text-sm font-medium text-foreground">恢复数据</label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={selectedBackup}
                                            onChange={(val) => setSelectedBackup(val)}
                                            options={[
                                                { value: '', label: '选择备份文件...' },
                                                ...backups.map(b => ({ value: b.file, label: b.file }))
                                            ]}
                                            placeholder="选择备份文件..."
                                            className="flex-1"
                                        />
                                        <button
                                            onClick={doRestore}
                                            disabled={!selectedBackup}
                                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            恢复
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground bg-destructive/5 p-2 rounded text-destructive border border-destructive/10">
                                        ⚠️ 警告：恢复操作将完全覆盖当前数据库数据，请谨慎操作。
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 备份历史列表 */}
                        <div className="bg-card rounded-xl border border-border/50 flex-1 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-border/50 bg-muted/20">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    <ListFilter size={16} />
                                    最近备份
                                </h3>
                            </div>
                            <div className="overflow-y-auto max-h-[400px]">
                                {backups.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-border/50">
                                            {backups.map(b => (
                                                <tr key={b.file} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-medium text-foreground flex items-center gap-2">
                                                                {getBackupIcon(b.type)}
                                                                <span className="truncate max-w-[200px]" title={b.file}>{b.file}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span>{formatSize(b.size)}</span>
                                                                <span>•</span>
                                                                <span>{new Date(b.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-sm">暂无备份记录</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 操作日志卡片 */}
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 flex flex-col h-full">
                        <div className="p-6 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-primary" />
                                操作日志
                            </h2>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <input
                                    placeholder="按模型筛选..."
                                    value={logFilters.model}
                                    onChange={(e) => setLogFilters({ ...logFilters, model: e.target.value })}
                                    className="w-full sm:w-28 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    placeholder="按动作筛选..."
                                    value={logFilters.action}
                                    onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                                    className="w-full sm:w-28 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    placeholder="用户ID..."
                                    value={logFilters.userId}
                                    onChange={(e) => setLogFilters({ ...logFilters, userId: e.target.value })}
                                    className="w-full sm:w-24 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => exportLogs('json')}
                                        disabled={isExporting}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                                    >
                                        <Download size={14} />
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => exportLogs('csv')}
                                        disabled={isExporting}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                                    >
                                        <Download size={14} />
                                        CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="p-4 font-medium text-muted-foreground w-[180px]">时间</th>
                                        <th className="p-4 font-medium text-muted-foreground w-[120px]">用户</th>
                                        <th className="p-4 font-medium text-muted-foreground w-[100px]">动作</th>
                                        <th className="p-4 font-medium text-muted-foreground w-[150px]">模型</th>
                                        <th className="p-4 font-medium text-muted-foreground">目标 ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-4 text-muted-foreground whitespace-nowrap font-mono text-xs">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                        {(log.userId || '?').toString().charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="truncate max-w-[80px]" title={log.userId}>{log.userId || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                    log.action === 'delete' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 
                                                    log.action === 'create' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' : 
                                                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs">{log.model}</td>
                                            <td className="p-4 font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={log.targetId}>
                                                {log.targetId ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ListFilter className="w-8 h-8 opacity-20" />
                                                    <p>暂无日志记录</p>
                                                </div>
                                            </td>
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
