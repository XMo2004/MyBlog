// Memory Controller - 回忆/相册管理
const { compressImage, isSupportedFormat, getCompressionStats } = require('../utils/imageCompressor');

// Helper to exclude imageData excluding
const memorySelect = {
  id: true,
  title: true,
  date: true,
  location: true,
  image: true,
  description: true,
  aspectRatio: true,
  order: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  // imageData, thumbnailData and mimeType excluded for performance
};

// 获取所有回忆（公开）
const getMemories = async (req, res) => {
  try {
    const memories = await global.prisma.memory.findMany({
      where: { published: true },
      orderBy: [
        { order: 'asc' },
        { date: 'desc' },
      ],
      select: memorySelect,
    });
    res.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ message: 'Failed to fetch memories' });
  }
};

// 获取所有回忆（管理后台，包括未发布的）
const getAllMemories = async (req, res) => {
  try {
    const memories = await global.prisma.memory.findMany({
      orderBy: [
        { order: 'asc' },
        { date: 'desc' },
      ],
      select: memorySelect,
    });
    res.json(memories);
  } catch (error) {
    console.error('Error fetching all memories:', error);
    res.status(500).json({ message: 'Failed to fetch memories' });
  }
};

// 获取单个回忆
const getMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await global.prisma.memory.findUnique({
      where: { id: parseInt(id, 10) },
      select: memorySelect,
    });

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    res.json(memory);
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ message: 'Failed to fetch memory' });
  }
};

// 获取回忆图片（原图）
const getMemoryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await global.prisma.memory.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        imageData: true,
        mimeType: true,
      },
    });

    if (!memory || !memory.imageData) {
      return res.status(404).send('Image not found');
    }

    // 设置缓存头，WebP 图片可以长期缓存
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', memory.mimeType || 'image/webp');
    res.send(memory.imageData);
  } catch (error) {
    console.error('Error fetching memory image:', error);
    res.status(500).send('Failed to fetch image');
  }
};

// 获取回忆缩略图（用于列表展示，更小更快）
const getMemoryThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await global.prisma.memory.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        thumbnailData: true,
        imageData: true,
        mimeType: true,
      },
    });

    if (!memory) {
      return res.status(404).send('Memory not found');
    }

    // 优先返回缩略图，没有则返回原图
    const imageBuffer = memory.thumbnailData || memory.imageData;
    if (!imageBuffer) {
      return res.status(404).send('Image not found');
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', memory.mimeType || 'image/webp');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching memory thumbnail:', error);
    res.status(500).send('Failed to fetch thumbnail');
  }
};

// 创建回忆
const createMemory = async (req, res) => {
  try {
    const { title, date, location, image, description, aspectRatio, order, published } = req.body;
    const imageFile = req.file;

    // Validations
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    if (!image && !imageFile) {
      return res.status(400).json({ message: 'Image (URL or File) is required' });
    }

    const dbData = {
      title,
      date: new Date(date),
      location: location || null,
      image: image || '', // Placeholder if file
      description: description || null,
      aspectRatio: aspectRatio || 'aspect-[3/4]',
      order: order ? parseInt(order) : 0, // form-data sends strings
      published: published === 'true' || published === true,
    };

    // 如果有上传文件，进行压缩处理
    if (imageFile) {
      if (!isSupportedFormat(imageFile.mimetype)) {
        return res.status(400).json({ message: '不支持的图片格式' });
      }

      console.log(`[Memory] 开始压缩图片，原始大小: ${(imageFile.buffer.length / 1024).toFixed(1)}KB`);
      
      const compressed = await compressImage(imageFile.buffer);
      
      const stats = getCompressionStats(compressed.originalSize, compressed.compressedSize);
      console.log(`[Memory] 压缩完成: ${stats.originalSize} → ${stats.compressedSize} (节省 ${stats.compressionRatio})`);

      dbData.imageData = compressed.data;
      dbData.thumbnailData = compressed.thumbnail || null;
      dbData.mimeType = compressed.mimeType;
    }

    const memory = await global.prisma.memory.create({
      data: dbData,
    });

    // If file uploaded, update image URL to local endpoint
    if (imageFile) {
      const imageUrl = `/api/memories/${memory.id}/image`;
      await global.prisma.memory.update({
        where: { id: memory.id },
        data: { image: imageUrl }
      });
      memory.image = imageUrl;
    }

    // Return memory without imageData
    const { imageData, thumbnailData, ...rest } = memory;
    res.status(201).json(rest);
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ message: 'Failed to create memory: ' + error.message });
  }
};

// 更新回忆
const updateMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, image, description, aspectRatio, order, published } = req.body;
    const imageFile = req.file;

    const existing = await global.prisma.memory.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (aspectRatio !== undefined) updateData.aspectRatio = aspectRatio;
    if (order !== undefined) updateData.order = parseInt(order);
    if (published !== undefined) updateData.published = published === 'true' || published === true;

    // 如果有新上传的文件，进行压缩处理
    if (imageFile) {
      if (!isSupportedFormat(imageFile.mimetype)) {
        return res.status(400).json({ message: '不支持的图片格式' });
      }

      console.log(`[Memory] 开始压缩更新图片，原始大小: ${(imageFile.buffer.length / 1024).toFixed(1)}KB`);
      
      const compressed = await compressImage(imageFile.buffer);
      
      const stats = getCompressionStats(compressed.originalSize, compressed.compressedSize);
      console.log(`[Memory] 压缩完成: ${stats.originalSize} → ${stats.compressedSize} (节省 ${stats.compressionRatio})`);

      updateData.imageData = compressed.data;
      updateData.thumbnailData = compressed.thumbnail || null;
      updateData.mimeType = compressed.mimeType;
      updateData.image = `/api/memories/${id}/image`;
    } else if (image !== undefined && image !== existing.image) {
      // Only update image URL if provided and different (and no file uploaded)
      updateData.image = image;
      // If switching to external URL, clear stored image data
      if (image && !image.includes('/api/memories/')) {
        updateData.imageData = null;
        updateData.thumbnailData = null;
        updateData.mimeType = null;
      }
    }

    const memory = await global.prisma.memory.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      select: memorySelect,
    });

    res.json(memory);
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ message: 'Failed to update memory: ' + error.message });
  }
};

// 删除回忆
const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await global.prisma.memory.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    await global.prisma.memory.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ message: 'Failed to delete memory' });
  }
};

// 批量删除回忆
const bulkDeleteMemories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs array is required' });
    }

    await global.prisma.memory.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id, 10)) } },
    });

    res.json({ message: `${ids.length} memories deleted successfully` });
  } catch (error) {
    console.error('Error bulk deleting memories:', error);
    res.status(500).json({ message: 'Failed to delete memories' });
  }
};

// 更新排序
const updateMemoryOrder = async (req, res) => {
  try {
    const { orders } = req.body; // [{id: 1, order: 0}, {id: 2, order: 1}, ...]

    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: 'Orders array is required' });
    }

    await global.prisma.$transaction(
      orders.map(({ id, order }) =>
        global.prisma.memory.update({
          where: { id: parseInt(id, 10) },
          data: { order },
        })
      )
    );

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating memory order:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

module.exports = {
  getMemories,
  getAllMemories,
  getMemory,
  getMemoryImage,
  getMemoryThumbnail,
  createMemory,
  updateMemory,
  deleteMemory,
  bulkDeleteMemories,
  updateMemoryOrder,
};
