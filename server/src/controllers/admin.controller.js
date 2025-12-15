const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = global.prisma || (global.prisma = new PrismaClient())
const { backupOnce, restoreBackup, listBackups, getDatabaseType } = require('../services/backup.service')
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

    // ============ 新增企业级统计维度 ============
    
    // 用户统计
    const [usersCount, todayUsers, weekUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 用户增长趋势（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const usersForGrowth = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: { createdAt: true }
    });

    const userGrowthMap = new Map();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateKey = d.toISOString().split('T')[0];
      userGrowthMap.set(dateKey, 0);
    }

    usersForGrowth.forEach(u => {
      const dateKey = u.createdAt.toISOString().split('T')[0];
      if (userGrowthMap.has(dateKey)) {
        userGrowthMap.set(dateKey, userGrowthMap.get(dateKey) + 1);
      }
    });

    const userGrowthData = Array.from(userGrowthMap.entries()).map(([date, count]) => ({
      date: date.slice(5), // MM-DD format
      count
    }));

    // 评论统计（今日、本周、待审核）
    const [todayComments, weekComments, pendingComments] = await Promise.all([
      prisma.comment.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // 获取最近需要关注的评论（最近24小时）
      prisma.comment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 评论趋势（最近7天）
    const commentsForTrend = await prisma.comment.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: { createdAt: true }
    });

    const commentTrendMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      commentTrendMap.set(dateKey, { name: dayName, count: 0 });
    }

    commentsForTrend.forEach(c => {
      const dateKey = c.createdAt.toISOString().split('T')[0];
      if (commentTrendMap.has(dateKey)) {
        const entry = commentTrendMap.get(dateKey);
        entry.count++;
      }
    });

    const commentTrendData = Array.from(commentTrendMap.values());

    // 今日访问统计
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayVisits = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: todayStart
        }
      },
      select: { ip: true }
    });

    const todayPV = todayVisits.length;
    const todayUV = new Set(todayVisits.map(v => v.ip)).size;

    // 本周访问统计
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekVisits = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: weekStart
        }
      },
      select: { ip: true }
    });

    const weekPV = weekVisits.length;
    const weekUV = new Set(weekVisits.map(v => v.ip)).size;

    // 热门文章 Top 5
    const topPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { 
        comments: {
          _count: 'desc'
        }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    // 内容健康度指标
    const [
      categoriesCount,
      columnsCount,
      bookmarksCount
    ] = await Promise.all([
      prisma.category.count(),
      prisma.column.count(),
      prisma.bookmark.count()
    ]);

    // 计算平均文章字数
    const avgWordCount = postsCount > 0 ? Math.round(totalWordCount / postsCount) : 0;

    // 会员统计
    const membershipStats = await prisma.user.groupBy({
      by: ['membershipType'],
      _count: true
    });

    const membershipDistribution = membershipStats.map(m => ({
      level: m.membershipType || 'regular',
      count: m._count
    }));

    res.json({
      posts: { published: postsCount, drafts: postsDraftCount },
      comments: commentsCount,
      totalWordCount,
      avgWordCount,
      tags: tagsCount,
      resources: resourcesCount,
      projects: projectsCount,
      recentLogs: logs,
      trendData,
      heatmapData,
      tagDistribution,
      categoryDistribution,
      // 新增数据
      users: {
        total: usersCount,
        today: todayUsers,
        thisWeek: weekUsers
      },
      userGrowthData,
      commentsStats: {
        total: commentsCount,
        today: todayComments,
        thisWeek: weekComments,
        recentPending: pendingComments
      },
      commentTrendData,
      todayStats: {
        pv: todayPV,
        uv: todayUV
      },
      weekStats: {
        pv: weekPV,
        uv: weekUV
      },
      topPosts,
      contentOverview: {
        categories: categoriesCount,
        columns: columnsCount,
        bookmarks: bookmarksCount
      },
      membershipDistribution
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Stats failed' });
  }
}

exports.listBackups = async (req, res) => {
  try {
    const backups = await listBackups()
    const dbType = getDatabaseType()
    res.json({ 
      backups, 
      databaseType: dbType,
      message: `当前使用 ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'} 数据库`
    })
  } catch (e) {
    console.error('列出备份失败:', e)
    res.status(500).json({ message: '获取备份列表失败' })
  }
}

exports.backupDatabase = async (req, res) => {
  try {
    const file = await backupOnce()
    const dbType = getDatabaseType()
    res.json({ 
      file, 
      databaseType: dbType,
      message: `${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'} 备份成功`
    })
  } catch (e) {
    console.error('备份失败:', e)
    res.status(500).json({ message: '备份失败: ' + e.message })
  }
}

// listBackups defined above

exports.restoreDatabase = async (req, res) => {
  try {
    const { file } = req.body
    if (!file) return res.status(400).json({ message: 'file required' })
    
    // 验证文件名格式
    if (!/^[A-Za-z0-9._-]+\.(db|sql|json)$/.test(file)) {
      return res.status(400).json({ message: 'invalid file format' })
    }
    
    const backupsDir = path.join(__dirname, '..', '..', 'backups')
    const source = path.join(backupsDir, file)
    const resolvedSource = path.resolve(source)
    const resolvedBackups = path.resolve(backupsDir)
    
    if (!resolvedSource.startsWith(resolvedBackups)) {
      return res.status(400).json({ message: 'invalid path' })
    }
    
    if (!fs.existsSync(source)) {
      return res.status(404).json({ message: '备份文件不存在' })
    }
    
    await restoreBackup(file)
    
    res.json({ 
      restored: file,
      message: '数据库恢复成功'
    })
  } catch (e) {
    console.error('恢复失败:', e)
    res.status(500).json({ message: '恢复失败: ' + e.message })
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

// 系统健康监控
exports.getSystemHealth = async (req, res) => {
  try {
    const startTime = Date.now()
    
    // 数据库连接检查
    let dbStatus = { connected: false, latency: 0, type: getDatabaseType() }
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbStatus.connected = true
      dbStatus.latency = Date.now() - dbStart
    } catch (e) {
      dbStatus.error = e.message
    }

    // 获取数据库统计
    const [usersCount, postsCount, commentsCount, visitsCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.visitLog.count()
    ])

    // 备份状态
    const backups = await listBackups()
    const latestBackup = backups.length > 0 ? backups[0] : null
    const backupStatus = {
      total: backups.length,
      latest: latestBackup ? {
        file: latestBackup.file,
        size: latestBackup.size,
        createdAt: latestBackup.createdAt
      } : null
    }

    // 服务器信息
    const serverInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    }

    // 格式化内存
    const formatBytes = (bytes) => {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const memoryFormatted = {
      heapUsed: formatBytes(serverInfo.memoryUsage.heapUsed),
      heapTotal: formatBytes(serverInfo.memoryUsage.heapTotal),
      rss: formatBytes(serverInfo.memoryUsage.rss),
      external: formatBytes(serverInfo.memoryUsage.external)
    }

    // 格式化运行时间
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      const parts = []
      if (days > 0) parts.push(`${days}天`)
      if (hours > 0) parts.push(`${hours}小时`)
      if (mins > 0) parts.push(`${mins}分钟`)
      if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)
      return parts.join(' ')
    }

    res.json({
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      database: dbStatus,
      counts: {
        users: usersCount,
        posts: postsCount,
        comments: commentsCount,
        visits: visitsCount
      },
      backup: backupStatus,
      server: {
        ...serverInfo,
        uptimeFormatted: formatUptime(serverInfo.uptime),
        memory: memoryFormatted
      }
    })
  } catch (e) {
    console.error('Health check failed:', e)
    res.status(500).json({ 
      status: 'error', 
      message: '健康检查失败',
      error: e.message 
    })
  }
}

// 导出操作日志
exports.exportLogs = async (req, res) => {
  try {
    const { model, action, startDate, endDate, format = 'json' } = req.query
    
    const where = {}
    if (model) where.model = model
    if (action) where.action = action
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const logs = await prisma.operationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000 // 限制最大导出数量
    })

    if (format === 'csv') {
      // CSV格式导出
      const headers = ['ID', '时间', '模型', '操作', '目标ID', '用户ID', 'IP']
      const rows = logs.map(log => [
        log.id,
        new Date(log.createdAt).toISOString(),
        log.model,
        log.action,
        log.targetId || '',
        log.userId || '',
        log.ip || ''
      ])
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=logs_${Date.now()}.csv`)
      res.send('\ufeff' + csv) // BOM for Excel
    } else {
      // JSON格式导出
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename=logs_${Date.now()}.json`)
      res.json(logs)
    }
  } catch (e) {
    console.error('Export logs failed:', e)
    res.status(500).json({ message: '导出日志失败' })
  }
}

