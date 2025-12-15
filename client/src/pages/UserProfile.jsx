import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Shield,
    LogOut,
    Home,
    ChevronRight,
    Lock,
    Phone,
    LayoutDashboard,
    Bookmark,
    FolderPlus,
    Trash2,
    Pencil
} from 'lucide-react';
import api from '../lib/api';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';
import Select from '../components/Select';

const AccountNavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${active
            ? 'bg-secondary text-foreground font-medium'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
    >
        <Icon size={16} />
        <span className="truncate">{label}</span>
    </button>
);

// Content Section Wrapper
const Section = ({ title, subtitle, children }) => (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="mb-6 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-normal text-foreground mb-2">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
    </div>
);

// Card Component
const Card = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-6 ${className}`}>
        {(title || subtitle) && (
            <div className="p-6 border-b border-border">
                {title && <h3 className="text-lg font-medium">{title}</h3>}
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
        )}
        <div className="p-0">
            {children}
        </div>
    </div>
);

// Info Row Component
const InfoRow = ({ label, value, onClick, isEditable = true, icon: Icon }) => (
    <button 
        onClick={onClick}
        disabled={!isEditable}
        className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0 ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
    >
        <div className="flex items-center gap-4 flex-1">
            {Icon && <div className="text-muted-foreground"><Icon size={20} /></div>}
            <div>
                <div className="font-medium text-muted-foreground uppercase tracking-wider text-xs mb-1">{label}</div>
                <div className="text-foreground font-medium">{value || '未设置'}</div>
            </div>
        </div>
        {isEditable && <ChevronRight size={20} className="text-muted-foreground" />}
    </button>
);

// Home Tab Content
const HomeTab = ({ user, onChangeTab, navigate }) => (
    <Section title="首页" subtitle={`欢迎，${user.nickname || '用户'}`}>
        <div className="grid md:grid-cols-2 gap-6">
            <Card title="个人信息" subtitle="管理您的基本信息">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} />
                        )}
                    </div>
                    <h3 className="font-medium text-lg mb-1">{user.nickname}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{user.username}</p>
                    <button 
                        onClick={() => onChangeTab('personal')}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                    >
                        管理个人信息
                    </button>
                </div>
            </Card>

            <Card title="隐私与安全" subtitle="保护您的账号安全">
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <Shield className="text-primary mt-1" size={24} />
                        <div>
                            <h4 className="font-medium mb-1">账号安全</h4>
                            <p className="text-sm text-muted-foreground">您的账号受密码保护。请定期检查您的安全设置。</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onChangeTab('security')}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                    >
                        管理账号安全
                    </button>
                </div>
            </Card>

            {user.role === 'admin' && (
                <Card title="管理后台" subtitle="系统管理入口" className="md:col-span-2">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <h4 className="font-medium">进入后台管理系统</h4>
                                <p className="text-sm text-muted-foreground">管理文章、用户、配置等系统资源</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                        >
                            进入后台
                        </button>
                    </div>
                </Card>
            )}
        </div>
    </Section>
);

// Personal Info Tab Content
const PersonalInfoTab = ({ user, onUpdateUser }) => {
    const [editingField, setEditingField] = useState(null);
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.put('/auth/me', formData);
            onUpdateUser(res.data);
            setEditingField(null);
            setToast({ message: '更新成功', type: 'success' });
        } catch (err) {
            const msg = err.response?.data?.message || '更新失败';
            setToast({ message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Section title="个人信息" subtitle="管理您的基本信息和联系方式">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <Card title="基本信息" subtitle="部分信息可能对其他用户可见">
                {/* Avatar Row */}
                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border cursor-pointer" onClick={() => setEditingField('avatar')}>
                    <div className="font-medium text-muted-foreground uppercase tracking-wider text-xs">头像</div>
                    <div className="flex-1 flex justify-end pr-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} className="text-muted-foreground" />
                            )}
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground" />
                </div>
                
                {/* Edit Avatar Form */}
                {editingField === 'avatar' && (
                    <div className="p-6 bg-muted/30 border-b border-border">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">头像链接</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={formData.avatar || ''} 
                                    onChange={e => setFormData({...formData, avatar: e.target.value})}
                                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background"
                                    placeholder="输入图片URL"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">支持 JPG, PNG, GIF 格式的图片链接</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setEditingField(null);
                                    setFormData({...user});
                                }}
                                className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                            >
                                {loading ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Nickname Row */}
                <InfoRow 
                    label="昵称" 
                    value={user.nickname} 
                    onClick={() => setEditingField('nickname')}
                />

                {/* Edit Nickname Form */}
                {editingField === 'nickname' && (
                    <div className="p-6 bg-muted/30 border-b border-border">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">昵称</label>
                            <input 
                                type="text" 
                                value={formData.nickname || ''} 
                                onChange={e => setFormData({...formData, nickname: e.target.value})}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                                placeholder="输入新昵称"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setEditingField(null);
                                    setFormData({...user});
                                }}
                                className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                            >
                                {loading ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            <Card title="联系方式" subtitle="您的联系信息">
                 <InfoRow 
                    label="用户名/手机号" 
                    value={user.username} 
                    isEditable={false}
                    icon={Phone}
                />
            </Card>

            <Card title="账号属性" subtitle="您的账号类型及状态">
                <InfoRow 
                    label="会员等级" 
                    value={user.membershipType === 'pro' ? 'Pro会员' : user.membershipType === 'plus' ? 'Plus会员' : '普通用户'} 
                    isEditable={false}
                />
                 <InfoRow 
                    label="注册时间" 
                    value={new Date(user.createdAt).toLocaleDateString()} 
                    isEditable={false}
                />
                <InfoRow 
                    label="用户 ID" 
                    value={user.id} 
                    isEditable={false}
                />
            </Card>
        </Section>
    );
};
// Security Tab Content
const SecurityTab = ({ onLogout }) => (
    <Section title="安全性" subtitle="保护您的账号安全">
        <Card title="登录与安全">
             <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-1">账号登录</h4>
                        <p className="text-muted-foreground mb-4">您已登录到此设备。为了保护您的账号安全，请在公共设备上使用后退出登录。</p>
                        <button 
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors font-medium border border-red-200 dark:border-red-900"
                        >
                            <LogOut size={18} />
                            退出登录
                        </button>
                    </div>
                </div>
             </div>
        </Card>
    </Section>
);

// Favorites Tab Content
const FavoritesTab = () => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [editCollectionName, setEditCollectionName] = useState('');
    const [editCollectionDescription, setEditCollectionDescription] = useState('');
    const [toast, setToast] = useState(null);

    // Fetch collections
    const fetchCollections = async () => {
        try {
            const res = await api.get('/bookmarks/collections');
            setCollections(res.data);
            if (!selectedCollection && res.data.length > 0) {
                setSelectedCollection(res.data[0]);
            }
        } catch (err) {
            console.error('Failed to fetch collections', err);
            setToast({ message: '获取收藏夹失败', type: 'error' });
        }
    };

    // Fetch bookmarks for selected collection
    const fetchBookmarks = async (collectionId) => {
        if (!collectionId) return;
        setBookmarksLoading(true);
        try {
            const res = await api.get('/bookmarks', { params: { collectionId } });
            setBookmarks(res.data.data);
        } catch (err) {
            console.error('Failed to fetch bookmarks', err);
            setToast({ message: '获取收藏列表失败', type: 'error' });
        } finally {
            setBookmarksLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedCollection) {
            fetchBookmarks(selectedCollection.id);
        }
    }, [selectedCollection]);

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        try {
            await api.post('/bookmarks/collections', { name: newCollectionName });
            setNewCollectionName('');
            setShowCreateModal(false);
            fetchCollections();
            setToast({ message: '创建成功', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || '创建失败', type: 'error' });
        }
    };

    const openEditCollection = (collection) => {
        setEditingCollection(collection);
        setEditCollectionName(collection?.name || '');
        setEditCollectionDescription(collection?.description || '');
        setShowEditModal(true);
    };

    const handleUpdateCollection = async () => {
        if (!editingCollection) return;
        if (!editCollectionName.trim()) return;
        try {
            await api.put(`/bookmarks/collections/${editingCollection.id}`, {
                name: editCollectionName.trim(),
                description: editCollectionDescription?.trim() || null
            });
            setShowEditModal(false);
            setEditingCollection(null);
            await fetchCollections();
            setToast({ message: '更新成功', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || '更新失败', type: 'error' });
        }
    };

    const handleDeleteCollection = async (id) => {
        if (!window.confirm('确定要删除这个收藏夹吗？其中的收藏将被移除。')) return;
        try {
            await api.delete(`/bookmarks/collections/${id}`);
            fetchCollections();
            // If deleting current, switch to first available
            if (selectedCollection?.id === id) {
                setSelectedCollection(null); // Will be set by fetchCollections
            }
            setToast({ message: '删除成功', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || '删除失败', type: 'error' });
        }
    };

    const handleRemoveBookmark = async (bookmarkId) => {
        try {
            await api.delete(`/bookmarks/${bookmarkId}`);
            fetchBookmarks(selectedCollection.id);
            setToast({ message: '已取消收藏', type: 'success' });
        } catch {
            setToast({ message: '取消收藏失败', type: 'error' });
        }
    };

    const handleMoveBookmark = async (bookmarkId, targetCollectionId) => {
        try {
            await api.put(`/bookmarks/${bookmarkId}`, { collectionId: targetCollectionId });
            // moved away from current collection => refresh list
            if (selectedCollection?.id) {
                fetchBookmarks(selectedCollection.id);
            }
            fetchCollections();
            setToast({ message: '已移动收藏', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || '移动失败', type: 'error' });
        }
    };

    return (
        <Section title="我的收藏" subtitle="管理您的收藏文章">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex flex-col md:flex-row gap-6 min-h-[560px]">
                {/* Collections Sidebar */}
                <div className="w-full md:w-64 shrink-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <h3 className="font-medium">收藏夹</h3>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="p-1.5 hover:bg-muted rounded-md text-primary transition-colors"
                            title="新建收藏夹"
                        >
                            <FolderPlus size={18} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {collections.map(collection => (
                            <button
                                key={collection.id}
                                onClick={() => setSelectedCollection(collection)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors
                                    ${selectedCollection?.id === collection.id 
                                        ? 'bg-primary/10 text-primary font-medium' 
                                        : 'hover:bg-muted text-muted-foreground'
                                    }`}
                            >
                                <span className="truncate">{collection.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs opacity-60">{collection._count?.bookmarks || 0}</span>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditCollection(collection);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity"
                                        title="编辑收藏夹"
                                    >
                                        <Pencil size={14} />
                                    </div>
                                    {!collection.isDefault && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCollection(collection.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookmarks List */}
                <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="font-medium">
                            {selectedCollection ? selectedCollection.name : '选择收藏夹'}
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {bookmarksLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : bookmarks.length > 0 ? (
                            <div className="space-y-3">
                                {bookmarks.map(bookmark => (
                                    <div key={bookmark.id} className="p-3 rounded-lg border border-border hover:shadow-sm transition-shadow bg-background flex justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <Link 
                                                to={`/posts/${bookmark.post.id}`}
                                                className="font-medium text-foreground hover:text-primary truncate block mb-1"
                                            >
                                                {bookmark.post.title}
                                            </Link>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span>{bookmark.post.category?.name || '未分类'}</span>
                                                <span>•</span>
                                                <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {collections.length > 1 && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground shrink-0">移动到</span>
                                                    <div className="w-44">
                                                        <Select
                                                            options={collections.map(c => ({ value: c.id, label: c.name }))}
                                                            value={bookmark.collection?.id}
                                                            onChange={(val) => {
                                                                if (val === bookmark.collection?.id) return;
                                                                handleMoveBookmark(bookmark.id, val);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveBookmark(bookmark.id)}
                                            className="text-muted-foreground hover:text-red-500 self-center p-2"
                                            title="取消收藏"
                                        >
                                            <Bookmark size={18} fill="currentColor" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                                <p>暂无收藏文章</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Collection Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-sm rounded-xl shadow-lg border border-border p-6"
                        >
                            <h3 className="text-lg font-medium mb-4">新建收藏夹</h3>
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                                placeholder="收藏夹名称"
                                className="w-full px-3 py-2 rounded-md border border-input bg-background mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={handleCreateCollection}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    创建
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Collection Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-sm rounded-xl shadow-lg border border-border p-6"
                        >
                            <h3 className="text-lg font-medium mb-4">编辑收藏夹</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2">名称</label>
                                    <input
                                        type="text"
                                        value={editCollectionName}
                                        onChange={(e) => setEditCollectionName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background"
                                        placeholder="收藏夹名称"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">描述（可选）</label>
                                    <textarea
                                        value={editCollectionDescription}
                                        onChange={(e) => setEditCollectionDescription(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[88px]"
                                        placeholder="简单写点用途说明"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-5">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingCollection(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleUpdateCollection}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    保存
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Section>
    );
};

export const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const navigate = useNavigate();

    const upsertLocalUser = (partial) => {
        try {
            const raw = localStorage.getItem('user');
            const existing = raw ? JSON.parse(raw) : {};
            localStorage.setItem('user', JSON.stringify({ ...existing, ...partial }));
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                upsertLocalUser(res.data);
            } catch (err) {
                console.error('Failed to fetch user info', err);
                if (err.response && (err.response.status === 401 || err.response.status === 404)) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-background border border-border rounded-xl overflow-hidden min-h-[70vh] grid lg:grid-cols-[240px_1fr]">
                {/* Sidebar */}
                <aside className="border-b lg:border-b-0 lg:border-r border-border bg-background">
                    <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.nickname || user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{user.nickname || user.username}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.membershipType || 'regular'}</div>
                            </div>
                        </div>
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                                title="进入后台"
                            >
                                <LayoutDashboard size={14} />
                            </button>
                        )}
                    </div>

                    <nav className="p-3 space-y-1">
                        <div className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">账户</div>
                        <AccountNavItem icon={Home} label="概览" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                        <AccountNavItem icon={User} label="个人资料" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
                        <AccountNavItem icon={Bookmark} label="收藏管理" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
                        <AccountNavItem icon={Shield} label="安全" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                    </nav>
                </aside>

                {/* Content */}
                <div className="min-w-0 flex flex-col">
                    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-md px-4 flex items-center justify-between">
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">个人中心</div>
                            <div className="text-xs text-muted-foreground truncate">{activeTab === 'home' ? 'Overview' : activeTab === 'personal' ? 'Profile' : activeTab === 'favorites' ? 'Bookmarks' : 'Security'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogout}
                                className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                退出
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {activeTab === 'home' && <HomeTab user={user} onChangeTab={setActiveTab} navigate={navigate} />}
                        {activeTab === 'personal' && (
                            <PersonalInfoTab
                                user={user}
                                onUpdateUser={(u) => {
                                    setUser(u);
                                    upsertLocalUser(u);
                                }}
                            />
                        )}
                        {activeTab === 'favorites' && <FavoritesTab />}
                        {activeTab === 'security' && <SecurityTab onLogout={handleLogout} />}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;