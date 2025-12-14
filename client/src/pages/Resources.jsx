import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Download, ExternalLink, Github, Star, BookOpen, Wrench, Code, Palette, Link as LinkIcon, Folder } from 'lucide-react';
import { resourcesApi } from '../lib/api';
import Loading from '../components/Loading';

const getTypeIcon = (type) => {
    switch (type) {
        case 'github':
            return Github;
        case 'download':
            return Download;
        case 'docs':
            return BookOpen;
        default:
            return ExternalLink;
    }
};

const getCategoryIcon = (category) => {
    if (category.includes('工具')) return Wrench;
    if (category.includes('学习')) return BookOpen;
    if (category.includes('设计')) return Palette;
    if (category.includes('代码') || category.includes('开源')) return Code;
    return Folder;
}

export const Resources = () => {
    const [groupedResources, setGroupedResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await resourcesApi.getAll();
                const data = res.data;

                // Group by category
                const groups = data.reduce((acc, item) => {
                    const category = item.category || 'Other';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(item);
                    return acc;
                }, {});

                const groupedList = Object.keys(groups).map((category, index) => ({
                    id: index,
                    category,
                    icon: getCategoryIcon(category),
                    items: groups[category]
                }));

                setGroupedResources(groupedList);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    if (loading) return <Loading />;


    return (
        <div className="space-y-12">
            {/* Page Header */}
            <section className="text-center space-y-4 pt-8">
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Package size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">精选资源</span>
                </motion.div>

                <motion.h1
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    开发<span className="text-primary">资源</span>
                </motion.h1>

                <motion.p
                    className="text-muted-foreground max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    收集整理的优质开发资源，助力你的学习与开发之旅
                </motion.p>
            </section>

            {/* Resources Categories */}
            <section className="max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4 space-y-12">
                {groupedResources.map((category, categoryIndex) => {
                    const CategoryIcon = category.icon;

                    return (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: categoryIndex * 0.1 }}
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <CategoryIcon size={20} className="text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">{category.category}</h2>
                            </div>

                            {/* Resource Cards */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
                                {category.items.map((item, itemIndex) => {
                                    const TypeIcon = getTypeIcon(item.type);

                                    return (
                                        <motion.a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: categoryIndex * 0.1 + itemIndex * 0.05 }}
                                            className="group relative p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        {item.icon && <img src={item.icon} className="w-4 h-4 object-contain" alt="" />}
                                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    <TypeIcon size={16} />
                                                </div>
                                            </div>
                                        </motion.a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* Footer Note */}
            <motion.section
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <p className="text-muted-foreground text-sm">
                    持续更新中，发现更多优质资源 🚀
                </p>
            </motion.section>
        </div>
    );
};

export default Resources;