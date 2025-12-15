import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
    MessageSquare, Trash2, Search, Filter, Calendar, 
    User, FileText, ThumbsUp, AlertCircle, RefreshCw,
    ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { commentsApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';
import DatePicker from '../../components/DatePicker';

const Comments = () => {
    const [comments, setComments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // 分页和筛选
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        sort: 'newest'
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // 批量选择
    const [selectedIds, setSelectedIds] = useState([]);
    const [busyId, setBusyId] = useState(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search: search || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                sort: filters.sort
            };
            const res = await commentsApi.getAll(params);
            setComments(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to fetch comments', error);
            setMessage({ type: 'error', text: '获取评论列表失败' });
        } finally {
            setLoading(false);
        }
    }, [page, search, filters]);

    const fetchStats = async () => {
        try {
            const res = await commentsApi.getStats();
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;
        setBusyId(id);
        try {
            await commentsApi.delete(id);
            setComments(comments.filter(c => c.id !== id));
            setMessage({ type: 'success', text: '评论已删除' });
            fetchStats();
        } catch (error) {
            console.error('Failed to delete comment', error);
            setMessage({ type: 'error', text: '删除失败' });
        } finally {
            setBusyId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 条评论吗？`)) return;
        
        try {
            await commentsApi.bulkDelete(selectedIds);
            setComments(comments.filter(c => !selectedIds.includes(c.id)));
            setSelectedIds([]);
            setMessage({ type: 'success', text: '批量删除成功' });
            fetchStats();
        } catch (error) {
            console.error('Failed to bulk delete', error);
            setMessage({ type: 'error', text: '批量删除失败' });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === comments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(comments.map(c => c.id));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchComments();
    };

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', sort: 'newest' });
        setSearch('');
        setPage(1);
    };

    if (loading && comments.length === 0) return <Loading />;

    return (
        <div className="space-y-6">
            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />

            {/* 页面标题和统计 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquare className="text-primary" size={24} />
                        评论管理
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        管理用户评论，查看评论统计数据
                    </p>
                </div>
                
                {stats && (
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-card border border-border rounded-lg">
                            <div className="text-xs text-muted-foreground">总评论</div>
                            <div className="text-lg font-bold">{stats.total}</div>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border rounded-lg">
                            <div className="text-xs text-muted-foreground">今日新增</div>
                            <div className="text-lg font-bold text-green-500">{stats.todayCount}</div>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border rounded-lg">
                            <div className="text-xs text-muted-foreground">本周</div>
                            <div className="text-lg font-bold">{stats.weekCount}</div>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border rounded-lg">
                            <div className="text-xs text-muted-foreground">本月</div>
                            <div className="text-lg font-bold">{stats.monthCount}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 搜索和筛选栏 */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="搜索评论内容..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                        >
                            搜索
                        </button>
                    </form>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                                showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'
                            }`}
                        >
                            <Filter size={16} />
                            筛选
                        </button>
                        <button
                            onClick={fetchComments}
                            className="p-2 border border-border rounded-md hover:bg-secondary"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {/* 展开的筛选选项 */}
                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-end gap-4 pt-4 border-t border-border"
                    >
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">开始日期</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">结束日期</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">排序</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                            >
                                <option value="newest">最新优先</option>
                                <option value="oldest">最早优先</option>
                                <option value="mostLikes">最多点赞</option>
                            </select>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <X size={14} />
                            重置
                        </button>
                    </motion.div>
                )}

                {/* 批量操作栏 */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">
                            已选择 {selectedIds.length} 项
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20"
                        >
                            <Trash2 size={14} />
                            批量删除
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            取消选择
                        </button>
                    </div>
                )}
            </div>

            {/* 评论列表 */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                        <tr>
                            <th className="p-4 text-left w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === comments.length && comments.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-border"
                                />
                            </th>
                            <th className="p-4 text-left font-medium text-muted-foreground">评论内容</th>
                            <th className="p-4 text-left font-medium text-muted-foreground w-32">用户</th>
                            <th className="p-4 text-left font-medium text-muted-foreground w-48">文章</th>
                            <th className="p-4 text-left font-medium text-muted-foreground w-20">点赞</th>
                            <th className="p-4 text-left font-medium text-muted-foreground w-40">时间</th>
                            <th className="p-4 text-left font-medium text-muted-foreground w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {comments.map(comment => (
                            <tr key={comment.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(comment.id)}
                                        onChange={() => toggleSelect(comment.id)}
                                        className="rounded border-border"
                                    />
                                </td>
                                <td className="p-4">
                                    <p className="line-clamp-2 text-foreground">{comment.content}</p>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                                            {(comment.user?.nickname || comment.user?.username || '?')[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm truncate max-w-[80px]" title={comment.user?.nickname || comment.user?.username}>
                                            {comment.user?.nickname || comment.user?.username || '未知用户'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <a 
                                        href={`/post/${comment.post?.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline truncate block max-w-[180px]"
                                        title={comment.post?.title}
                                    >
                                        {comment.post?.title || '未知文章'}
                                    </a>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <ThumbsUp size={14} />
                                        <span>{comment.likeCount || 0}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-muted-foreground text-xs">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        disabled={busyId === comment.id}
                                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {comments.length === 0 && (
                            <tr>
                                <td colSpan="7" className="p-12 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <MessageSquare size={32} className="opacity-20" />
                                        <p>暂无评论</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        共 {total} 条评论，第 {page} / {totalPages} 页
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1 text-sm">{page}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* 统计卡片 */}
            {stats && (stats.topPosts?.length > 0 || stats.topUsers?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 评论最多的文章 */}
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-primary" />
                            评论最多的文章
                        </h3>
                        <div className="space-y-3">
                            {stats.topPosts?.map((post, index) => (
                                <div key={post.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                            {index + 1}
                                        </span>
                                        <a 
                                            href={`/post/${post.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm hover:text-primary truncate max-w-[200px]"
                                        >
                                            {post.title}
                                        </a>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{post.commentCount} 条</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 评论最多的用户 */}
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <User size={16} className="text-primary" />
                            最活跃的用户
                        </h3>
                        <div className="space-y-3">
                            {stats.topUsers?.map((user, index) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm">{user.nickname || user.username}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{user.commentCount} 条</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Comments;
