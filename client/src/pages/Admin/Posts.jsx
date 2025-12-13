import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, Tag, X, FileText, Inbox, Search, MoreHorizontal, Check, 
    ArrowLeft, ArrowUpDown, Filter, Eye, Code as CodeIcon, Folder, 
    Settings, Save, PanelRightOpen, PanelRightClose, Calendar, Globe,
    LayoutTemplate, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { tagsApi, categoriesApi } from '../../lib/api';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import RichTextEditor from '../../components/RichTextEditor';
import Toast from '../../components/Toast';

export const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [tags, setTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState({ title: '', summary: '', content: '', published: true, tags: [], categoryId: null, accessLevel: 'regular' });
    const [tagInput, setTagInput] = useState('');
    const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'drafts', 'tags'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPostIds, setSelectedPostIds] = useState([]);
    const [expandedTagId, setExpandedTagId] = useState(null);
    const [tagPosts, setTagPosts] = useState([]);
    const [tagPostSort, setTagPostSort] = useState('newest');
    const [tagPostSearch, setTagPostSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);
    const [categoryPosts, setCategoryPosts] = useState([]);
    const [categoryPostSort, setCategoryPostSort] = useState('newest');
    const [categoryPostSearch, setCategoryPostSearch] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [viewMode, setViewMode] = useState('rich'); // 'rich', 'markdown', 'preview'
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Editor UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
        fetchPosts();
        fetchTags();
        fetchCategories();
    }, [activeTab, searchTerm]);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts/admin/all', { params: { published: activeTab === 'posts' ? 'true' : activeTab === 'drafts' ? 'false' : undefined, search: searchTerm || undefined, categoryId: activeTab === 'categories' ? undefined : undefined } });
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTags = async () => {
        try {
            const res = await tagsApi.getAll({ search: searchTerm || undefined });
            setTags(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await categoriesApi.getAll({ search: searchTerm || undefined });
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const activePosts = activeTab === 'drafts'
        ? posts.filter(p => !p.published)
        : activeTab === 'posts'
            ? posts.filter(p => p.published)
            : [];

    const filteredPosts = activePosts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这篇文章吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await api.delete(`/posts/${id}`);
            setPosts(posts.filter(p => p.id !== id));
            setMessage({ type: 'success', text: '文章已删除' });
        } catch (err) {
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleDeleteTag = async (id) => {
        if (!window.confirm('确定要删除这个标签吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await tagsApi.delete(id);
            setTags(tags.filter(t => t.id !== id));
            fetchPosts();
            setMessage({ type: 'success', text: '标签已删除' });
        } catch (err) {
            setMessage({ type: 'error', text: '删除标签失败' });
        }
    };

    const addTag = async () => {
        const name = newTagName.trim()
        if (!name) return
        setMessage({ type: '', text: '' });
        try {
            const res = await tagsApi.create({ name })
            setTags([...tags, res.data])
            setNewTagName('')
            setMessage({ type: 'success', text: '标签已创建' });
        } catch (err) {
            setMessage({ type: 'error', text: '创建标签失败' });
        }
    }

    const toggleSelectTag = (id, checked) => {
        setSelectedTagIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
    }

    const bulkDeleteTags = async () => {
        if (selectedTagIds.length === 0) return
        if (!window.confirm(`确定要批量删除 ${selectedTagIds.length} 个标签吗？`)) return
        setMessage({ type: '', text: '' });
        try {
            await tagsApi.bulkDelete(selectedTagIds)
            setTags(tags.filter(t => !selectedTagIds.includes(t.id)))
            setSelectedTagIds([])
            fetchPosts()
            setMessage({ type: 'success', text: '标签批量删除成功' });
        } catch (err) {
            setMessage({ type: 'error', text: '批量删除标签失败' });
        }
    }

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('确定要删除这个分类吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await categoriesApi.delete(id);
            setCategories(categories.filter(c => c.id !== id));
            fetchPosts();
            setMessage({ type: 'success', text: '分类已删除' });
        } catch (err) {
            setMessage({ type: 'error', text: '删除分类失败' });
        }
    };

    const addCategory = async () => {
        const name = newCategoryName.trim()
        if (!name) return
        setMessage({ type: '', text: '' });
        try {
            const res = await categoriesApi.create({ name })
            setCategories([...categories, res.data])
            setNewCategoryName('')
            setMessage({ type: 'success', text: '分类已创建' });
        } catch (err) {
            setMessage({ type: 'error', text: '创建分类失败' });
        }
    }

    const toggleSelectCategory = (id, checked) => {
        setSelectedCategoryIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
    }

    const bulkDeleteCategories = async () => {
        if (selectedCategoryIds.length === 0) return
        if (!window.confirm(`确定要批量删除 ${selectedCategoryIds.length} 个分类吗？`)) return
        setMessage({ type: '', text: '' });
        try {
            await categoriesApi.bulkDelete(selectedCategoryIds)
            setCategories(categories.filter(c => !selectedCategoryIds.includes(c.id)))
            setSelectedCategoryIds([])
            fetchPosts()
            setMessage({ type: 'success', text: '分类批量删除成功' });
        } catch (err) {
            setMessage({ type: 'error', text: '批量删除分类失败' });
        }
    }

    const toggleSelectPost = (id, checked) => {
        setSelectedPostIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const bulkDeletePosts = async () => {
        if (selectedPostIds.length === 0) return;
        if (!window.confirm(`确定要批量删除 ${selectedPostIds.length} 篇文章吗？`)) return;
        setMessage({ type: '', text: '' });
        try {
            await api.post('/posts/bulk-delete', { ids: selectedPostIds });
            setPosts(posts.filter(p => !selectedPostIds.includes(p.id)));
            setSelectedPostIds([]);
            setMessage({ type: 'success', text: '文章批量删除成功' });
        } catch (err) {
            setMessage({ type: 'error', text: '批量删除失败' });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsSaving(true);
        
        if (!currentPost.content || !currentPost.content.trim()) {
            setMessage({ type: 'error', text: '文章内容不能为空' });
            setIsSaving(false);
            return;
        }

        try {
            const postData = {
                title: currentPost.title,
                summary: currentPost.summary,
                content: currentPost.content,
                published: currentPost.published,
                tags: currentPost.tags || [],
                categoryId: currentPost.categoryId || null,
                accessLevel: currentPost.accessLevel || 'regular'
            };

            if (currentPost.id) {
                await api.put(`/posts/${currentPost.id}`, postData);
                setMessage({ type: 'success', text: '文章更新成功' });
            } else {
                const res = await api.post('/posts', postData);
                setCurrentPost(prev => ({ ...prev, id: res.data.id })); // Update ID so subsequent saves are updates
                setMessage({ type: 'success', text: '文章创建成功' });
            }
            setLastSaved(new Date());
            fetchPosts();
            fetchTags();
            fetchCategories();
        } catch (err) {
            setMessage({ type: 'error', text: '保存失败' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(',', '');
            if (newTag && !currentPost.tags.includes(newTag)) {
                setCurrentPost({
                    ...currentPost,
                    tags: [...(currentPost.tags || []), newTag]
                });
            }
            setTagInput('');
        }
    };

    // Category selection handled via dropdown; no free-text addition here

    const handleRemoveTag = (tagToRemove) => {
        setCurrentPost({
            ...currentPost,
            tags: currentPost.tags.filter(tag => tag !== tagToRemove)
        });
    };

    // No category removal; single selection via dropdown

    const handleEditPost = (post) => {
        const tagNames = post.tags ? post.tags.map(t => t.name) : [];
        setCurrentPost({ id: post.id, title: post.title, summary: post.summary, content: post.content, published: post.published, tags: tagNames, categoryId: post.category ? post.category.id : null, accessLevel: post.accessLevel || 'regular' });
        setIsEditing(true);
    };

    const fetchTagPosts = async (tagId, search = '', sort = 'newest') => {
        try {
            const res = await api.get('/posts/admin/all', {
                params: {
                    tagId,
                    search: search || undefined,
                    sort
                }
            });
            setTagPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTagClick = async (tag) => {
        setExpandedTagId(tag.id);
        setTagPostSearch('');
        setTagPostSort('newest');
        await fetchTagPosts(tag.id);
    };

    useEffect(() => {
        if (expandedTagId) {
            fetchTagPosts(expandedTagId, tagPostSearch, tagPostSort);
        }
    }, [tagPostSearch, tagPostSort]);

    const fetchCategoryPosts = async (categoryId, search = '', sort = 'newest') => {
        try {
            const res = await api.get('/posts/admin/all', {
                params: {
                    categoryId,
                    search: search || undefined,
                    sort
                }
            });
            setCategoryPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCategoryClick = async (category) => {
        setExpandedCategoryId(category.id);
        setCategoryPostSearch('');
        setCategoryPostSort('newest');
        await fetchCategoryPosts(category.id);
    };

    useEffect(() => {
        if (expandedCategoryId) {
            fetchCategoryPosts(expandedCategoryId, categoryPostSearch, categoryPostSort);
        }
    }, [categoryPostSearch, categoryPostSort]);

    return (
        <div className="space-y-6">
            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border">
                    {[
                        { id: 'posts', label: '已发布', icon: FileText },
                        { id: 'drafts', label: '草稿', icon: Inbox },
                        { id: 'tags', label: '标签', icon: Tag },
                        { id: 'categories', label: '分类', icon: Folder },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {!isEditing && activeTab !== 'tags' && activeTab !== 'categories' && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="搜索文章..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        {selectedPostIds.length > 0 && (
                            <button
                                onClick={bulkDeletePosts}
                                className="px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
                            >
                                删除 ({selectedPostIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => { setCurrentPost({ title: '', summary: '', content: '', published: true, tags: [], categoryId: null, accessLevel: 'regular' }); setIsEditing(true); }}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-background flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsEditing(false)} 
                                    className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                    title="返回列表"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="font-medium text-foreground">{currentPost.id ? '编辑文章' : '新建文章'}</span>
                                    {lastSaved && <span className="text-xs opacity-60 ml-2">已保存 {lastSaved.toLocaleTimeString()}</span>}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode(viewMode === 'rich' ? 'markdown' : 'rich')}
                                    className={`p-2 rounded-md transition-colors ${viewMode !== 'rich' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                    title={viewMode === 'rich' ? "切换到 Markdown 源码" : "切换到富文本编辑器"}
                                >
                                    {viewMode === 'rich' ? <CodeIcon size={18} /> : <Edit size={18} />}
                                </button>
                                
                                <div className="h-4 w-px bg-border mx-1" />

                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <span className="animate-spin text-xs">⏳</span> : <Save size={16} />}
                                    保存
                                </button>
                                
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={`p-2 rounded-md transition-colors ${isSidebarOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                    title="文章设置"
                                >
                                    {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Editor */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin">
                                <div className="max-w-none w-full mx-auto py-8 px-8 min-h-full flex flex-col">
                                    <input
                                        type="text"
                                        placeholder="无标题"
                                        className="w-full bg-transparent text-4xl sm:text-5xl font-bold placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 px-0 mb-8"
                                        value={currentPost.title}
                                        onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                                    />
                                    
                                    <div className="flex-1">
                                        {viewMode === 'markdown' ? (
                                            <textarea
                                                placeholder="在此输入 Markdown 内容..."
                                                className="w-full h-full min-h-[500px] bg-transparent text-base font-mono placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 resize-none leading-relaxed"
                                                value={currentPost.content}
                                                onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                                            />
                                        ) : (
                                            <RichTextEditor
                                                key={currentPost.id || 'new'}
                                                content={currentPost.content}
                                                onChange={(newContent) => setCurrentPost({ ...currentPost, content: newContent })}
                                                variant="seamless"
                                                editorClassName="px-0 min-h-[calc(100vh-300px)]"
                                                className="-mx-1" // Negative margin to compensate for any slight misalignment or focus rings if needed, or just to pull it slightly if padding issues arise. But wait, if I use px-0, I don't need negative margin.
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 320, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="border-l border-border bg-card/50 backdrop-blur-sm overflow-y-auto scrollbar-thin flex flex-col"
                                    >
                                        <div className="p-4 space-y-6 w-80">
                                            {/* Status */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">发布状态</h3>
                                                <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg border border-border/50">
                                                    <span className={`text-sm font-medium ${currentPost.published ? 'text-green-500' : 'text-amber-500'}`}>
                                                        {currentPost.published ? '已发布' : '草稿'}
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer"
                                                            checked={currentPost.published}
                                                            onChange={() => setCurrentPost({ ...currentPost, published: !currentPost.published })}
                                                        />
                                                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">分类</h3>
                                                 <div className="relative">
                                                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                    <select
                                                        value={currentPost.categoryId || ''}
                                                        onChange={(e) => setCurrentPost({ ...currentPost, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                                                        className="w-full bg-background border border-border text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary appearance-none"
                                                    >
                                                        <option value="">未选择分类</option>
                                                        {categories.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {Array(c.level && c.level > 1 ? c.level - 1 : 0).fill('— ').join('')}{c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Access Level */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">访问权限</h3>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                    <select
                                                        value={currentPost.accessLevel || 'regular'}
                                                        onChange={(e) => setCurrentPost({ ...currentPost, accessLevel: e.target.value })}
                                                        className="w-full bg-background border border-border text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary appearance-none"
                                                    >
                                                        <option value="regular">公开 (普通用户)</option>
                                                        <option value="plus">Plus 会员专享</option>
                                                        <option value="pro">Pro 会员专享</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">标签</h3>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {currentPost.tags && currentPost.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium group"
                                                        >
                                                            {tag}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveTag(tag)} 
                                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="输入标签并回车..."
                                                        className="w-full bg-background border border-border text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyDown={handleAddTag}
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">摘要</h3>
                                                <textarea
                                                    placeholder="文章摘要 (可选)"
                                                    className="w-full bg-background border border-border text-sm rounded-lg p-3 outline-none focus:ring-1 focus:ring-primary resize-none min-h-[100px]"
                                                    value={currentPost.summary || ''}
                                                    onChange={(e) => setCurrentPost({ ...currentPost, summary: e.target.value })}
                                                />
                                            </div>
                                            
                                             {/* Templates */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">快捷操作</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPost(prev => ({ ...prev, content: prev.content + '\n\n' + `# Markdown 渲染全功能展示
` }))} 
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <LayoutTemplate size={12} /> 插入示例内容
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {(activeTab === 'posts' || activeTab === 'drafts') && (
                            <div className="space-y-4">
                                <div className="grid gap-2 2xl:grid-cols-2 3xl:grid-cols-3">
                                    {filteredPosts.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
                                            暂无文章
                                        </div>
                                    ) : (
                                        filteredPosts.map(post => (
                                            <div
                                                key={post.id}
                                                className="group bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-all flex justify-between items-center"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" checked={selectedPostIds.includes(post.id)} onChange={(e) => toggleSelectPost(post.id, e.target.checked)}
                                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                        />
                                                        <h3 className="font-medium text-foreground text-sm">{post.title}</h3>
                                                        {post.tags && post.tags.length > 0 && (
                                                            <div className="flex gap-1.5">
                                                                {post.tags.map(tag => (
                                                                    <span key={tag.id} className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground">
                                                                        #{tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {post.category && (
                                                            <div className="flex gap-1.5">
                                                                <span className="bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] text-blue-500">
                                                                    {post.category.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 pl-7 text-xs text-muted-foreground font-mono">
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditPost(post)}
                                                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tags' && (
                            <div className="space-y-4">
                                {expandedTagId ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setExpandedTagId(null)}
                                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <Tag size={18} className="text-primary" />
                                                    <h2 className="text-xl font-bold">
                                                        {tags.find(t => t.id === expandedTagId)?.name}
                                                    </h2>
                                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                        {tagPosts.length} 篇
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <div className="relative flex-1 sm:flex-none">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="搜索标签下的文章..."
                                                        value={tagPostSearch}
                                                        onChange={(e) => setTagPostSearch(e.target.value)}
                                                        className="pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setTagPostSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-muted transition-colors whitespace-nowrap"
                                                >
                                                    <ArrowUpDown size={14} />
                                                    {tagPostSort === 'newest' ? '最新发布' : '最早发布'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            {tagPosts.length === 0 ? (
                                                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
                                                    该标签下暂无文章
                                                </div>
                                            ) : (
                                                tagPosts.map(post => (
                                                    <div
                                                        key={post.id}
                                                        className="group bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-all flex justify-between items-center"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-medium text-foreground text-sm">{post.title}</h3>
                                                                {!post.published && (
                                                                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                                        草稿
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                                                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditPost(post)}
                                                                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
                                            <input
                                                type="text"
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="输入新标签名..."
                                                className="flex-1 bg-transparent outline-none text-sm px-2"
                                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            />
                                            <button onClick={addTag} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium">添加</button>
                                            {selectedTagIds.length > 0 && (
                                                <button onClick={bulkDeleteTags} className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium">删除 ({selectedTagIds.length})</button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-3">
                                            {tags.map(tag => (
                                                <div
                                                    key={tag.id}
                                                    onClick={(e) => {
                                                        // Prevent triggering when clicking checkbox or delete button
                                                        if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) return;
                                                        handleTagClick(tag);
                                                    }}
                                                    className="group bg-card border border-border p-3 rounded-lg hover:border-primary/50 transition-colors relative cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Tag size={14} className="text-muted-foreground" />
                                                        <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={(e) => toggleSelectTag(tag.id, e.target.checked)} className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="font-medium text-sm truncate" title={tag.name}>
                                                        {tag.name}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">{tag._count?.posts || 0} 篇</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTag(tag.id);
                                                            }}
                                                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="space-y-4">
                                {expandedCategoryId ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setExpandedCategoryId(null)}
                                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <Folder size={18} className="text-primary" />
                                                    <h2 className="text-xl font-bold">
                                                        {categories.find(c => c.id === expandedCategoryId)?.name}
                                                    </h2>
                                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                        {categoryPosts.length} 篇
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <div className="relative flex-1 sm:flex-none">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="搜索分类下的文章..."
                                                        value={categoryPostSearch}
                                                        onChange={(e) => setCategoryPostSearch(e.target.value)}
                                                        className="pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setCategoryPostSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-muted transition-colors whitespace-nowrap"
                                                >
                                                    <ArrowUpDown size={14} />
                                                    {categoryPostSort === 'newest' ? '最新发布' : '最早发布'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            {categoryPosts.length === 0 ? (
                                                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
                                                    该分类下暂无文章
                                                </div>
                                            ) : (
                                                categoryPosts.map(post => (
                                                    <div
                                                        key={post.id}
                                                        className="group bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-all flex justify-between items-center"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-medium text-foreground text-sm">{post.title}</h3>
                                                                {!post.published && (
                                                                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                                        草稿
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                                                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditPost(post)}
                                                                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="输入新分类名..."
                                                className="flex-1 bg-transparent outline-none text-sm px-2"
                                                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                            />
                                            <button onClick={addCategory} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium">添加</button>
                                            {selectedCategoryIds.length > 0 && (
                                                <button onClick={bulkDeleteCategories} className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium">删除 ({selectedCategoryIds.length})</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-3">
                                        {categories.map(category => (
                                            <div
                                                    key={category.id}
                                                    onClick={(e) => {
                                                        // Prevent triggering when clicking checkbox or delete button
                                                        if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) return;
                                                        handleCategoryClick(category);
                                                    }}
                                                    className="group bg-card border border-border p-3 rounded-lg hover:border-primary/50 transition-colors relative cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Folder size={14} className="text-muted-foreground" />
                                                        <input type="checkbox" checked={selectedCategoryIds.includes(category.id)} onChange={(e) => toggleSelectCategory(category.id, e.target.checked)} className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="font-medium text-sm truncate" title={category.name}>
                                                        {category.name}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">{category._count?.posts || 0} 篇</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCategory(category.id);
                                                            }}
                                                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
