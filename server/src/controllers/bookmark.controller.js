const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());

// Get all bookmark collections for the current user
exports.getCollections = async (req, res) => {
    try {
        const userId = req.user.userId;
        let collections = await prisma.bookmarkCollection.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { bookmarks: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // If no collections exist, create a default one
        if (collections.length === 0) {
            const defaultCollection = await prisma.bookmarkCollection.create({
                data: {
                    userId,
                    name: '默认收藏夹',
                    isDefault: true
                }
            });
            collections = [{ ...defaultCollection, _count: { bookmarks: 0 } }];
        }

        res.json(collections);
    } catch (error) {
        console.error('Get collections error:', error);
        res.status(500).json({ message: '获取收藏夹失败' });
    }
};

// Create a new collection
exports.createCollection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: '收藏夹名称不能为空' });
        }

        const existing = await prisma.bookmarkCollection.findFirst({
            where: { userId, name }
        });

        if (existing) {
            return res.status(400).json({ message: '收藏夹已存在' });
        }

        const collection = await prisma.bookmarkCollection.create({
            data: {
                userId,
                name,
                description
            }
        });

        res.json(collection);
    } catch (error) {
        console.error('Create collection error:', error);
        res.status(500).json({ message: '创建收藏夹失败' });
    }
};

// Update a collection
exports.updateCollection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, description } = req.body;

        const collection = await prisma.bookmarkCollection.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!collection) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }

        if (name && name !== collection.name) {
             const existing = await prisma.bookmarkCollection.findFirst({
                where: { userId, name }
            });
            if (existing) {
                return res.status(400).json({ message: '同名收藏夹已存在' });
            }
        }

        const updated = await prisma.bookmarkCollection.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update collection error:', error);
        res.status(500).json({ message: '更新收藏夹失败' });
    }
};

// Delete a collection
exports.deleteCollection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const collection = await prisma.bookmarkCollection.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!collection) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }

        if (collection.isDefault) {
            return res.status(400).json({ message: '默认收藏夹不能删除' });
        }

        await prisma.bookmarkCollection.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('Delete collection error:', error);
        res.status(500).json({ message: '删除收藏夹失败' });
    }
};

// Get bookmarks (optionally by collection)
exports.getBookmarks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { collectionId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where = { userId };
        if (collectionId) {
            where.collectionId = parseInt(collectionId);
        }

        const [bookmarks, total] = await Promise.all([
            prisma.bookmark.findMany({
                where,
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                            summary: true,
                            published: true,
                            createdAt: true,
                            category: { select: { id: true, name: true } }
                        }
                    },
                    collection: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.bookmark.count({ where })
        ]);

        res.json({
            data: bookmarks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ message: '获取收藏列表失败' });
    }
};

// Add bookmark
exports.addBookmark = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { postId, collectionId } = req.body;

        // Verify post exists
        const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });
        if (!post) {
            return res.status(404).json({ message: '文章不存在' });
        }

        let targetCollectionId = collectionId;
        
        // If no collection specified, use or create default
        if (!targetCollectionId) {
            let defaultCollection = await prisma.bookmarkCollection.findFirst({
                where: { userId, isDefault: true }
            });
            
            if (!defaultCollection) {
                // Try to find any collection
                 const anyCollection = await prisma.bookmarkCollection.findFirst({
                    where: { userId }
                });
                
                if (anyCollection) {
                    defaultCollection = anyCollection;
                } else {
                    defaultCollection = await prisma.bookmarkCollection.create({
                        data: {
                            userId,
                            name: '默认收藏夹',
                            isDefault: true
                        }
                    });
                }
            }
            targetCollectionId = defaultCollection.id;
        }

        // Check if already bookmarked in this collection
        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_postId_collectionId: {
                    userId,
                    postId: parseInt(postId),
                    collectionId: parseInt(targetCollectionId)
                }
            }
        });

        if (existing) {
            return res.status(400).json({ message: '已收藏' });
        }

        const bookmark = await prisma.bookmark.create({
            data: {
                userId,
                postId: parseInt(postId),
                collectionId: parseInt(targetCollectionId)
            }
        });

        res.json(bookmark);
    } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ message: '收藏失败' });
    }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params; // bookmark id

        await prisma.bookmark.deleteMany({
            where: {
                id: parseInt(id),
                userId // Ensure ownership
            }
        });

        res.json({ message: '已取消收藏' });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ message: '取消收藏失败' });
    }
};

// Remove bookmark by post ID (removes from all collections)
exports.removeBookmarkByPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;

        await prisma.bookmark.deleteMany({
            where: {
                userId,
                postId: parseInt(postId)
            }
        });

        res.json({ message: '已取消收藏' });
    } catch (error) {
        console.error('Remove bookmark by post error:', error);
        res.status(500).json({ message: '取消收藏失败' });
    }
};

// Move a bookmark to another collection
exports.updateBookmark = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { collectionId } = req.body;

        const bookmarkId = parseInt(id);
        const targetCollectionId = parseInt(collectionId);

        if (!bookmarkId || Number.isNaN(bookmarkId)) {
            return res.status(400).json({ message: '无效的收藏 ID' });
        }
        if (!targetCollectionId || Number.isNaN(targetCollectionId)) {
            return res.status(400).json({ message: '无效的收藏夹 ID' });
        }

        const bookmark = await prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId
            }
        });

        if (!bookmark) {
            return res.status(404).json({ message: '收藏不存在' });
        }

        const targetCollection = await prisma.bookmarkCollection.findFirst({
            where: {
                id: targetCollectionId,
                userId
            }
        });

        if (!targetCollection) {
            return res.status(404).json({ message: '目标收藏夹不存在' });
        }

        if (bookmark.collectionId === targetCollectionId) {
            const unchanged = await prisma.bookmark.findUnique({
                where: { id: bookmarkId },
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                            summary: true,
                            published: true,
                            createdAt: true,
                            category: { select: { id: true, name: true } }
                        }
                    },
                    collection: { select: { id: true, name: true } }
                }
            });
            return res.json(unchanged);
        }

        const duplicate = await prisma.bookmark.findFirst({
            where: {
                userId,
                postId: bookmark.postId,
                collectionId: targetCollectionId
            }
        });

        if (duplicate) {
            return res.status(400).json({ message: '目标收藏夹已存在该文章的收藏' });
        }

        const updated = await prisma.bookmark.update({
            where: { id: bookmarkId },
            data: {
                collectionId: targetCollectionId
            },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        summary: true,
                        published: true,
                        createdAt: true,
                        category: { select: { id: true, name: true } }
                    }
                },
                collection: { select: { id: true, name: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update bookmark error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: '目标收藏夹已存在该文章的收藏' });
        }
        res.status(500).json({ message: '移动收藏失败' });
    }
};

// Check bookmark status for a post
exports.checkBookmarkStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;

        const bookmarks = await prisma.bookmark.findMany({
            where: {
                userId,
                postId: parseInt(postId)
            },
            include: {
                collection: true
            }
        });

        res.json({
            isBookmarked: bookmarks.length > 0,
            collections: bookmarks.map(b => b.collection)
        });
    } catch (error) {
        console.error('Check bookmark status error:', error);
        res.status(500).json({ message: '获取收藏状态失败' });
    }
};

// Toggle bookmark (add or remove)
exports.toggleBookmark = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { postId, collectionId } = req.body;

        // Verify post exists
        const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });
        if (!post) {
            return res.status(404).json({ message: '文章不存在' });
        }

        let targetCollectionId = collectionId;
        
        // If no collection specified, use or create default
        if (!targetCollectionId) {
             let defaultCollection = await prisma.bookmarkCollection.findFirst({
                where: { userId, isDefault: true }
            });
            if (!defaultCollection) {
                // Find any or create default
                 const anyCollection = await prisma.bookmarkCollection.findFirst({
                    where: { userId }
                });
                if (anyCollection) {
                    defaultCollection = anyCollection;
                } else {
                    defaultCollection = await prisma.bookmarkCollection.create({
                        data: {
                            userId,
                            name: '默认收藏夹',
                            isDefault: true
                        }
                    });
                }
            }
            targetCollectionId = defaultCollection.id;
        }

        // Check if already bookmarked
        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_postId_collectionId: {
                    userId,
                    postId: parseInt(postId),
                    collectionId: parseInt(targetCollectionId)
                }
            }
        });

        if (existing) {
            // Remove
            await prisma.bookmark.delete({
                where: { id: existing.id }
            });
            res.json({ action: 'removed', collectionId: targetCollectionId });
        } else {
            // Add
            const bookmark = await prisma.bookmark.create({
                data: {
                    userId,
                    postId: parseInt(postId),
                    collectionId: parseInt(targetCollectionId)
                }
            });
            res.json({ action: 'added', bookmark });
        }
    } catch (error) {
        console.error('Toggle bookmark error:', error);
        res.status(500).json({ message: '操作失败' });
    }
};
