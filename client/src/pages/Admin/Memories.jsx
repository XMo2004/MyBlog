import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Search, X, Calendar, MapPin, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { memoriesApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';

// 将图片URL转换为完整URL
const getImageUrl = (image, useThumbnail = false) => {
  if (!image) return '';
  // 如果已经是完整URL，直接返回
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  // 如果是相对路径，添加API基础URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  // 移除baseUrl末尾的/api，因为image已经包含/api
  const apiBase = baseUrl.replace(/\/api$/, '');
  
  // 如果请求缩略图且是本地存储的图片，使用缩略图端点
  if (useThumbnail && image.includes('/api/memories/') && image.endsWith('/image')) {
    const thumbnailPath = image.replace('/image', '/thumb');
    return `${apiBase}${thumbnailPath}`;
  }
  
  return `${apiBase}${image}`;
};

const ASPECT_RATIOS = [
    { label: '3:4 (竖版)', value: 'aspect-[3/4]' },
    { label: '4:3 (横版)', value: 'aspect-[4/3]' },
    { label: '1:1 (正方形)', value: 'aspect-[1/1]' },
    { label: '16:9 (宽屏)', value: 'aspect-[16/9]' },
    { label: '4:5 (Instagram)', value: 'aspect-[4/5]' },
];

const AdminMemories = () => {
    const [memories, setMemories] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        image: '',
        description: '',
        aspectRatio: 'aspect-[3/4]',
        order: 0,
        published: true,
    });

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const res = await memoriesApi.getAllAdmin();
            setMemories(res.data);
        } catch (error) {
            console.error('Failed to fetch memories', error);
            setMessage({ type: 'error', text: '获取回忆失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMemories = memories.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条回忆吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await memoriesApi.delete(id);
            setMemories(memories.filter(m => m.id !== id));
            setMessage({ type: 'success', text: '回忆已删除' });
        } catch (error) {
            console.error('Failed to delete memory', error);
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleEdit = (memory) => {
        setFormData({
            ...memory,
            date: new Date(memory.date).toISOString().split('T')[0],
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            title: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            image: '',
            description: '',
            aspectRatio: 'aspect-[3/4]',
            order: 0,
            published: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!formData.title || !formData.date || (!formData.image && !formData.imageFile)) {
            setMessage({ type: 'error', text: '标题、日期和图片为必填项' });
            return;
        }

        let dataToSubmit;

        if (formData.imageFile) {
            dataToSubmit = new FormData();
            dataToSubmit.append('title', formData.title);
            dataToSubmit.append('date', formData.date);
            dataToSubmit.append('location', formData.location || '');
            dataToSubmit.append('description', formData.description || '');
            dataToSubmit.append('aspectRatio', formData.aspectRatio);
            dataToSubmit.append('order', formData.order || 0);
            dataToSubmit.append('published', formData.published);
            dataToSubmit.append('imageFile', formData.imageFile);
            // If editing, we might want to preserve the old image URL in case they didn't upload a new file, 
            // but here imageFile IS present, so we ignore the old 'image' string.
        } else {
            dataToSubmit = {
                ...formData,
                order: parseInt(formData.order) || 0,
            };
        }

        try {
            if (formData.id) {
                const res = await memoriesApi.update(formData.id, dataToSubmit);
                setMemories(memories.map(m => m.id === formData.id ? res.data : m));
                setMessage({ type: 'success', text: '回忆已更新' });
            } else {
                const res = await memoriesApi.create(dataToSubmit);
                setMemories([...memories, res.data]);
                setMessage({ type: 'success', text: '回忆已创建' });
            }
            handleCancel();
        } catch (error) {
            console.error('Failed to save memory', error);
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
        if (!window.confirm(`确定要批量删除 ${selectedIds.length} 条回忆吗？`)) return;
        setMessage({ type: '', text: '' });
        try {
            await memoriesApi.bulkDelete(selectedIds);
            setMemories(memories.filter(m => !selectedIds.includes(m.id)));
            setSelectedIds([]);
            setMessage({ type: 'success', text: '批量删除成功' });
        } catch (error) {
            console.error('Failed to bulk delete memories', error);
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
                <h1 className="text-2xl font-bold tracking-tight">回忆管理</h1>

                {!isEditing && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="搜索回忆..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                删除 ({selectedIds.length})
                            </button>
                        )}

                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} />
                            新增
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-card border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {formData.id ? '编辑回忆' : '新增回忆'}
                            </h2>
                            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" onPaste={(e) => {
                            const items = e.clipboardData.items;
                            for (let item of items) {
                                if (item.type.indexOf("image") !== -1) {
                                    const file = item.getAsFile();
                                    setFormData(prev => ({
                                        ...prev,
                                        imageFile: file,
                                        image: URL.createObjectURL(file)
                                    }));
                                }
                            }
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">标题 *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="输入回忆标题"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">日期 *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">地点</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="如: 杭州 · 西湖"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">图片 *</label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                                            ${formData.image || formData.imageFile 
                                                ? 'border-primary/50 bg-primary/5' 
                                                : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                                            const file = e.dataTransfer.files[0];
                                            if (file && file.type.startsWith('image/')) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    imageFile: file,
                                                    image: URL.createObjectURL(file)
                                                }));
                                            }
                                        }}
                                        onClick={() => document.getElementById('image-upload').click()}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="image-upload"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        imageFile: file,
                                                        image: URL.createObjectURL(file)
                                                    }));
                                                }
                                            }}
                                        />
                                        {formData.image || formData.imageFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    <img
                                                        src={formData.imageFile ? formData.image : getImageUrl(formData.image)}
                                                        alt="已选择"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {formData.imageFile ? formData.imageFile.name : '已有图片'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        点击或拖拽新图片替换
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            imageFile: null,
                                                            image: ''
                                                        }));
                                                    }}
                                                    className="ml-auto p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                                                    <ImageIcon size={24} className="text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        点击上传或拖拽图片到此处
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        支持 Ctrl+V 粘贴 · PNG, JPG, GIF, WebP
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">描述</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        placeholder="描述这段回忆..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">宽高比</label>
                                        <select
                                            name="aspectRatio"
                                            value={formData.aspectRatio}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            {ASPECT_RATIOS.map(ar => (
                                                <option key={ar.value} value={ar.value}>{ar.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">排序</label>
                                        <input
                                            type="number"
                                            name="order"
                                            value={formData.order}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="published"
                                        id="published"
                                        checked={formData.published}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <label htmlFor="published" className="text-sm">公开显示</label>
                                </div>

                                {(formData.image || formData.imageFile) && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">预览</label>
                                        <div className={`${formData.aspectRatio} w-full max-w-xs rounded-lg overflow-hidden bg-muted border border-border`}>
                                            <img
                                                src={formData.imageFile ? formData.image : getImageUrl(formData.image)}
                                                alt="预览"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // e.target.style.display = 'none';
                                                    // Keep layout but maybe show placeholder?
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {formData.id ? '保存' : '创建'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {filteredMemories.map((memory) => (
                            <motion.div
                                key={memory.id}
                                layout
                                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                            >
                                <div className={`${memory.aspectRatio} relative overflow-hidden bg-muted`}>
                                    <img
                                        src={getImageUrl(memory.image, true)}
                                        alt={memory.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="absolute top-2 left-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(memory.id)}
                                            onChange={(e) => handleSelect(memory.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-white/50"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <div className="absolute top-2 right-2 flex gap-1">
                                        {!memory.published && (
                                            <span className="px-2 py-0.5 text-xs bg-yellow-500/80 text-white rounded">
                                                未发布
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(memory)}
                                            className="p-1.5 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                                        >
                                            <Edit2 size={14} className="text-white" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(memory.id)}
                                            className="p-1.5 bg-red-500/80 backdrop-blur rounded-lg hover:bg-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} className="text-white" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3">
                                    <h3 className="font-medium text-sm mb-1 truncate">{memory.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(memory.date).toLocaleDateString('zh-CN')}
                                        </span>
                                        {memory.location && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin size={12} />
                                                {memory.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {filteredMemories.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                {searchTerm ? '没有找到匹配的回忆' : '暂无回忆，点击右上角添加'}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMemories;
