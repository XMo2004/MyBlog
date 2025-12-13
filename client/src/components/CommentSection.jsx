import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { commentsApi } from '../lib/api';
import Toast from './Toast';
import { Send, User, Heart } from 'lucide-react';

const CommentSection = ({ postId, comments = [], user }) => {
    const [commentList, setCommentList] = useState(comments);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await api.post(`/posts/${postId}/comments`, { content });
            // The response doesn't include isLiked or likeCount, so we default them
            const newComment = { ...res.data, isLiked: false, likeCount: 0 };
            setCommentList([newComment, ...commentList]);
            setContent('');
            setToast({ message: '评论发布成功', type: 'success' });
        } catch (error) {
            console.error('Failed to post comment', error);
            setToast({ message: '评论发布失败', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            // Optimistic update
            setCommentList(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        isLiked: !c.isLiked,
                        likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1
                    };
                }
                return c;
            }));

            const res = await commentsApi.toggleLike(commentId);
            
            // Update with actual server data (optional, but good for consistency)
            setCommentList(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        isLiked: res.data.liked,
                        likeCount: res.data.count
                    };
                }
                return c;
            }));

        } catch (error) {
            console.error('Failed to like comment', error);
            setToast({ message: '操作失败', type: 'error' });
            // Revert optimistic update
            setCommentList(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        isLiked: !c.isLiked,
                        likeCount: c.isLiked ? c.likeCount + 1 : c.likeCount - 1
                    };
                }
                return c;
            }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="mt-12 border-t border-border pt-10">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                评论 <span className="text-base font-normal text-muted-foreground">({commentList.length})</span>
            </h3>

            {/* Comment Form */}
            <div className="mb-10">
                {user ? (
                    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <div className="flex gap-4 mb-4">
                            <div className="shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.nickname || user.username} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="写下你的评论..."
                                    className="w-full bg-background border border-input rounded-md p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !content.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                                {submitting ? '发布中...' : '发布评论'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-muted/30 border border-border border-dashed rounded-xl p-8 text-center">
                        <p className="text-muted-foreground mb-4">登录后参与评论</p>
                        <Link
                            to="/login"
                            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                        >
                            立即登录
                        </Link>
                    </div>
                )}
            </div>

            {/* Comment List */}
            <div className="space-y-6">
                {commentList.length > 0 ? (
                    commentList.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="shrink-0">
                                {comment.user?.avatar ? (
                                    <img src={comment.user.avatar} alt={comment.user.nickname || comment.user.username} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <User size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground">
                                        {comment.user?.nickname || comment.user?.username || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-2">
                                    {comment.content}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => handleLike(comment.id)}
                                        className={`flex items-center gap-1 text-sm transition-colors ${
                                            comment.isLiked 
                                                ? 'text-red-500 hover:text-red-600' 
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} />
                                        <span>{comment.likeCount || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        暂无评论，快来抢沙发吧~
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
