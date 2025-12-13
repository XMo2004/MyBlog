const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

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
