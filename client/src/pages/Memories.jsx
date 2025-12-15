import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, MapPin, Image as ImageIcon, Loader2 } from 'lucide-react';
import { memoriesApi } from '../lib/api';

// 将图片URL转换为完整URL
const getImageUrl = (image, useThumbnail = false) => {
  if (!image) return '';
  // 如果已经是完整URL，直接返回
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  // 如果是相对路径，添加API基础URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  // 移除baseUrl末尾的/api，因为image已经包含/api
  const apiBase = baseUrl.replace(/\/api$/, '');
  
  // 如果请求缩略图且是本地存储的图片，使用缩略图端点
  if (useThumbnail && image.includes('/api/memories/') && image.endsWith('/image')) {
    const thumbnailPath = image.replace('/image', '/thumb');
    return `${apiBase}${thumbnailPath}`;
  }
  
  return `${apiBase}${image}`;
};

const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [visibleItems, setVisibleItems] = useState(new Set());

  // 获取回忆数据
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setError(null);
        const res = await memoriesApi.getAll();
        setMemories(res.data || []);
      } catch (err) {
        console.error('Failed to fetch memories:', err);
        setError('加载回忆失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, []);

  // 图片加载处理
  const handleImageLoad = useCallback((id) => {
    setLoadedImages(prev => new Set(prev).add(id));
  }, []);

  const handleImageError = useCallback((id) => {
    setFailedImages(prev => new Set(prev).add(id));
  }, []);

  // 使用 IntersectionObserver 实现懒加载动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.id;
            if (id) {
              setVisibleItems(prev => new Set(prev).add(id));
            }
          }
        });
      },
      { 
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    // 延迟观察，确保 DOM 已渲染
    const timer = setTimeout(() => {
      document.querySelectorAll('[data-memory-card]').forEach(el => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [memories]);

  // 选中的回忆
  const selectedMemory = useMemo(() => 
    memories.find(m => m.id === selectedId),
    [memories, selectedId]
  );

  // 锁定背景滚动
  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedId]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedId) {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // 打开详情
  const openDetail = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 关闭详情
  const closeDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  // 获取动画样式
  const getCardStyle = (id, index) => {
    const isVisible = visibleItems.has(String(id));
    const delay = Math.min(index * 0.05, 0.3);
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 - 扁平化设计 */}
      <header className="bg-background sticky top-16 z-10 border-b border-border/50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                回忆画廊
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">
                珍藏每一个动人的瞬间
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{memories.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 - 宽屏适配 */}
      <main className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-12 py-6 sm:py-8 lg:py-10">
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">加载回忆中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !error && memories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg text-foreground font-medium">还没有回忆</p>
              <p className="text-sm text-muted-foreground mt-1">美好的回忆正在路上</p>
            </div>
          </div>
        )}

        {/* 瀑布流网格 - 宽屏适配 */}
        {!isLoading && !error && memories.length > 0 && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2.5 sm:gap-3 lg:gap-4">
            {memories.map((memory, index) => (
              <article
                key={memory.id}
                data-memory-card
                data-id={memory.id}
                style={getCardStyle(memory.id, index)}
                onClick={() => openDetail(memory.id)}
                className="break-inside-avoid mb-2.5 sm:mb-3 lg:mb-4 cursor-pointer group relative rounded-lg overflow-hidden bg-card transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative w-full overflow-hidden">
                  {/* 加载骨架 */}
                  {!loadedImages.has(memory.id) && !failedImages.has(memory.id) && (
                    <div className={`bg-muted animate-pulse flex items-center justify-center ${memory.aspectRatio || 'aspect-[3/4]'}`}>
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* 加载失败占位 */}
                  {failedImages.has(memory.id) && (
                    <div className={`bg-muted flex items-center justify-center ${memory.aspectRatio || 'aspect-[3/4]'}`}>
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-xs text-muted-foreground mt-2">图片加载失败</p>
                      </div>
                    </div>
                  )}

                  <img
                    src={getImageUrl(memory.image, true)}
                    alt={memory.title}
                    loading="lazy"
                    onLoad={() => handleImageLoad(memory.id)}
                    onError={() => handleImageError(memory.id)}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
                      loadedImages.has(memory.id) ? 'opacity-100' : 'opacity-0'
                    } ${memory.aspectRatio || 'aspect-[3/4]'}`}
                  />
                  
                  {/* 悬浮遮罩 - 底部渐变 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* 悬浮内容 - 左下角精简显示 */}
                  <div className="absolute left-0 right-0 bottom-0 p-2.5 sm:p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-1 drop-shadow-md">
                      {memory.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/75 text-[10px] sm:text-xs mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(memory.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      {memory.location && (
                        <>
                          <span className="text-white/40">·</span>
                          <span className="flex items-center gap-0.5 line-clamp-1">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            {memory.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selectedId && selectedMemory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-title"
        >
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm memory-fade-in"
            onClick={closeDetail}
          />
          
          {/* 关闭按钮 */}
          <button
            onClick={closeDetail}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 弹窗内容 - 扁平化设计 */}
          <div
            className="relative z-20 w-full max-w-6xl max-h-[92vh] flex flex-col lg:flex-row bg-card rounded-xl overflow-hidden memory-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 图片区域 */}
            <div className="w-full lg:w-[68%] h-[45vh] sm:h-[55vh] lg:h-[80vh] relative bg-black/95 flex items-center justify-center">
              <img
                src={getImageUrl(selectedMemory.image)}
                alt={selectedMemory.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 信息区域 */}
            <div className="w-full lg:w-[32%] p-4 sm:p-5 lg:p-6 flex flex-col overflow-y-auto bg-card max-h-[40vh] lg:max-h-[80vh]">
              <h2 
                id="memory-title"
                className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-3 leading-tight"
              >
                {selectedMemory.title}
              </h2>
              
              <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedMemory.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {selectedMemory.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedMemory.location}</span>
                  </div>
                )}
              </div>

              {selectedMemory.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground/75 leading-relaxed text-sm">
                    {selectedMemory.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes memory-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes memory-scale-in {
          from { 
            opacity: 0;
            transform: scale(0.96);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .memory-fade-in {
          animation: memory-fade-in 0.2s ease-out forwards;
        }
        
        .memory-scale-in {
          animation: memory-scale-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Memories;
