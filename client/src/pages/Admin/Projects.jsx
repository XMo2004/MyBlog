import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Github, ExternalLink, Search, X, Star, GitFork } from 'lucide-react';
import { projectsApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';

const AdminProjects = () => {
    const [projects, setProjects] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', tech: '', github: '', demo: '',
        stars: 0, forks: 0, status: 'Active', featured: false, color: 'blue', order: 0
    });

    useEffect(() => {
        fetchProjects();
    }, [searchTerm]);

    const fetchProjects = async () => {
        try {
            const res = await projectsApi.getAll({ search: searchTerm });
            const data = res.data.map(p => ({
                ...p,
                tech: typeof p.tech === 'string' ? JSON.parse(p.tech) : p.tech
            }));
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
            setMessage({ type: 'error', text: '获取项目失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await projectsApi.delete(id);
            setProjects(projects.filter(p => p.id !== id));
            setMessage({ type: 'success', text: '项目已删除' });
        } catch (error) {
            console.error('Failed to delete project', error);
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleEdit = (project) => {
        setFormData({
            ...project,
            tech: Array.isArray(project.tech) ? project.tech.join(', ') : project.tech
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: '', description: '', tech: '', github: '', demo: '',
            stars: 0, forks: 0, status: 'Active', featured: false, color: 'blue', order: 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        const dataToSubmit = {
            ...formData,
            tech: JSON.stringify(formData.tech.split(',').map(s => s.trim()).filter(Boolean)),
            stars: parseInt(formData.stars) || 0,
            forks: parseInt(formData.forks) || 0,
            order: parseInt(formData.order) || 0
        };

        try {
            if (formData.id) {
                const res = await projectsApi.update(formData.id, dataToSubmit);
                const updatedProject = {
                    ...res.data,
                    tech: typeof res.data.tech === 'string' ? JSON.parse(res.data.tech) : res.data.tech
                };
                setProjects(projects.map(p => p.id === formData.id ? updatedProject : p));
                setMessage({ type: 'success', text: '项目已更新' });
            } else {
                const res = await projectsApi.create(dataToSubmit);
                const newProject = {
                    ...res.data,
                    tech: typeof res.data.tech === 'string' ? JSON.parse(res.data.tech) : res.data.tech
                };
                setProjects([...projects, newProject]);
                setMessage({ type: 'success', text: '项目已创建' });
            }
            handleCancel();
        } catch (error) {
            console.error('Failed to save project', error);
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
            await projectsApi.bulkDelete(selectedIds);
            setProjects(projects.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setMessage({ type: 'success', text: '批量删除成功' });
        } catch (error) {
            console.error('Failed to bulk delete projects', error);
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
                <h1 className="text-2xl font-bold tracking-tight">项目管理</h1>
                
                {!isEditing && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="搜索项目..."
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
                            <h2 className="text-lg font-semibold">{formData.id ? '编辑项目' : '新建项目'}</h2>
                            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">项目名称</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="输入项目名称"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">状态</label>
                                        <input
                                            type="text"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            placeholder="e.g., Development, Live"
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Github URL</label>
                                        <div className="relative">
                                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                            <input
                                                type="text"
                                                name="github"
                                                value={formData.github}
                                                onChange={handleChange}
                                                placeholder="https://github.com/..."
                                                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Demo URL</label>
                                        <div className="relative">
                                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                            <input
                                                type="text"
                                                name="demo"
                                                value={formData.demo}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Stars</label>
                                            <input
                                                type="number"
                                                name="stars"
                                                value={formData.stars}
                                                onChange={handleChange}
                                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Forks</label>
                                            <input
                                                type="number"
                                                name="forks"
                                                value={formData.forks}
                                                onChange={handleChange}
                                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">颜色主题</label>
                                        <input
                                            type="text"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            placeholder="e.g., blue, green, purple"
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
                                <label className="text-sm font-medium">项目描述</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="简短描述项目..."
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">技术栈</label>
                                <input
                                    type="text"
                                    name="tech"
                                    value={formData.tech}
                                    onChange={handleChange}
                                    placeholder="React, Node.js, Tailwind (使用逗号分隔)"
                                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    id="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                                />
                                <label htmlFor="featured" className="text-sm font-medium cursor-pointer select-none">设为精选项目 (Featured)</label>
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
                                    {formData.id ? '更新项目' : '创建项目'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {projects.map(project => (
                            <motion.div
                                key={project.id}
                                layout
                                className="group bg-card border border-border p-5 rounded-lg hover:border-primary/50 transition-all relative flex flex-col h-full"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                    <button 
                                        onClick={() => handleEdit(project)} 
                                        className="p-1.5 bg-background border border-border hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(project.id)} 
                                        className="p-1.5 bg-background border border-border hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-3 pr-16">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(project.id)} 
                                            onChange={(e) => handleSelect(project.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" 
                                        />
                                        <h3 className="font-semibold text-lg tracking-tight">{project.name}</h3>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 grow">{project.description}</p>

                                <div className="space-y-4 mt-auto">
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(project.tech) && project.tech.map(t => (
                                            <span key={t} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium border border-border/50">
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex gap-3 text-muted-foreground">
                                            {project.github && (
                                                <a href={project.github} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                                    <Github size={16} />
                                                </a>
                                            )}
                                            {project.demo && (
                                                <a href={project.demo} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                                            {project.stars > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Star size={12} className="fill-current" /> {project.stars}
                                                </span>
                                            )}
                                            {project.forks > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <GitFork size={12} /> {project.forks}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {project.featured && (
                                    <div className="absolute -top-1 -left-1">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminProjects;
