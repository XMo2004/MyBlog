FROM node:20-alpine

WORKDIR /app

# 安装 PostgreSQL 客户端工具 (用于 pg_dump 备份)
RUN apk add --no-cache postgresql-client

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY . .

# 创建备份目录
RUN mkdir -p /app/backups

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
