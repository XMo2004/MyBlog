const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = global.prisma || (global.prisma = new PrismaClient())
const { backupOnce } = require('../services/backup.service')
const bcrypt = require('bcryptjs')
const { logOperation } = require('../middleware/log.middleware')

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const stripMd = (s) => {
  s = s.replace(/```[\s\S]*?```/g, '')
  s = s.replace(/`[^`]*`/g, '')
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/^\s{0,3}[-*+]\s+/gm, '')
  s = s.replace(/^>\s+/gm, '')
  s = s.replace(/[*_~`]+/g, '')
  s = s.replace(/<\/?[^>]+>/g, '')
  return s
}

const countWords = (s) => {
  s = stripMd(s || '')
  const cn = (s.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (s.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || []).length
  return cn + en
}

exports.getStats = async (req, res) => {
  try {
    // Calculate total word count for all published posts
    const allPublishedPosts = await prisma.post.findMany({
      where: { published: true },
      select: { content: true }
    });
    const totalWordCount = allPublishedPosts.reduce((acc, post) => acc + countWords(post.content), 0);

    const [
      postsCount,
      postsDraftCount,
      commentsCount,
      tagsCount,
      resourcesCount,
      projectsCount
    ] = await Promise.all([
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({ where: { published: false } }),
      prisma.comment.count(),
      prisma.tag.count(),
      prisma.resource.count(),
      prisma.project.count()
    ]);

    // Get recent activity (logs)
    const logs = await prisma.operationLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Get trend data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const visits = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true,
        ip: true
      }
    });

    const trendMap = new Map();
    // Initialize map for last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateKey = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        trendMap.set(dateKey, { name: dayName, visits: new Set(), views: 0, date: dateKey });
    }

    visits.forEach(v => {
        const dateKey = v.createdAt.toISOString().split('T')[0];
        if (trendMap.has(dateKey)) {
            const entry = trendMap.get(dateKey);
            entry.views++;
            if (v.ip) entry.visits.add(v.ip);
        }
    });

    const trendData = Array.from(trendMap.values()).map(item => ({
        name: item.name,
        visits: item.visits.size,
        views: item.views
    }));

    // Get heatmap data (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const postsForHeatmap = await prisma.post.findMany({
        where: {
            published: true,
            createdAt: {
                gte: oneYearAgo
            }
        },
        select: {
            createdAt: true,
            content: true
        }
    });

    const heatmapMap = new Map();
    postsForHeatmap.forEach(post => {
        const dateKey = post.createdAt.toISOString().split('T')[0];
        const wordCount = countWords(post.content);
        
        if (heatmapMap.has(dateKey)) {
            const entry = heatmapMap.get(dateKey);
            entry.wordCount += wordCount;
            entry.postCount += 1;
        } else {
            heatmapMap.set(dateKey, { wordCount, postCount: 1 });
        }
    });

    const heatmapData = Array.from(heatmapMap.entries()).map(([date, data]) => ({
        date,
        count: data.wordCount,
        postCount: data.postCount
    }));

    // Get tag distribution data
    const tagsWithCounts = await prisma.tag.findMany({
        include: {
            _count: {
                select: { posts: true }
            }
        }
    });

    const tagDistribution = tagsWithCounts.map(tag => ({
        name: tag.name,
        value: tag._count.posts
    })).filter(tag => tag.value > 0).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 tags

    // Get category distribution data
    const categoriesWithCounts = await prisma.category.findMany({
        include: {
            _count: {
                select: { posts: true }
            }
        }
    });

    const categoryDistribution = categoriesWithCounts.map(cat => ({
        name: cat.name,
        value: cat._count.posts
    })).filter(cat => cat.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

    res.json({
      posts: { published: postsCount, drafts: postsDraftCount },
      comments: commentsCount,
      totalWordCount,
      tags: tagsCount,
      resources: resourcesCount,
      projects: projectsCount,
      recentLogs: logs,
      trendData,
      heatmapData,
      tagDistribution,
      categoryDistribution
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Stats failed' });
  }
}

exports.listBackups = async (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '..', '..', 'backups')
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
    const files = await fs.promises.readdir(backupsDir)
    const list = await Promise.all(
      files
        .filter(f => f.endsWith('.db'))
        .map(async f => {
          const stat = await fs.promises.stat(path.join(backupsDir, f))
          return { file: f, createdAt: stat.mtime }
        })
    )
    res.json(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  } catch (e) {
    res.status(500).json({ message: 'List failed' })
  }
}

exports.backupDatabase = async (req, res) => {
  try {
    const file = await backupOnce()
    res.json({ file })
  } catch (e) {
    res.status(500).json({ message: 'Backup failed' })
  }
}

// listBackups defined above

exports.restoreDatabase = async (req, res) => {
  try {
    const { file } = req.body
    if (!file) return res.status(400).json({ message: 'file required' })
    const backupsDir = path.join(__dirname, '..', '..', 'backups')
    const prismaDir = path.join(__dirname, '..', '..', 'prisma')
    if (!/^[A-Za-z0-9._-]+\.db$/.test(file)) return res.status(400).json({ message: 'invalid file' })
    const source = path.join(backupsDir, file)
    const resolvedSource = path.resolve(source)
    const resolvedBackups = path.resolve(backupsDir)
    if (!resolvedSource.startsWith(resolvedBackups)) return res.status(400).json({ message: 'invalid path' })
    const target = path.join(prismaDir, 'dev.db')
    await prisma.$disconnect()
    await fs.promises.copyFile(source, target)
    await prisma.$connect()
    res.json({ restored: file })
  } catch (e) {
    res.status(500).json({ message: 'Restore failed' })
  }
}

exports.getLogs = async (req, res) => {
  try {
    const { model, action, userId, limit = 50, offset = 0 } = req.query
    const where = {}
    if (model) where.model = model
    if (action) where.action = action
    if (userId) where.userId = parseInt(userId)
    const logs = await prisma.operationLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: parseInt(offset) })
    res.json(logs)
  } catch (e) {
    res.status(500).json({ message: 'Logs failed' })
  }
}

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, username: true, role: true, createdAt: true } })
    if (!user) return res.status(404).json({ message: 'Not found' })
    res.json(user)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

exports.updateMe = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body || {}
    const id = req.user.userId
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ message: 'Not found' })
    if (!currentPassword) return res.status(400).json({ message: 'Current password required' })
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return res.status(400).json({ message: 'Invalid current password' })
    const data = {}
    if (typeof username !== 'undefined' && username !== user.username) {
      return res.status(400).json({ message: 'Username change not allowed' })
    }
    if (newPassword && newPassword.length >= 6) {
      const hashed = await bcrypt.hash(newPassword, 10)
      data.password = hashed
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No changes' })
    const before = { id: user.id, username: user.username, role: user.role }
    const updated = await prisma.user.update({ where: { id }, data })
    await logOperation({ req, model: 'User', action: 'update', targetId: id, before, after: { id: updated.id, username: updated.username, role: updated.role } })
    res.json({ id: updated.id, username: updated.username, role: updated.role })
  } catch (e) {
    res.status(500).json({ message: 'Update failed' })
  }
}

exports.listUsers = async (req, res) => {
  try {
    const { q = '', limit = 20, offset = 0, order = 'desc' } = req.query
    const where = {}
    if (q) where.username = { contains: q }
    const total = await prisma.user.count({ where })
    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, role: true, membershipType: true, createdAt: true },
      orderBy: { createdAt: order === 'asc' ? 'asc' : 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    })
    res.json({ data: users, total })
  } catch (e) {
    res.status(500).json({ message: 'List users failed' })
  }
}

exports.updateUserRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { role } = req.body || {}
    if (!['user', 'editor', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const u = await prisma.user.findUnique({ where: { id } })
    if (!u) return res.status(404).json({ message: 'Not found' })
    if (role === 'admin' && u.username !== 'xmo2004') return res.status(400).json({ message: 'Only xmo2004 can be admin' })
    if (u.username === 'xmo2004' && role !== 'admin') return res.status(400).json({ message: 'xmo2004 must remain admin' })
    const before = { id: u.id, username: u.username, role: u.role }
    const updated = await prisma.user.update({ where: { id }, data: { role } })
    await logOperation({ req, model: 'User', action: 'update_role', targetId: id, before, after: { id: updated.id, username: updated.username, role: updated.role } })
    res.json({ id: updated.id, username: updated.username, role: updated.role })
  } catch (e) {
    res.status(500).json({ message: 'Update role failed' })
  }
}

exports.updateUserMembership = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { membershipType } = req.body || {}
    if (!['regular', 'plus', 'pro'].includes(membershipType)) return res.status(400).json({ message: 'Invalid membership type' })
    const u = await prisma.user.findUnique({ where: { id } })
    if (!u) return res.status(404).json({ message: 'Not found' })
    
    const before = { id: u.id, username: u.username, membershipType: u.membershipType }
    const updated = await prisma.user.update({ where: { id }, data: { membershipType } })
    await logOperation({ req, model: 'User', action: 'update_membership', targetId: id, before, after: { id: updated.id, username: updated.username, membershipType: updated.membershipType } })
    res.json({ id: updated.id, username: updated.username, membershipType: updated.membershipType })
  } catch (e) {
    res.status(500).json({ message: 'Update membership failed' })
  }
}

exports.updateUserPassword = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { newPassword } = req.body || {}
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: '密码至少 6 位' })
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return res.status(404).json({ message: 'Not found' })
    if (target.role === 'admin') return res.status(400).json({ message: '不允许通过此方式修改管理员密码' })
    const hashed = await bcrypt.hash(newPassword, 10)
    const before = { id: target.id, username: target.username, role: target.role }
    const updated = await prisma.user.update({ where: { id }, data: { password: hashed } })
    await logOperation({ req, model: 'User', action: 'update', targetId: id, before, after: { id: updated.id, username: updated.username, role: updated.role } })
    res.json({ id: updated.id, username: updated.username, role: updated.role })
  } catch (e) {
    res.status(500).json({ message: 'Update password failed' })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return res.status(404).json({ message: 'User not found' })

    // Prevent deleting the main admin
    if (target.username === 'xmo2004' || target.role === 'admin') {
      // Allow deleting other admins? Maybe restricted.
      // Let's protect xmo2004 specifically, and maybe self-deletion if we wanted (but this is admin interface).
      if (target.username === 'xmo2004') {
        return res.status(403).json({ message: 'Cannot delete the super admin' })
      }
    }

    const before = { id: target.id, username: target.username, role: target.role }

    // Use transaction to ensure cleanup
    await prisma.$transaction(async (tx) => {
      // 1. Delete comment likes by this user
      await tx.commentLike.deleteMany({ where: { userId: id } })

      // 2. Delete bookmarks by this user
      await tx.bookmark.deleteMany({ where: { userId: id } })

      // 3. Delete bookmark collections by this user
      await tx.bookmarkCollection.deleteMany({ where: { userId: id } })

      // 4. Delete comments made by this user
      await tx.comment.deleteMany({ where: { userId: id } })

      // 5. Find posts by this user to clean up their related data
      const userPosts = await tx.post.findMany({ where: { authorId: id }, select: { id: true } })
      const userPostIds = userPosts.map(p => p.id)

      if (userPostIds.length > 0) {
        // 6. Delete bookmarks on posts authored by this user (by other users)
        await tx.bookmark.deleteMany({ where: { postId: { in: userPostIds } } })

        // 7. Delete comments on posts authored by this user
        await tx.comment.deleteMany({ where: { postId: { in: userPostIds } } })
        
        // 8. Delete column nodes related to these posts
        await tx.columnNode.deleteMany({ where: { postId: { in: userPostIds } } })

        // 9. Delete posts authored by this user
        await tx.post.deleteMany({ where: { authorId: id } })
      }

      // 10. Delete the user
      await tx.user.delete({ where: { id } })
    })

    await logOperation({ req, model: 'User', action: 'delete', targetId: id, before, after: null })
    res.json({ message: 'User deleted successfully' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Delete user failed: ' + e.message })
  }
}

exports.batchUpdateRole = async (req, res) => {

  try {
    const { ids, role } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids required' })
    if (!['user', 'editor'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const users = await prisma.user.findMany({ where: { id: { in: ids } } })
    if (users.some(u => u.username === 'xmo2004')) return res.status(400).json({ message: 'xmo2004 cannot change via batch' })
    await prisma.$transaction(ids.map(id => prisma.user.update({ where: { id }, data: { role } })))
    await logOperation({ req, model: 'User', action: 'batch_update_role', targetId: null, before: null, after: { ids, role } })
    res.json({ updated: ids.length })
  } catch (e) {
    res.status(500).json({ message: 'Batch update failed' })
  }
}
