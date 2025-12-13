import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Columns as ColumnsIcon, BookOpen, ArrowRight, Star, Clock, TrendingUp, Code, Folder, Lightbulb, Wrench, Rocket, Layers } from 'lucide-react';
import { columnsApi } from '../lib/api';

export const Columns = () => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    const gradient = (color) => {
        switch (color) {
            case 'blue': return 'from-blue-500 to-cyan-500';
            case 'green': return 'from-emerald-500 to-teal-500';
            case 'purple': return 'from-violet-500 to-purple-500';
            case 'orange': return 'from-amber-500 to-orange-500';
            case 'red': return 'from-pink-500 to-rose-500';
            default: return 'from-primary to-secondary';
        }
    };

    const gradientLight = (color) => {
        switch (color) {
            case 'blue': return 'from-blue-500/10 to-cyan-500/10';
            case 'green': return 'from-emerald-500/10 to-teal-500/10';
            case 'purple': return 'from-violet-500/10 to-purple-500/10';
            case 'orange': return 'from-amber-500/10 to-orange-500/10';
            case 'red': return 'from-pink-500/10 to-rose-500/10';
            default: return 'from-primary/10 to-secondary/10';
        }
    };

    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const res = await columnsApi.getAll();
                setColumns(res.data);
            } catch (error) {
                console.error('Failed to fetch columns', error);
            } finally {
                setLoading(false);
            }
        };
        fetchColumns();
    }, []);

    if (loading) return <div className="text-center py-20">加载中...</div>;

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <section className="text-center space-y-4 pt-8">
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <ColumnsIcon size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">系统化学习</span>
                </motion.div>

                <motion.h1
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    精选<span className="text-primary">专栏</span>
                </motion.h1>

                <motion.p
                    className="text-muted-foreground max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    深度专栏系列，帮助你系统性地学习技术知识
                </motion.p>
            </section>

            {/* Columns List */}
            <section className="max-w-4xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4 space-y-6 2xl:space-y-0 2xl:grid 2xl:grid-cols-2 2xl:gap-6 3xl:grid-cols-3">
                {columns.map((column, index) => (
                    <motion.article
                        key={column.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <Link to={`/columns/${column.id}`} className="block">
                            <div className="relative p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">

                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-linear-to-br ${gradientLight(column.color)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                            {/* Decorative */}
                            <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full bg-linear-to-br ${gradientLight(column.color)} opacity-5`} />

                            <div className="relative z-10 flex flex-col md:flex-row gap-6">
                                {/* Icon */}
                                <div className={`shrink-0 w-16 h-16 rounded-2xl bg-linear-to-br ${gradient(column.color)} flex items-center justify-center text-white shadow-lg`}>
                                    {(() => {
                                        const val = column.icon;
                                        if (typeof val === 'string') {
                                            const s = val.trim();
                                            if (s.startsWith('<svg')) {
                                                const svg = s.includes('xmlns=') ? s : s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                                                return <span dangerouslySetInnerHTML={{ __html: svg }} />;
                                            }
                                        }
                                        const icons = { BookOpen, Code, Folder, Lightbulb, Wrench, Rocket, Layers };
                                        const IconComp = icons[val] || BookOpen;
                                        return <IconComp size={28} />;
                                    })()}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">
                                            {column.title}
                                        </h3>
                                        {column.featured && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                                                <Star size={12} />
                                                推荐
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${column.status === 'Active'
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {column.status}
                                        </span>
                                    </div>

                                    <p className="text-muted-foreground leading-relaxed">
                                        {column.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp size={14} />
                                            {column.postCount} 篇文章
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {column.readTime}
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="shrink-0 self-center">
                                    <div className="p-3 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        </Link>
                    </motion.article>
                ))}

            </section>

            {/* Coming Soon Notice */}
            <motion.section
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-muted-foreground text-sm">
                    更多精彩专栏正在筹备中，敬请期待 ✨
                </p>
            </motion.section>
        </div>
    );
};
