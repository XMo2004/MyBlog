import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Plus, Trash2, Edit, Tag, X, FileText, Inbox, Search, MoreHorizontal, Check, 
    ArrowLeft, ArrowUpDown, Filter, Eye, Code as CodeIcon, Folder, 
    Settings, Save, PanelRightOpen, PanelRightClose, Calendar, Globe,
    LayoutTemplate, Lock, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { tagsApi, categoriesApi } from '../../lib/api';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import RichTextEditor from '../../components/RichTextEditor';
import Select from '../../components/Select';
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
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
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

    // Auto-save & Draft states
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
    const currentPostRef = useRef(currentPost);
    const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
    const autoSaveIntervalRef = useRef(null);
    const autoSaveTimeoutRef = useRef(null);
    const isAutoSavingRef = useRef(false);

    // Update refs whenever state changes
    useEffect(() => {
        currentPostRef.current = currentPost;
    }, [currentPost]);

    useEffect(() => {
        hasUnsavedChangesRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    // 自动保存函数 - 使用useCallback稳定引用
    const performAutoSave = useCallback(async () => {
        // 防止并发自动保存
        if (isAutoSavingRef.current) return;
        
        const post = currentPostRef.current;
        // 验证必要字段
        if (!post.title?.trim()) return;
        
        isAutoSavingRef.current = true;
        setAutoSaveStatus('saving');
        
        try {
            const postData = {
                title: post.title.trim(),
                summary: post.summary?.trim() || '',
                content: post.content?.trim() || '',
                published: post.published,
                tags: (post.tags || []).filter(tag => tag && tag.trim()),
                categoryId: post.categoryId ? parseInt(post.categoryId) : null,
                accessLevel: post.accessLevel || 'regular'
            };

            if (post.id) {
                await api.put(`/posts/${post.id}`, postData);
            } else {
                // 新文章自动保存为草稿，但保留用户的发布状态意图
                const res = await api.post('/posts', { ...postData, published: false });
                setCurrentPost(prev => ({ ...prev, id: res.data.id }));
            }
            
            setLastSaved(new Date());
            setAutoSaveStatus('saved');
            setHasUnsavedChanges(false);
            
            // 3秒后清除状态提示
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (err) {
            console.error('Auto-save failed:', err);
            setAutoSaveStatus('error');
            // 错误状态保留更长时间
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = setTimeout(() => setAutoSaveStatus(''), 5000);
        } finally {
            isAutoSavingRef.current = false;
        }
    }, []);

    // Auto-save timer - 每30秒检查一次
    useEffect(() => {
        if (isEditing) {
            autoSaveIntervalRef.current = setInterval(() => {
                if (hasUnsavedChangesRef.current && currentPostRef.current.title?.trim()) {
                    performAutoSave();
                }
            }, 30000);
        }
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                autoSaveIntervalRef.current = null;
            }
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
                autoSaveTimeoutRef.current = null;
            }
        };
    }, [isEditing, performAutoSave]);

    // Local Draft Saving - 带有时间戳的草稿保存
    const localDraftTimeoutRef = useRef(null);
    
    useEffect(() => {
        if (isEditing && hasUnsavedChanges) {
            // 清除之前的定时器
            if (localDraftTimeoutRef.current) {
                clearTimeout(localDraftTimeoutRef.current);
            }
            
            const draftKey = currentPost.id ? `draft_post_${currentPost.id}` : 'draft_post_new';
            localDraftTimeoutRef.current = setTimeout(() => {
                try {
                    const draftData = {
                        ...currentPost,
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem(draftKey, JSON.stringify(draftData));
                } catch (e) {
                    console.error('Failed to save local draft:', e);
                }
            }, 1500); // 防抖 1.5s
        }
        
        return () => {
            if (localDraftTimeoutRef.current) {
                clearTimeout(localDraftTimeoutRef.current);
            }
        };
    }, [currentPost, isEditing, hasUnsavedChanges]);

    // Restore Draft Logic - 增强版
    const draftRestoredRef = useRef(false);
    
    useEffect(() => {
        // 只在编辑模式且未恢复过时执行
        if (!isEditing || draftRestoredRef.current) return;
        
        const draftKey = currentPost.id ? `draft_post_${currentPost.id}` : 'draft_post_new';
        const savedDraft = localStorage.getItem(draftKey);
        
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                
                // 检查草稿是否有内容
                const hasContent = draft.title?.trim() || draft.content?.trim();
                if (!hasContent) return;
                
                // 对于新文章，直接检查当前是否为空
                if (!currentPost.id && !currentPost.title && !currentPost.content) {
                    const savedTime = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : '未知时间';
                    
                    // 显示确认对话框
                    if (window.confirm(`发现未保存的草稿\n保存时间: ${savedTime}\n\n是否恢复？`)) {
                        setCurrentPost(prev => ({
                            ...prev,
                            title: draft.title || '',
                            summary: draft.summary || '',
                            content: draft.content || '',
                            published: draft.published ?? prev.published,
                            tags: draft.tags || [],
                            categoryId: draft.categoryId ?? null,
                            accessLevel: draft.accessLevel || 'regular'
                        }));
                        setHasUnsavedChanges(true);
                        setMessage({ type: 'info', text: '已恢复本地草稿' });
                    } else {
                        // 用户拒绝恢复，清除草稿
                        localStorage.removeItem(draftKey);
                    }
                }
                
                draftRestoredRef.current = true;
            } catch (e) {
                console.error('Failed to parse draft:', e);
                localStorage.removeItem(draftKey);
            }
        }
    }, [isEditing, currentPost.id]);
    
    // 重置草稿恢复标记
    useEffect(() => {
        if (!isEditing) {
            draftRestoredRef.current = false;
        }
    }, [isEditing]);

    // Warn on exit
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isEditing && hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isEditing, hasUnsavedChanges]);

    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isEditing) return;
            
            // Ctrl/Cmd + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (!isSaving) {
                    handleSubmit();
                }
            }
            
            // Esc: 返回列表（需要确认）
            if (e.key === 'Escape') {
                // 只在没有打开对话框时触发
                if (document.activeElement?.tagName !== 'INPUT' && 
                    document.activeElement?.tagName !== 'TEXTAREA' &&
                    !document.activeElement?.closest('[role="dialog"]')) {
                    if (hasUnsavedChanges) {
                        if (window.confirm('您有未保存的更改，确定要离开吗？')) {
                            setIsEditing(false);
                        }
                    } else {
                        setIsEditing(false);
                    }
                }
            }
            
            // Ctrl/Cmd + Shift + P: 切换发布状态
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
                e.preventDefault();
                updatePostState(prev => ({ ...prev, published: !prev.published }));
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, isSaving, hasUnsavedChanges]);

    const clearDraft = (id) => {
        const draftKey = id ? `draft_post_${id}` : 'draft_post_new';
        localStorage.removeItem(draftKey);
        if (id) localStorage.removeItem('draft_post_new'); 
    };


    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                await Promise.all([fetchPosts(), fetchTags(), fetchCategories()]);
            } catch (err) {
                setLoadError('加载数据失败，请刷新页面重试');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [activeTab, searchTerm]);

    const fetchPosts = async () => {
        const res = await api.get('/posts/admin/all', { 
            params: { 
                published: activeTab === 'posts' ? 'true' : activeTab === 'drafts' ? 'false' : undefined, 
                search: searchTerm || undefined 
            } 
        });
        setPosts(res.data);
    };

    const fetchTags = async () => {
        const res = await tagsApi.getAll({ search: searchTerm || undefined });
        setTags(res.data);
    };

    const fetchCategories = async () => {
        const res = await categoriesApi.getAll({ search: searchTerm || undefined });
        setCategories(res.data);
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

    const updatePostState = (update) => {
        setCurrentPost(prev => {
            const newState = typeof update === 'function' ? update(prev) : update;
            return newState;
        });
        setHasUnsavedChanges(true);
        setAutoSaveStatus('');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setMessage({ type: '', text: '' });
        
        // 表单验证
        const title = currentPost.title?.trim();
        const content = currentPost.content?.trim();
        
        if (!title) {
            setMessage({ type: 'error', text: '文章标题不能为空' });
            return;
        }
        
        if (title.length > 200) {
            setMessage({ type: 'error', text: '文章标题不能超过200个字符' });
            return;
        }
        
        if (!content) {
            setMessage({ type: 'error', text: '文章内容不能为空' });
            return;
        }
        
        setIsSaving(true);

        try {
            const postData = {
                title: title,
                summary: currentPost.summary?.trim() || '',
                content: content,
                published: currentPost.published,
                tags: (currentPost.tags || []).filter(tag => tag && tag.trim()),
                categoryId: currentPost.categoryId ? parseInt(currentPost.categoryId) : null,
                accessLevel: currentPost.accessLevel || 'regular'
            };

            let savedId = currentPost.id;

            if (currentPost.id) {
                await api.put(`/posts/${currentPost.id}`, postData);
                setMessage({ type: 'success', text: '文章更新成功' });
            } else {
                const res = await api.post('/posts', postData);
                savedId = res.data.id;
                setCurrentPost(prev => ({ ...prev, id: savedId })); 
                setMessage({ type: 'success', text: '文章创建成功' });
            }
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            clearDraft(savedId);
            fetchPosts();
            fetchTags();
            fetchCategories();
        } catch (err) {
            const errorMsg = err?.response?.data?.message || err.message || '保存失败';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(',', '');
            if (newTag && !currentPost.tags.includes(newTag)) {
                updatePostState({
                    ...currentPost,
                    tags: [...(currentPost.tags || []), newTag]
                });
            }
            setTagInput('');
        }
    };

    // Category selection handled via dropdown; no free-text addition here

    const handleRemoveTag = (tagToRemove) => {
        updatePostState({
            ...currentPost,
            tags: currentPost.tags.filter(tag => tag !== tagToRemove)
        });
    };

    // No category removal; single selection via dropdown

    const handleEditPost = (post) => {
        const tagNames = post.tags ? post.tags.map(t => t.name) : [];
        setCurrentPost({ id: post.id, title: post.title, summary: post.summary, content: post.content, published: post.published, tags: tagNames, categoryId: post.category ? post.category.id : null, accessLevel: post.accessLevel || 'regular' });
        setIsEditing(true);
        setHasUnsavedChanges(false);
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
                                ? 'bg-background text-foreground'
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
                            onClick={() => { 
                                setCurrentPost({ title: '', summary: '', content: '', published: true, tags: [], categoryId: null, accessLevel: 'regular' }); 
                                setIsEditing(true); 
                                setHasUnsavedChanges(false);
                            }}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-background flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => {
                                        if (hasUnsavedChanges) {
                                            if (!window.confirm('您有未保存的更改，确定要离开吗？')) return;
                                        }
                                        setIsEditing(false);
                                    }} 
                                    className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                    title="返回列表 (Esc)"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="font-medium text-foreground">{currentPost.id ? '编辑文章' : '新建文章'}</span>
                                    {currentPost.id && (
                                        <span className="text-xs text-muted-foreground/60">#{currentPost.id}</span>
                                    )}
                                    <div className="flex items-center gap-1.5 ml-2">
                                        {autoSaveStatus === 'saving' && (
                                            <span className="flex items-center gap-1 text-xs text-blue-500">
                                                <span className="animate-spin">⚡</span> 保存中...
                                            </span>
                                        )}
                                        {autoSaveStatus === 'saved' && (
                                            <span className="flex items-center gap-1 text-xs text-green-500">
                                                <Check size={12} /> 已自动保存
                                            </span>
                                        )}
                                        {autoSaveStatus === 'error' && (
                                            <span className="flex items-center gap-1 text-xs text-destructive">
                                                ⚠️ 自动保存失败
                                            </span>
                                        )}
                                        {!autoSaveStatus && hasUnsavedChanges && (
                                            <span className="flex items-center gap-1 text-xs text-amber-500">
                                                ● 未保存
                                            </span>
                                        )}
                                        {!autoSaveStatus && !hasUnsavedChanges && lastSaved && (
                                            <span className="text-xs text-muted-foreground/60">
                                                已保存 {lastSaved.toLocaleTimeString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* 编辑模式切换按钮组 */}
                                <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                                    <button
                                        onClick={() => setViewMode('rich')}
                                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'rich' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="富文本编辑器"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('markdown')}
                                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'markdown' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Markdown 源码"
                                    >
                                        <CodeIcon size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="预览"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                                
                                <div className="h-4 w-px bg-border mx-1" />

                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    title="保存文章 (⌘S / Ctrl+S)"
                                >
                                    {isSaving ? <span className="animate-spin text-xs">⏳</span> : <Save size={16} />}
                                    保存
                                </button>
                                
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={`p-2 rounded-md transition-colors ${isSidebarOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                    title="文章设置 (侧边栏)"
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
                                    {/* 预览模式 */}
                                    {viewMode === 'preview' ? (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <h1 className="text-4xl font-bold mb-8">{currentPost.title || '无标题'}</h1>
                                            {currentPost.summary && (
                                                <p className="text-muted-foreground text-lg mb-6 italic">{currentPost.summary}</p>
                                            )}
                                            <MarkdownRenderer content={currentPost.content || '*暂无内容*'} />
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="无标题"
                                                className="w-full bg-transparent text-4xl sm:text-5xl font-bold placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 px-0 mb-8"
                                                value={currentPost.title}
                                                onChange={(e) => updatePostState({ ...currentPost, title: e.target.value })}
                                                maxLength={200}
                                            />
                                            
                                            <div className="flex-1">
                                                {viewMode === 'markdown' ? (
                                                    <textarea
                                                        placeholder="在此输入 Markdown 内容..."
                                                        className="w-full h-full min-h-[500px] bg-transparent text-base font-mono placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 resize-none leading-relaxed"
                                                        value={currentPost.content}
                                                        onChange={(e) => updatePostState({ ...currentPost, content: e.target.value })}
                                                    />
                                                ) : (
                                                    <RichTextEditor
                                                        key={currentPost.id || 'new'}
                                                        content={currentPost.content}
                                                        onChange={(newContent) => updatePostState({ ...currentPost, content: newContent })}
                                                        variant="seamless"
                                                        editorClassName="px-0 min-h-[calc(100vh-300px)]"
                                                        className="-mx-1"
                                                    />
                                                )}
                                            </div>
                                        </>
                                    )}
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
                                                            onChange={() => updatePostState({ ...currentPost, published: !currentPost.published })}
                                                        />
                                                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">分类</h3>
                                                 <div className="relative">
                                                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" size={14} />
                                                    <Select
                                                        value={currentPost.categoryId || ''}
                                                        onChange={(val) => updatePostState({ ...currentPost, categoryId: val ? parseInt(val) : null })}
                                                        options={[
                                                            { value: '', label: '未选择分类' },
                                                            ...categories.map(c => ({
                                                                value: c.id,
                                                                label: `${Array(c.level && c.level > 1 ? c.level - 1 : 0).fill('— ').join('')}${c.name}`
                                                            }))
                                                        ]}
                                                        placeholder="未选择分类"
                                                        className="w-full"
                                                        triggerClassName="pl-9"
                                                    />
                                                </div>
                                            </div>

                                            {/* Access Level */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">访问权限</h3>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" size={14} />
                                                    <Select
                                                        value={currentPost.accessLevel || 'regular'}
                                                        onChange={(val) => updatePostState({ ...currentPost, accessLevel: val })}
                                                        options={[
                                                            { value: 'regular', label: '公开 (普通用户)' },
                                                            { value: 'plus', label: 'Plus 会员专享' },
                                                            { value: 'pro', label: 'Pro 会员专享' }
                                                        ]}
                                                        placeholder="公开 (普通用户)"
                                                        className="w-full"
                                                        triggerClassName="pl-9"
                                                    />
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
                                                    onChange={(e) => updatePostState({ ...currentPost, summary: e.target.value })}
                                                />
                                            </div>
                                            
                                             {/* Templates */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">快捷操作</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => updatePostState(prev => ({ ...prev, content: prev.content + '\n\n' + `# Markdown 渲染全功能展示
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
                                {/* Loading 状态 */}
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-primary" size={24} />
                                        <span className="ml-2 text-muted-foreground">加载中...</span>
                                    </div>
                                )}
                                
                                {/* Error 状态 */}
                                {loadError && !isLoading && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <AlertCircle className="text-destructive mb-2" size={32} />
                                        <p className="text-destructive">{loadError}</p>
                                        <button 
                                            onClick={() => { fetchPosts(); fetchTags(); fetchCategories(); }}
                                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                                        >
                                            重新加载
                                        </button>
                                    </div>
                                )}
                                
                                {/* 文章列表 */}
                                {!isLoading && !loadError && (
                                    <div className="grid gap-2 2xl:grid-cols-2 3xl:grid-cols-3">
                                        {filteredPosts.length === 0 ? (
                                            <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground col-span-full">
                                                {searchTerm ? '没有找到匹配的文章' : '暂无文章'}
                                            </div>
                                        ) : (
                                            filteredPosts.map(post => (
                                                <div
                                                    key={post.id}
                                                    className="group bg-card border border-border p-4 rounded-lg hover:border-primary/50 transition-all flex justify-between items-center"
                                                >
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <input type="checkbox" checked={selectedPostIds.includes(post.id)} onChange={(e) => toggleSelectPost(post.id, e.target.checked)}
                                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0"
                                                            />
                                                            <h3 className="font-medium text-foreground text-sm truncate max-w-[200px] sm:max-w-none" title={post.title}>{post.title}</h3>
                                                            {post.accessLevel && post.accessLevel !== 'regular' && (
                                                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                                                                    post.accessLevel === 'pro' 
                                                                        ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' 
                                                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                }`}>
                                                                    {post.accessLevel.toUpperCase()}
                                                                </span>
                                                            )}
                                                            {post.tags && post.tags.length > 0 && (
                                                                <div className="flex gap-1.5 flex-wrap">
                                                                    {post.tags.slice(0, 3).map(tag => (
                                                                        <span key={tag.id} className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground">
                                                                            #{tag.name}
                                                                        </span>
                                                                    ))}
                                                                    {post.tags.length > 3 && (
                                                                        <span className="text-[10px] text-muted-foreground">+{post.tags.length - 3}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {post.category && (
                                                                <span className="shrink-0 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] text-blue-500">
                                                                    {post.category.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 pl-7 text-xs text-muted-foreground font-mono">
                                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
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
                                )}
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

export default Posts;