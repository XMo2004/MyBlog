import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { columnsApi } from '../lib/api';
import api from '../lib/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TOC from '../components/TOC';
import { ChevronRight, ChevronDown, Folder, FileText, Menu, X, ArrowLeft, Clock, Calendar, PanelLeftClose, PanelLeftOpen, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { format } from 'date-fns';

const NavNode = ({ node, activeId, onSelect, level = 0, expandedNodes, onToggle }) => {
    const isFolder = node.type === 'category';
    const isExpanded = expandedNodes.includes(node.id);
    const isActive = activeId === node.id;

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`group flex items-center gap-2 py-1.5 px-3 mx-2 rounded-md cursor-pointer transition-all duration-200 ${isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder) {
                        onToggle(node.id);
                    }
                    onSelect(node);
                }}
            >
                <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    {isFolder && (
                        <ChevronRight size={14} className={`opacity-50 ${isActive ? 'text-primary' : ''}`} />
                    )}
                    {!isFolder && <span className="w-[14px] inline-block" />}
                </span>

                {isFolder ? (
                    <Folder size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100'}`} />
                ) : (
                    <FileText size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100'}`} />
                )}

                <span className="text-sm truncate leading-none py-0.5">{node.title}</span>
            </div>

            {isFolder && isExpanded && hasChildren && (
                <div className="mt-0.5">
                    {node.children.map(child => (
                        <NavNode
                            key={child.id}
                            node={child}
                            activeId={activeId}
                            onSelect={onSelect}
                            level={level + 1}
                            expandedNodes={expandedNodes}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ColumnDetail = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [column, setColumn] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeNode, setActiveNode] = useState(null);
    const [postContent, setPostContent] = useState(null);
    const [loadingPost, setLoadingPost] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!column) return;

        const nodeId = searchParams.get('nodeId');
        if (nodeId) {
            const findNode = (nodes) => {
                for (const node of nodes) {
                    if (node.id === parseInt(nodeId)) return node;
                    if (node.children) {
                        const found = findNode(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            const node = findNode(column.tree);
            if (node) {
                setActiveNode(node);
                // Expand parents
                // This is tricky without parent pointer in JS object, but we can assume user expands as they go or we recursively open.
                // For now, let's just ensure the node is set.
            }
        } else if (column.tree.length > 0) {
            setActiveNode(column.tree[0]);
        }
    }, [column, searchParams]);

    useEffect(() => {
        if (activeNode && activeNode.type === 'post' && activeNode.postId) {
            fetchPost(activeNode.postId);
        } else {
            setPostContent(null);
        }
    }, [activeNode]);

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

    const fetchPost = async (postId) => {
        setLoadingPost(true);
        try {
            const res = await api.get(`/posts/${postId}`);
            setPostContent(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingPost(false);
        }
    };

    const handleNodeSelect = (node) => {
        setActiveNode(node);
        setSearchParams({ nodeId: node.id });
        if (window.innerWidth < 1024) {
            setMobileMenuOpen(false);
        }
    };

    const handleToggle = (nodeId) => {
        setExpandedNodes(prev =>
            prev.includes(nodeId)
                ? prev.filter(id => id !== nodeId)
                : [...prev, nodeId]
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!column) return <div className="min-h-screen flex items-center justify-center">Column not found</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background w-full">
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed md:relative z-50 h-full bg-card border-r border-border transition-all duration-300 flex flex-col
                    ${mobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
                    ${isSidebarOpen ? 'md:w-80 2xl:w-96' : 'md:w-0 overflow-hidden'}
                `}
            >
                    {/* Mobile Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
                    </div>

                    <div className="h-full min-h-0 flex flex-col w-full">
                        {/* Header Actions */}
                        <div className="absolute top-2 right-2 lg:static lg:flex lg:justify-between lg:items-center lg:p-4 lg:pb-2">
                            <span className="hidden lg:block font-semibold text-sm text-muted-foreground pl-2">
                                Contents
                            </span>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="hidden lg:block p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                                title="Collapse Sidebar"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="lg:hidden p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
                            {column.tree.map(node => (
                                <NavNode
                                    key={node.id}
                                    node={node}
                                    activeId={activeNode?.id}
                                    onSelect={handleNodeSelect}
                                    expandedNodes={expandedNodes}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                </div>
            </aside>

            {/* Main Content */}
            <div id="column-scroll-container" className="flex-1 h-full min-h-0 overflow-y-auto relative w-full custom-scrollbar bg-background">
                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden absolute top-4 left-4 p-2 bg-background border border-border rounded-lg text-muted-foreground z-10"
                >
                    <Menu size={20} />
                </button>

                {/* Desktop Expand Toggle */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden lg:flex absolute top-6 left-6 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all z-10"
                        title="Expand Sidebar"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                <div className="max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1400px] mx-auto min-h-full pb-32">
                    {!activeNode ? (
                        <div className="animate-fade-in">
                            <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-400">
                                {column.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> {column.readTime}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} /> {format(new Date(column.updatedAt), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none 2xl:prose-xl">
                                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                                    {column.description}
                                </p>
                                {/* Show table of contents summary maybe? */}
                            </div>
                        </div>
                    ) : activeNode.type === 'category' ? (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Folder className="text-primary" />
                                {activeNode.title}
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                {activeNode.children && activeNode.children.length > 0 ? (
                                    activeNode.children.map(child => (
                                        <div
                                            key={child.id}
                                            onClick={() => handleNodeSelect(child)}
                                            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {child.type === 'category' ? (
                                                    <Folder className="text-primary group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <FileText className="text-muted-foreground group-hover:scale-110 transition-transform" />
                                                )}
                                                <div>
                                                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                        {child.title}
                                                    </h3>
                                                    {child.post && (
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                            {child.post.summary || 'No summary available'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground italic">Empty folder</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex gap-6 lg:gap-10">
                            <div className="flex-1 min-w-0">
                                {loadingPost ? (
                                    <div className="space-y-4">
                                        <div className="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                                        <div className="h-64 bg-muted rounded w-full animate-pulse"></div>
                                    </div>
                                ) : postContent ? (
                                    <div>
                                        <h1 className="text-3xl font-bold mb-4">{postContent.title}</h1>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                                            <span>{format(new Date(postContent.createdAt), 'MMM d, yyyy')}</span>
                                            {postContent.author && <span>by {postContent.author.username}</span>}
                                        </div>
                                        <MarkdownRenderer content={postContent.content} className="article-content prose-lg 2xl:prose-xl max-w-none" />
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <p className="text-muted-foreground">Post content not available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {postContent && postContent.content && (
                <>
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
                            <TOC content={postContent.content} scrollContainer="#column-scroll-container" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
