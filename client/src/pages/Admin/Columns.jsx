import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, BookOpen, Search, X, Layers, Code, Folder, Lightbulb, Wrench, Rocket } from 'lucide-react';
import { columnsApi } from '../../lib/api';
import Toast from '../../components/Toast';

const AdminColumns = () => {
    const navigate = useNavigate();
    const [columns, setColumns] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', readTime: '', color: 'blue', status: 'Active', featured: false, order: 0, icon: 'BookOpen'
    });
    const [iconMode, setIconMode] = useState('preset');

    const iconComponents = { BookOpen, Code, Folder, Lightbulb, Wrench, Rocket, Layers };
    const iconOptions = Object.keys(iconComponents);

    useEffect(() => {
        fetchColumns();
    }, [searchTerm]);

    const fetchColumns = async () => {
        try {
            const res = await columnsApi.getAll({ search: searchTerm });
            setColumns(res.data);
        } catch (error) {
            console.error('Failed to fetch columns', error);
            setMessage({ type: 'error', text: '获取专栏失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await columnsApi.delete(id);
            setColumns(columns.filter(c => c.id !== id));
            setMessage({ type: 'success', text: '专栏已删除' });
        } catch (error) {
            console.error('Failed to delete column', error);
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleEdit = (column) => {
        setFormData(column);
        setIsEditing(true);
        setIconMode(typeof column.icon === 'string' && column.icon.trim().startsWith('<svg') ? 'svg' : 'preset');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            title: '', description: '', readTime: '', color: 'blue', status: 'Active', featured: false, order: 0, icon: 'BookOpen'
        });
        setIconMode('preset');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        const dataToSubmit = {
            ...formData,
            order: parseInt(formData.order) || 0
        };

        try {
            if (formData.id) {
                const res = await columnsApi.update(formData.id, dataToSubmit);
                setColumns(columns.map(c => c.id === formData.id ? res.data : c));
                setMessage({ type: 'success', text: '专栏已更新' });
            } else {
                const res = await columnsApi.create(dataToSubmit);
                setColumns([...columns, res.data]);
                setMessage({ type: 'success', text: '专栏已创建' });
            }
            handleCancel();
        } catch (error) {
            console.error('Failed to save column', error);
            setMessage({ type: 'error', text: '保存失败' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelect = (id, checked) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要批量删除 ${selectedIds.length} 项吗？`)) return;
        setMessage({ type: '', text: '' });
        try {
            await columnsApi.bulkDelete(selectedIds);
            setColumns(columns.filter(c => !selectedIds.includes(c.id)));
            setSelectedIds([]);
            setMessage({ type: 'success', text: '批量删除成功' });
        } catch (error) {
            console.error('Failed to bulk delete', error);
            setMessage({ type: 'error', text: '批量删除失败' });
        }
    };

    return (
        <div className="space-y-6">
            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">专栏管理</h1>

                {!isEditing && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="搜索专栏..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        {selectedIds.length > 0 && (
                            <button 
                                onClick={handleBulkDelete} 
                                className="px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
                            >
                                删除 ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => { handleCancel(); setIsEditing(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> 新建
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-card p-4 md:p-6 rounded-lg border border-border shadow-sm"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">{formData.id ? '编辑专栏' : '新建专栏'}</h2>
                            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">专栏标题</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="输入专栏标题"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">阅读时间</label>
                                        <input
                                            type="text"
                                            name="readTime"
                                            value={formData.readTime}
                                            onChange={handleChange}
                                            placeholder="e.g. 2小时"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">颜色主题</label>
                                        <select
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="blue">蓝色 (Blue)</option>
                                            <option value="green">绿色 (Green)</option>
                                            <option value="purple">紫色 (Purple)</option>
                                            <option value="orange">橙色 (Orange)</option>
                                            <option value="red">红色 (Red)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">图标</label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setIconMode('preset')}
                                                className={`px-2 py-1 rounded border text-xs ${iconMode === 'preset' ? 'bg-muted' : ''}`}
                                            >
                                                预设图标
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIconMode('svg')}
                                                className={`px-2 py-1 rounded border text-xs ${iconMode === 'svg' ? 'bg-muted' : ''}`}
                                            >
                                                自定义SVG
                                            </button>
                                        </div>
                                        {iconMode === 'preset' ? (
                                            <div className="flex items-center gap-3">
                                                <select
                                                    name="icon"
                                                    value={formData.icon}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                >
                                                    {iconOptions.map((name) => (
                                                        <option key={name} value={name}>{name}</option>
                                                    ))}
                                                </select>
                                                {(() => {
                                                    const SelectedIcon = iconComponents[formData.icon] || BookOpen;
                                                    return (
                                                        <span className="p-2 rounded-md bg-secondary text-secondary-foreground border border-border">
                                                            <SelectedIcon size={18} />
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <textarea
                                                name="icon"
                                                value={formData.icon}
                                                onChange={handleChange}
                                                placeholder="粘贴 <svg>...自定义图标... </svg>"
                                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                                rows={4}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">状态</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="Active">活跃 (Active)</option>
                                            <option value="Archived">归档 (Archived)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">排序权重</label>
                                        <input
                                            type="number"
                                            name="order"
                                            value={formData.order}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-8">
                                        <input
                                            type="checkbox"
                                            name="featured"
                                            checked={formData.featured}
                                            onChange={handleChange}
                                            id="featured"
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                                        />
                                        <label htmlFor="featured" className="text-sm font-medium cursor-pointer select-none">推荐到首页</label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">专栏描述</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="简短描述专栏..."
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    {formData.id ? '更新专栏' : '创建专栏'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
                        {columns.map(column => (
                            <motion.div 
                                key={column.id}
                                layout
                                className="group bg-card border border-border p-5 rounded-lg hover:border-primary/50 transition-all flex flex-col justify-between h-full relative"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleEdit(column)} className="p-1.5 bg-background border border-border hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(column.id)} className="p-1.5 bg-background border border-border hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors shadow-sm">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-start pr-16">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(column.id)} 
                                                onChange={(e) => handleSelect(column.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" 
                                            />
                                            <h3 className="font-semibold text-lg tracking-tight">{column.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{column.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border border-border/50 ${
                                            column.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            column.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            column.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                            column.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                            column.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                            {column.color === 'blue' ? '蓝色' :
                                             column.color === 'green' ? '绿色' :
                                             column.color === 'purple' ? '紫色' :
                                             column.color === 'orange' ? '橙色' :
                                             column.color === 'red' ? '红色' : column.color}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/50">
                                            {column.status === 'Active' ? '活跃' : '归档'}
                                        </span>
                                        {column.featured && <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-[10px] font-medium border border-yellow-200 dark:border-yellow-900">推荐</span>}
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-border/50 flex justify-between text-xs text-muted-foreground font-mono">
                                     <span>排序: {column.order}</span>
                                     <span>{column.readTime}</span>
                                </div>
                                
                                <button 
                                    onClick={() => navigate(`/dashboard/columns/${column.id}/structure`)} 
                                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Layers size={14} />
                                    管理结构
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminColumns;
