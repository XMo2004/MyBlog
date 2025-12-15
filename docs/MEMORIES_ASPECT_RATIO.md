# 回忆画廊 - 图片尺寸配置说明

## 概述
回忆画廊支持通过后端 `aspectRatio` 字段动态控制图片显示尺寸，实现灵活的布局效果。

## 配置方式

### 数据库字段
在 `Memory` 模型中，`aspectRatio` 字段存储 Tailwind CSS 的 aspect ratio 类名：

```prisma
model Memory {
  // ... 其他字段
  aspectRatio String @default("aspect-[3/4]") // 宽高比类名
  // ... 其他字段
}
```

### 可用的宽高比选项

#### 常用预设比例
```javascript
"aspect-square"      // 1:1 (正方形)
"aspect-video"       // 16:9 (视频格式)
"aspect-[4/3]"       // 4:3 (传统照片)
"aspect-[3/4]"       // 3:4 (竖版照片，默认)
"aspect-[2/3]"       // 2:3 (竖版长图)
"aspect-[3/2]"       // 3:2 (横版照片)
"aspect-[16/9]"      // 16:9 (宽屏)
"aspect-[9/16]"      // 9:16 (手机竖屏)
"aspect-[21/9]"      // 21:9 (超宽屏)
```

#### 自定义比例
你可以使用任何自定义比例，格式为 `aspect-[宽/高]`：
```javascript
"aspect-[5/4]"       // 5:4
"aspect-[7/5]"       // 7:5
"aspect-[1/2]"       // 1:2 (极窄竖版)
```

## API 使用示例

### 创建回忆时指定尺寸
```bash
POST /api/memories
Content-Type: application/json

{
  "title": "美丽的风景",
  "date": "2025-12-15",
  "image": "https://example.com/image.jpg",
  "location": "杭州西湖",
  "description": "冬日的西湖格外宁静",
  "aspectRatio": "aspect-[16/9]",  // 设置为 16:9 宽屏
  "published": true
}
```

### 更新回忆尺寸
```bash
PUT /api/memories/1
Content-Type: application/json

{
  "aspectRatio": "aspect-square"  // 更改为正方形
}
```

## 建议配置

### 根据图片类型选择比例

| 图片类型 | 推荐比例 | aspectRatio 值 |
|---------|---------|---------------|
| 风景照片 | 16:9 | `aspect-[16/9]` |
| 人像照片 | 3:4 | `aspect-[3/4]` (默认) |
| 正方形照片 | 1:1 | `aspect-square` |
| 全身照 | 2:3 | `aspect-[2/3]` |
| 超宽风景 | 21:9 | `aspect-[21/9]` |
| 手机竖屏 | 9:16 | `aspect-[9/16]` |

### 瀑布流布局建议
- **混合使用**不同比例可以创造更有趣的瀑布流效果
- **避免**所有图片使用相同比例，会显得单调
- **建议**70% 使用默认 3:4，30% 使用其他比例

## 响应式适配

前端会根据屏幕尺寸自动调整列数：
- 移动端：2列
- 平板：3-4列
- 桌面：4-5列
- 宽屏：6列

图片会按照设置的 `aspectRatio` 在瀑布流中显示，自动适配容器宽度。

## 注意事项

1. **图片质量**：建议上传至少 800px 宽度的图片以保证清晰度
2. **加载性能**：使用 CDN 存储图片可提升加载速度
3. **默认值**：如果不指定 `aspectRatio`，默认使用 `aspect-[3/4]`
4. **Tailwind 配置**：确保项目中已配置 Tailwind CSS 的 aspect ratio 插件

## 前端实现

图片容器会自动应用指定的 aspectRatio 类：
```jsx
<img
  className={`w-full h-full object-cover ${memory.aspectRatio || 'aspect-[3/4]'}`}
  src={memory.image}
  alt={memory.title}
/>
```

这样可以确保：
- ✅ 图片始终填充容器
- ✅ 保持指定的宽高比
- ✅ 不会变形或裁切不当
- ✅ 懒加载优化性能
