import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Link as LinkIcon, Folder, ExternalLink, Search, X } from 'lucide-react';
import Select from '../../components/Select';
import { resourcesApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';

const AdminResources = () => {
    const [resources, setResources] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', url: '', type: 'tool', category: '', icon: '', order: 0
    });

    useEffect(() => {
        fetchResources();
    }, [searchTerm]);

    const fetchResources = async () => {
        try {
            const res = await resourcesApi.getAll({ search: searchTerm });
            setResources(res.data);
        } catch (error) {
            console.error('Failed to fetch resources', error);
            setMessage({ type: 'error', text: '获取资源失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await resourcesApi.delete(id);
            setResources(resources.filter(r => r.id !== id));
            setMessage({ type: 'success', text: '资源已删除' });
        } catch (error) {
            console.error('Failed to delete resource', error);
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleEdit = (resource) => {
        setFormData(resource);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: '', description: '', url: '', type: 'tool', category: '', icon: '', order: 0
        });
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
                const res = await resourcesApi.update(formData.id, dataToSubmit);
                setResources(resources.map(r => r.id === formData.id ? res.data : r));
                setMessage({ type: 'success', text: '资源已更新' });
            } else {
                const res = await resourcesApi.create(dataToSubmit);
                setResources([...resources, res.data]);
                setMessage({ type: 'success', text: '资源已创建' });
            }
            handleCancel();
        } catch (error) {
            console.error('Failed to save resource', error);
            setMessage({ type: 'error', text: '保存失败' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelect = (id, checked) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要批量删除 ${selectedIds.length} 项吗？`)) return;
        setMessage({ type: '', text: '' });
        try {
            await resourcesApi.bulkDelete(selectedIds);
            setResources(resources.filter(r => !selectedIds.includes(r.id)));
            setSelectedIds([]);
            setMessage({ type: 'success', text: '批量删除成功' });
        } catch (error) {
            console.error('Failed to bulk delete resources', error);
            setMessage({ type: 'error', text: '批量删除失败' });
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6">
            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">资源管理</h1>

                {!isEditing && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="搜索资源..."
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
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
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
                        className="bg-card p-4 md:p-6 rounded-lg border border-border"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">{formData.id ? '编辑资源' : '新建资源'}</h2>
                            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">资源名称</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="输入资源名称"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">链接 URL</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                            <input
                                                type="text"
                                                name="url"
                                                value={formData.url}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">分类</label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            placeholder="e.g., Development, Design"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">类型</label>
                                        <Select
                                            value={formData.type}
                                            onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                            options={[
                                                { value: 'tool', label: '工具 (Tool)' },
                                                { value: 'learning', label: '学习 (Learning)' },
                                                { value: 'design', label: '设计 (Design)' },
                                                { value: 'other', label: '其他 (Other)' }
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">图标 URL</label>
                                        <input
                                            type="text"
                                            name="icon"
                                            value={formData.icon || ''}
                                            onChange={handleChange}
                                            placeholder="https://.../icon.png"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
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
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">资源描述</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="简短描述资源..."
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
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    {formData.id ? '更新资源' : '创建资源'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {resources.map(resource => (
                            <motion.div
                                key={resource.id}
                                layout
                                className="group bg-card border border-border p-5 rounded-lg hover:border-primary/50 transition-all relative flex flex-col h-full"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                    <button 
                                        onClick={() => handleEdit(resource)} 
                                        className="p-1.5 bg-background border border-border hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(resource.id)} 
                                        className="p-1.5 bg-background border border-border hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 mb-4 pr-16">
                                    <div className="flex items-start gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(resource.id)} 
                                            onChange={(e) => handleSelect(resource.id, e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" 
                                        />
                                        <div className="p-2.5 bg-secondary/50 rounded-lg border border-border/50">
                                            {resource.icon ? (
                                                <img src={resource.icon} alt="" className="w-6 h-6 object-cover rounded-sm" />
                                            ) : (
                                                <LinkIcon size={20} className="text-primary" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base tracking-tight leading-tight">{resource.name}</h3>
                                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium border border-border/50">
                                            {resource.category}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 grow">{resource.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                                    <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                                        {resource.type}
                                    </span>
                                    <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        访问 <ExternalLink size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminResources;
