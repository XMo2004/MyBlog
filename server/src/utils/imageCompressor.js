/**
 * 企业级图片压缩工具
 * 使用 sharp 进行高效图片压缩，支持 WebP 输出
 */

const sharp = require('sharp');

// 压缩配置
const COMPRESSION_CONFIG = {
  // 最大尺寸限制
  maxWidth: 1920,
  maxHeight: 1920,
  
  // WebP 压缩质量 (0-100)
  quality: 80,
  
  // 缩略图配置
  thumbnail: {
    width: 400,
    height: 400,
    quality: 70,
  },
  
  // 是否生成缩略图
  generateThumbnail: true,
};

/**
 * 压缩图片
 * @param {Buffer} inputBuffer - 原始图片 buffer
 * @param {Object} options - 压缩选项
 * @returns {Promise<{data: Buffer, mimeType: string, thumbnail?: Buffer, originalSize: number, compressedSize: number, ratio: string}>}
 */
async function compressImage(inputBuffer, options = {}) {
  const config = { ...COMPRESSION_CONFIG, ...options };
  const originalSize = inputBuffer.length;

  try {
    // 获取图片元信息
    const metadata = await sharp(inputBuffer).metadata();
    
    // 计算是否需要缩放
    let resizeOptions = null;
    if (metadata.width > config.maxWidth || metadata.height > config.maxHeight) {
      resizeOptions = {
        width: config.maxWidth,
        height: config.maxHeight,
        fit: 'inside', // 保持宽高比，不超过指定尺寸
        withoutEnlargement: true, // 不放大小图
      };
    }

    // 压缩主图
    let pipeline = sharp(inputBuffer)
      .rotate() // 自动根据 EXIF 旋转
      .removeAlpha(); // 移除透明通道（WebP 不需要时）

    if (resizeOptions) {
      pipeline = pipeline.resize(resizeOptions);
    }

    // 转换为 WebP 格式（压缩率最高）
    const compressedBuffer = await pipeline
      .webp({
        quality: config.quality,
        effort: 4, // 压缩努力程度 0-6，4 是平衡点
        smartSubsample: true, // 智能色度采样
      })
      .toBuffer();

    const result = {
      data: compressedBuffer,
      mimeType: 'image/webp',
      originalSize,
      compressedSize: compressedBuffer.length,
      ratio: ((1 - compressedBuffer.length / originalSize) * 100).toFixed(1) + '%',
    };

    // 生成缩略图（用于列表预览，进一步减少带宽）
    if (config.generateThumbnail) {
      const thumbnailBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: config.thumbnail.width,
          height: config.thumbnail.height,
          fit: 'cover', // 裁剪填充
          position: 'center',
        })
        .webp({
          quality: config.thumbnail.quality,
          effort: 4,
        })
        .toBuffer();

      result.thumbnail = thumbnailBuffer;
      result.thumbnailSize = thumbnailBuffer.length;
    }

    return result;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('图片压缩失败: ' + error.message);
  }
}

/**
 * 检查是否为支持的图片格式
 * @param {string} mimeType 
 * @returns {boolean}
 */
function isSupportedFormat(mimeType) {
  const supported = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/tiff',
  ];
  return supported.includes(mimeType);
}

/**
 * 获取压缩统计信息
 * @param {number} originalSize 
 * @param {number} compressedSize 
 * @returns {Object}
 */
function getCompressionStats(originalSize, compressedSize) {
  const savedBytes = originalSize - compressedSize;
  const ratio = ((savedBytes / originalSize) * 100).toFixed(1);
  
  return {
    originalSize: formatBytes(originalSize),
    compressedSize: formatBytes(compressedSize),
    savedBytes: formatBytes(savedBytes),
    compressionRatio: ratio + '%',
  };
}

/**
 * 格式化字节数
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  compressImage,
  isSupportedFormat,
  getCompressionStats,
  formatBytes,
  COMPRESSION_CONFIG,
};
