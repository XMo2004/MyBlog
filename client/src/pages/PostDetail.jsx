import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TOC from '../components/TOC';
import MembershipUpgradePrompt from '../components/MembershipUpgradePrompt';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, Calendar, Tag, Folder, PanelRightOpen, PanelRightClose, Bookmark, Plus, X } from 'lucide-react';
import api from '../lib/api';
import Toast from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [accessError, setAccessError] = useState(null);
    
    // Bookmark states
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showBookmarkModal, setShowBookmarkModal] = useState(false);
    const [collections, setCollections] = useState([]);
    const [userCollections, setUserCollections] = useState([]); // Collections where this post is saved
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [toast, setToast] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setAccessError(null);
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                
                // Check bookmark status if user is logged in
                if (localStorage.getItem('token')) {
                    checkBookmarkStatus();
                }
            } catch (err) {
                console.error('Failed to fetch post', err);
                if (err.response && err.response.status === 403 && err.response.data.requiredLevel) {
                    setAccessError(err.response.data);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    const checkBookmarkStatus = async () => {
        try {
            const res = await api.get(`/bookmarks/check/${id}`);
            setIsBookmarked(res.data.isBookmarked);
            setUserCollections(res.data.collections.map(c => c.id));
        } catch (err) {
            console.error('Failed to check bookmark status', err);
        }
    };

    const fetchCollections = async () => {
        try {
            const res = await api.get('/bookmarks/collections');
            setCollections(res.data);
        } catch (err) {
            console.error('Failed to fetch collections', err);
        }
    };

    const handleBookmarkClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchCollections();
        setShowBookmarkModal(true);
    };

    const toggleCollection = async (collectionId) => {
        try {
            const res = await api.post('/bookmarks/toggle', { postId: id, collectionId });
            
            if (res.data.action === 'added') {
                setUserCollections([...userCollections, collectionId]);
                setIsBookmarked(true);
                setToast({ message: '已添加到收藏夹', type: 'success' });
            } else {
                setUserCollections(userCollections.filter(cId => cId !== collectionId));
                if (userCollections.length === 1 && userCollections[0] === collectionId) {
                    setIsBookmarked(false);
                }
                setToast({ message: '已移除', type: 'success' });
            }
        } catch (err) {
            setToast({ message: '操作失败', type: 'error' });
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        try {
            const res = await api.post('/bookmarks/collections', { name: newCollectionName });
            setCollections([...collections, res.data]);
            setNewCollectionName('');
            setIsCreatingCollection(false);
            // Automatically add to this new collection
            toggleCollection(res.data.id);
        } catch (err) {
            setToast({ message: '创建失败', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;
    
    if (accessError) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft size={20} className="mr-2" /> 返回文章列表
                </Link>
                <MembershipUpgradePrompt requiredLevel={accessError.requiredLevel} />
            </div>
        );
    }

    if (!post) return <div className="text-center py-20 text-destructive">文章未找到</div>;

    return (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto flex items-start gap-10 px-4 sm:px-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 返回文章列表
                    </Link>
                </div>

                <article>
                    <header className="space-y-6 border-b border-border pb-8 mb-10">
                        <div className="flex justify-between items-start gap-4">
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                {post.title}
                            </h1>
                            <button
                                onClick={handleBookmarkClick}
                                className={`p-3 rounded-full border transition-all ${
                                    isBookmarked 
                                        ? 'bg-primary text-primary-foreground border-primary' 
                                        : 'bg-background hover:bg-muted border-border text-muted-foreground'
                                }`}
                                title={isBookmarked ? "已收藏" : "收藏文章"}
                            >
                                <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} />
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {post.category && (
                                <span className="flex items-center gap-2">
                                    <Folder size={16} />
                                    <Link to={`/?category=${encodeURIComponent(post.category.name)}`} className="hover:text-primary transition-colors">
                                        {post.category.name}
                                    </Link>
                                </span>
                            )}
                            <span className="flex items-center gap-2">
                                <Tag size={16} />
                                {post.tags.map(tag => tag.name).join(', ') || '无标签'}
                            </span>
                            <span className="flex items-center gap-2">
                                {post.author.avatar && (
                                    <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                )}
                                <span>作者: {post.author.nickname || post.author.username}</span>
                            </span>
                        </div>
                    </header>

                    <div className="pb-10">
                        <MarkdownRenderer content={post.content} className="article-content prose-lg 2xl:prose-xl max-w-none" />
                    </div>

                    <CommentSection postId={post.id} comments={post.comments} user={user} />
                </article>
            </div>

            <button
                onClick={() => setIsTocOpen(prev => !prev)}
                className="fixed right-6 top-28 sm:top-32 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/40 shadow-lg text-sm text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all"
            >
                {isTocOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                <span className="hidden sm:inline">目录</span>
            </button>

            <div
                className={`fixed top-24 bottom-6 right-6 z-30 w-72 sm:w-80 bg-background/80 backdrop-blur-md border border-border/40 shadow-2xl rounded-2xl transform transition-all duration-300 ${
                    isTocOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
                }`}
            >
                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                    <TOC content={post.content} />
                </div>
            </div>

            {/* Bookmark Modal */}
            <AnimatePresence>
                {showBookmarkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-sm rounded-xl shadow-lg border border-border overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-medium">添加到收藏夹</h3>
                                <button onClick={() => setShowBookmarkModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {collections.map(collection => (
                                    <button
                                        key={collection.id}
                                        onClick={() => toggleCollection(collection.id)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors text-left"
                                    >
                                        <span>{collection.name}</span>
                                        {userCollections.includes(collection.id) && (
                                            <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 border-t border-border bg-muted/30">
                                {isCreatingCollection ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCollectionName}
                                            onChange={e => setNewCollectionName(e.target.value)}
                                            placeholder="新收藏夹名称"
                                            className="flex-1 px-3 py-2 rounded-md border border-input text-sm"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleCreateCollection}
                                            className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                                        >
                                            创建
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsCreatingCollection(true)}
                                        className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                                    >
                                        <Plus size={16} />
                                        新建收藏夹
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
