const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('开始填充数据库数据...');

    // 1. 填充网站设置
    console.log('正在填充网站设置...');
    const settings = [
        { key: 'siteTitle', value: '我的数字花园' },
        { key: 'siteSubtitle', value: '记录学习与生活' },
        { key: 'heroTitle', value: '构建未来' },
        { key: 'heroSubtitle', value: '分享关于软件工程、设计模式和产品构建之旅的思考。' },
        { key: 'signature', value: '代码即诗歌 | 探索技术边界' },
    ];

    for (const setting of settings) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: { key: setting.key, value: setting.value },
        });
    }

    // 2. 填充个人信息
    console.log('正在填充个人信息...');
    const profileData = {
        name: 'Admin User',
        title: '全栈开发者',
        location: 'Shanghai, China',
        bio: '热爱技术，喜欢探索新事物。',
        email: 'admin@example.com',
        github: 'https://github.com',
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        skills: JSON.stringify([
            { name: 'JavaScript', level: 90 },
            { name: 'React', level: 85 },
            { name: 'Node.js', level: 80 },
            { name: 'Python', level: 75 },
        ]),
        interests: JSON.stringify(['编程', '阅读', '徒步', '摄影']),
        experience: JSON.stringify([
            {
                title: '高级前端工程师',
                company: 'Tech Corp',
                period: '2020 - 至今',
                description: '负责核心产品的前端架构设计与开发。',
            },
            {
                title: '全栈工程师',
                company: 'Startup Inc',
                period: '2018 - 2020',
                description: '参与从0到1的产品开发，负责后端API和前端界面。',
            },
        ]),
        education: JSON.stringify([
            {
                degree: '计算机科学学士',
                school: '某知名大学',
                period: '2014 - 2018',
            },
        ]),
    };

    const existingProfile = await prisma.profile.findFirst();
    if (existingProfile) {
        await prisma.profile.update({
            where: { id: existingProfile.id },
            data: profileData,
        });
    } else {
        await prisma.profile.create({
            data: profileData,
        });
    }

    // 3. 填充示例文章
    console.log('正在填充示例文章...');
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
        // 创建标签
        const tag1 = await prisma.tag.upsert({
            where: { name: 'React' },
            update: {},
            create: { name: 'React' },
        });
        const tag2 = await prisma.tag.upsert({
            where: { name: 'Node.js' },
            update: {},
            create: { name: 'Node.js' },
        });

        const cat1 = await prisma.category.upsert({
            where: { name: '技术' },
            update: {},
            create: { name: '技术', level: 1 },
        });
        const cat2 = await prisma.category.upsert({
            where: { name: '教程' },
            update: {},
            create: { name: '教程', parentId: cat1.id, level: 2 },
        });

        const post = await prisma.post.upsert({
            where: { id: 1 },
            update: {
                tags: {
                    connect: [{ id: tag1.id }, { id: tag2.id }],
                },
                categoryId: cat2.id
            },
            create: {
                title: '欢迎来到我的博客',
                content: '这是第一篇示例文章。你可以在后台管理界面编辑或删除它。\n\n## Markdown 支持\n\n- 列表项 1\n- 列表项 2\n\n```javascript\nconsole.log("Hello World");\n```',
                published: true,
                authorId: adminUser.id,
                tags: {
                    connect: [{ id: tag1.id }, { id: tag2.id }],
                },
                categoryId: cat2.id
            },
        });
    } else {
        console.warn('警告: 未找到管理员用户，跳过文章创建。请先运行 create-admin.js');
    }

    // 4. 填充项目
    console.log('正在填充示例项目...');
    const projects = [
        {
            name: 'Blog System',
            description: '基于 React 和 Node.js 的个人博客系统',
            tech: JSON.stringify(['React', 'Node.js', 'Prisma', 'SQLite']),
            github: 'https://github.com/example/blog',
            status: 'Active',
            color: 'blue',
            featured: true,
        },
        {
            name: 'Task Manager',
            description: '高效的任务管理工具',
            tech: JSON.stringify(['Vue', 'Firebase']),
            github: 'https://github.com/example/task-manager',
            status: 'Completed',
            color: 'green',
            featured: false,
        },
    ];

    for (const project of projects) {
        // 简单查重
        const existing = await prisma.project.findFirst({ where: { name: project.name } });
        if (!existing) {
            await prisma.project.create({ data: project });
        }
    }

    // 5. 填充资源
    console.log('正在填充示例资源...');
    const resources = [
        {
            name: 'React 文档',
            description: 'React 官方文档',
            url: 'https://react.dev',
            type: 'docs',
            category: 'Frontend',
        },
        {
            name: 'MDN Web Docs',
            description: 'Web 开发权威指南',
            url: 'https://developer.mozilla.org',
            type: 'docs',
            category: 'General',
        },
    ];

    for (const resource of resources) {
         const existing = await prisma.resource.findFirst({ where: { name: resource.name } });
         if (!existing) {
             await prisma.resource.create({ data: resource });
         }
    }

    console.log('✅ 数据库填充完成！');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
