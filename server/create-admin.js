const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // 获取命令行参数，或者使用默认值
    const usernameArg = process.argv[2];
    const username = usernameArg && usernameArg.trim() ? usernameArg.trim() : 'xmo2004';
    const password = process.argv[3] || 'admin123';

    console.log(`正在创建/更新管理员用户: ${username}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 使用 upsert: 如果用户不存在则创建，如果存在则更新密码和角色
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                password: hashedPassword,
                role: 'admin',
            },
            create: {
                username,
                password: hashedPassword,
                role: 'admin',
            },
        });

        console.log(`✅ 管理员账号 '${user.username}' 设置成功！`);
        console.log(`🔑 密码: ${password}`);
    } catch (error) {
        console.error('❌ 创建管理员失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
