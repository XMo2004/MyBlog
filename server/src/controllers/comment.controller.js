const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());
const { logOperation } = require('../middleware/log.middleware');

// 管理员获取所有评论（分页、筛选）
exports.getAllComments = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, postId, userId, startDate, endDate, sort = 'newest' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};
        
        if (search) {
            where.content = { contains: search };
        }
        if (postId) {
            where.postId = parseInt(postId);
        }
        if (userId) {
            where.userId = parseInt(userId);
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const orderBy = sort === 'oldest' 
            ? { createdAt: 'asc' } 
            : sort === 'mostLikes' 
                ? { likes: { _count: 'desc' } }
                : { createdAt: 'desc' };

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: {
                        select: { id: true, username: true, nickname: true, avatar: true }
                    },
                    post: {
                        select: { id: true, title: true }
                    },
                    _count: {
                        select: { likes: true }
                    }
                }
            }),
            prisma.comment.count({ where })
        ]);

        const formattedComments = comments.map(c => ({
            ...c,
            likeCount: c._count.likes,
            _count: undefined
        }));

        res.json({
            data: formattedComments,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取评论列表失败' });
    }
};

// 管理员删除评论
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const commentId = parseInt(id);

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                user: { select: { username: true } },
                post: { select: { title: true } }
            }
        });

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }

        const before = { ...comment };

        // 先删除关联的点赞
        await prisma.commentLike.deleteMany({ where: { commentId } });
        // 再删除评论
        await prisma.comment.delete({ where: { id: commentId } });

        await logOperation({ 
            req, 
            model: 'Comment', 
            action: 'delete', 
            targetId: commentId, 
            before, 
            after: null 
        });

        res.json({ message: '评论已删除' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '删除评论失败' });
    }
};

// 管理员批量删除评论
exports.bulkDeleteComments = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: '请选择要删除的评论' });
        }

        const commentIds = ids.map(id => parseInt(id));

        // 先删除关联的点赞
        await prisma.commentLike.deleteMany({ 
            where: { commentId: { in: commentIds } } 
        });
        
        // 再批量删除评论
        const result = await prisma.comment.deleteMany({
            where: { id: { in: commentIds } }
        });

        await logOperation({ 
            req, 
            model: 'Comment', 
            action: 'bulk_delete', 
            targetId: null, 
            before: { ids: commentIds }, 
            after: { deleted: result.count } 
        });

        res.json({ message: `成功删除 ${result.count} 条评论` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '批量删除评论失败' });
    }
};

// 获取评论统计
exports.getCommentStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        const [total, todayCount, weekCount, monthCount, topPosts, topUsers] = await Promise.all([
            prisma.comment.count(),
            prisma.comment.count({ where: { createdAt: { gte: today } } }),
            prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.comment.count({ where: { createdAt: { gte: monthAgo } } }),
            // 评论最多的文章
            prisma.post.findMany({
                take: 5,
                orderBy: { comments: { _count: 'desc' } },
                select: {
                    id: true,
                    title: true,
                    _count: { select: { comments: true } }
                }
            }),
            // 评论最多的用户
            prisma.user.findMany({
                take: 5,
                orderBy: { comments: { _count: 'desc' } },
                select: {
                    id: true,
                    username: true,
                    nickname: true,
                    _count: { select: { comments: true } }
                }
            })
        ]);

        res.json({
            total,
            todayCount,
            weekCount,
            monthCount,
            topPosts: topPosts.map(p => ({ ...p, commentCount: p._count.comments })),
            topUsers: topUsers.map(u => ({ ...u, commentCount: u._count.comments }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取评论统计失败' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: parseInt(postId),
                userId: req.user.userId,
            },
            include: {
                user: {
                    select: { username: true, nickname: true, avatar: true }
                }
            }
        });

        await logOperation({ req, model: 'Comment', action: 'create', targetId: comment.id, before: null, after: comment })
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;
        const id = parseInt(commentId);

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId: id
                }
            }
        });

        let result;
        if (existingLike) {
            await prisma.commentLike.delete({
                where: {
                    userId_commentId: {
                        userId,
                        commentId: id
                    }
                }
            });
            result = { liked: false };
        } else {
            await prisma.commentLike.create({
                data: {
                    userId,
                    commentId: id
                }
            });
            result = { liked: true };
        }

        const count = await prisma.commentLike.count({ where: { commentId: id } });
        res.json({ ...result, count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
