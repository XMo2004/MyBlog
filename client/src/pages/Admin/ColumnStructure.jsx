import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2, Edit, Save, ArrowLeft, GripVertical, X, Check } from 'lucide-react';
import { columnsApi } from '../../lib/api';
import api from '../../lib/api';
import Toast from '../../components/Toast';

const TreeNode = ({ node, level = 0, onToggle, onEdit, onDelete, onAddChild, expandedNodes }) => {
    const isExpanded = expandedNodes.includes(node.id);
    const isFolder = node.type === 'category';

    return (
        <div className="select-none">
            <div 
                className={`flex items-center gap-2 2xl:gap-3 3xl:gap-4 p-2 2xl:p-3 hover:bg-muted/50 rounded-lg group transition-colors ${level > 0 ? 'ml-6 2xl:ml-8 3xl:ml-10 border-l border-border' : ''}`}
            >
                {isFolder && (
                    <button 
                        onClick={() => onToggle(node.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                        {isExpanded ? <ChevronDown size={14} className="2xl:w-4 2xl:h-4" /> : <ChevronRight size={14} className="2xl:w-4 2xl:h-4" />}
                    </button>
                )}
                {!isFolder && <div className="w-6 2xl:w-8 3xl:w-10" />}
                
                {isFolder ? <Folder size={16} className="text-primary 2xl:w-5 2xl:h-5" /> : <FileText size={16} className="text-muted-foreground 2xl:w-5 2xl:h-5" />}
                
                <span className="flex-1 text-sm 2xl:text-base font-medium truncate">
                    {node.title}
                    {node.post && <span className="ml-2 text-xs 2xl:text-sm text-muted-foreground">({node.post.title})</span>}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isFolder && level < 4 && (
                        <button 
                            onClick={() => onAddChild(node)}
                            className="p-1 hover:bg-muted text-green-500 rounded"
                            title="添加子项"
                        >
                            <Plus size={14} className="2xl:w-4 2xl:h-4" />
                        </button>
                    )}
                    <button 
                        onClick={() => onEdit(node)}
                        className="p-1 hover:bg-muted text-primary rounded"
                        title="编辑"
                    >
                        <Edit size={14} className="2xl:w-4 2xl:h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(node)}
                        className="p-1 hover:bg-muted text-destructive rounded"
                        title="删除"
                    >
                        <Trash2 size={14} className="2xl:w-4 2xl:h-4" />
                    </button>
                </div>
            </div>

            {isFolder && isExpanded && node.children && (
                <div className="ml-2 2xl:ml-3 3xl:ml-4">
                    {node.children.map(child => (
                        <TreeNode 
                            key={child.id} 
                            node={child} 
                            level={level + 1}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            expandedNodes={expandedNodes}
                        />
                    ))}
                    {node.children.length === 0 && (
                        <div className="ml-8 2xl:ml-10 3xl:ml-12 py-2 text-xs 2xl:text-sm text-muted-foreground italic">空文件夹</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function ColumnStructure() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [column, setColumn] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [posts, setPosts] = useState([]);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [editingNode, setEditingNode] = useState(null);
    const [parentNode, setParentNode] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Form states
    const [formData, setFormData] = useState({
        title: '',
        type: 'category', // 'category' or 'post'
        postId: '',
        order: 0
    });

    useEffect(() => {
        fetchData();
        fetchPosts();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await columnsApi.getTree(id);
            setColumn(res.data);
            // Auto expand roots
            setExpandedNodes(res.data.tree.map(n => n.id));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            // Get published posts
            const res = await api.get('/posts/admin/all?published=true');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = (nodeId) => {
        setExpandedNodes(prev => 
            prev.includes(nodeId) 
                ? prev.filter(id => id !== nodeId)
                : [...prev, nodeId]
        );
    };

    const handleAddRoot = () => {
        setModalMode('create');
        setParentNode(null);
        setEditingNode(null);
        setFormData({ title: '', type: 'category', postId: '', order: 0 });
        setShowModal(true);
    };

    const handleAddChild = (parent) => {
        setModalMode('create');
        setParentNode(parent);
        setEditingNode(null);
        setFormData({ title: '', type: 'post', postId: '', order: 0 }); // Default to post for children usually
        setShowModal(true);
    };

    const handleEdit = (node) => {
        setModalMode('edit');
        setEditingNode(node);
        setParentNode(null); // Parent doesn't change on edit usually
        setFormData({
            title: node.title,
            type: node.type,
            postId: node.postId || '',
            order: node.order
        });
        setShowModal(true);
    };

    const handleDelete = async (node) => {
        if (!window.confirm('确定要删除此节点及其所有子节点吗？')) return;
        setMessage({ type: '', text: '' });
        try {
            await columnsApi.deleteNode(node.id);
            setMessage({ type: 'success', text: '节点已删除' });
            fetchData();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '删除节点失败' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            if (modalMode === 'create') {
                await columnsApi.createNode(id, {
                    ...formData,
                    parentId: parentNode ? parentNode.id : null
                });
                setMessage({ type: 'success', text: '节点创建成功' });
            } else {
                await columnsApi.updateNode(editingNode.id, formData);
                setMessage({ type: 'success', text: '节点更新成功' });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '操作失败' });
        }
    };

    if (loading) return <div className="p-8 text-center">加载中...</div>;
    if (!column) return <div className="p-8 text-center">未找到专栏</div>;

    return (
        <div className="p-4 md:p-6 max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard/columns')}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{column.title}</h1>
                        <p className="text-muted-foreground">结构管理</p>
                    </div>
                </div>
                <button
                    onClick={handleAddRoot}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    添加根节点
                </button>
            </div>

            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />

            <div className="bg-card border border-border rounded-lg shadow-sm min-h-[500px] p-4 md:p-6">
                {/* Tree View */}
                {column.tree.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Folder size={48} className="mx-auto mb-4 opacity-50" />
                        <p>此专栏暂无内容。</p>
                        <button 
                            onClick={handleAddRoot}
                            className="text-primary hover:underline mt-2"
                        >
                            创建第一个项目
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {column.tree.map(node => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                onToggle={handleToggle}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddChild={handleAddChild}
                                expandedNodes={expandedNodes}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'create' ? '添加项目' : '编辑项目'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">类型</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="category"
                                            checked={formData.type === 'category'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="accent-primary"
                                        />
                                        <span>分类/文件夹</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="post"
                                            checked={formData.type === 'post'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="accent-primary"
                                        />
                                        <span>文章</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">标题</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                    placeholder="输入标题"
                                    required
                                />
                            </div>

                            {formData.type === 'post' && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">选择文章</label>
                                    <select
                                        value={formData.postId}
                                        onChange={e => setFormData({ ...formData, postId: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                    >
                                        <option value="">-- 选择一篇文章 --</option>
                                        {posts.map(post => (
                                            <option key={post.id} value={post.id}>
                                                {post.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">排序</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
