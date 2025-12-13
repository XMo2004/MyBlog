import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { FolderOpen, Folder, ArrowRight, Code, BookOpen, Lightbulb, Wrench, Rocket, Layers } from 'lucide-react';
import { categoriesApi } from '../lib/api';

// Predefined categories with icons and colors
const categoryConfig = {
    '技术': { icon: Code, color: 'from-blue-500 to-cyan-500' },
    '教程': { icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    '思考': { icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
    '工具': { icon: Wrench, color: 'from-violet-500 to-purple-500' },
    '项目': { icon: Rocket, color: 'from-pink-500 to-rose-500' },
    '其他': { icon: Layers, color: 'from-gray-500 to-slate-500' },
};

const defaultConfig = { icon: Folder, color: 'from-indigo-500 to-blue-500' };

export const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoriesApi.getPublic();
                const cats = res.data.map(c => ({
                    id: c.id,
                    name: c.name,
                    postCount: c._count?.posts || 0,
                }));
                setCategories(cats);
            } catch (err) {
                console.error('Failed to fetch categories', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const getCategoryConfig = (name) => categoryConfig[name] || defaultConfig;

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <section className="text-center space-y-4 pt-8">
                <Motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FolderOpen size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">文章分类</span>
                </Motion.div>

                <Motion.h1
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    浏览<span className="text-primary">分类</span>
                </Motion.h1>

                <Motion.p
                    className="text-muted-foreground max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    按主题分类浏览文章，找到你感兴趣的技术领域
                </Motion.p>
            </section>

            {/* Categories Grid */}
            <section className="max-w-4xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <Motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Folder size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">暂无分类</p>
                        <p className="text-sm text-muted-foreground/60">分类将在文章创建时自动生成</p>
                    </Motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
                        {categories.map((category, index) => {
                            const config = getCategoryConfig(category.name);
                            const Icon = config.icon;

                            return (
                                <Motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                >
                                    <Link
                                        to={`/?category=${category.name}`}
                                        className="group relative block p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden h-full"
                                    >
                                        {/* Gradient Background */}
                                        <div className={`absolute inset-0 bg-linear-to-br ${config.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                        {/* Decorative Circle */}
                                        <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-linear-to-br ${config.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${config.color} text-white shadow-lg mb-4`}>
                                                <Icon size={24} />
                                            </div>

                                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                                                {category.name}
                                            </h3>

                                            <p className="text-sm text-muted-foreground">
                                                {category.postCount} 篇文章
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="absolute bottom-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                </Motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
