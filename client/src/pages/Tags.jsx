import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Tag, Hash, ArrowRight } from 'lucide-react';
import { tagsApi } from '../lib/api';

export const Tags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await tagsApi.getPublic();
                setTags(res.data);
            } catch (err) {
                console.error('Failed to fetch tags', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTags();
    }, []);

    // Color palette for tags
    const tagColors = [
        'from-violet-500 to-purple-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-pink-500 to-rose-500',
        'from-indigo-500 to-blue-500',
        'from-green-500 to-emerald-500',
        'from-red-500 to-orange-500',
    ];

    const getTagColor = (index) => tagColors[index % tagColors.length];

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <section className="text-center space-y-4 pt-8">
                <Motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Tag size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">标签云</span>
                </Motion.div>

                <Motion.h1
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    探索<span className="text-primary">标签</span>
                </Motion.h1>

                <Motion.p
                    className="text-muted-foreground max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    通过标签发现感兴趣的内容，快速浏览不同主题的文章
                </Motion.p>
            </section>

            {/* Tags Grid */}
            <section className="max-w-4xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : tags.length === 0 ? (
                    <Motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Hash size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">暂无标签</p>
                        <p className="text-sm text-muted-foreground/60">标签将在文章创建时自动生成</p>
                    </Motion.div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                        {tags.map((tag, index) => (
                            <Motion.div
                                key={tag.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/?tag=${tag.name}`}
                                    className="group relative block p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                                >
                                    {/* Gradient Background */}
                                    <div className={`absolute inset-0 bg-linear-to-br ${getTagColor(index)} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`p-2 rounded-lg bg-linear-to-br ${getTagColor(index)} text-white`}>
                                                <Hash size={16} />
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {tag.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {tag._count?.posts || tag.posts?.length || 0} 篇文章
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight
                                        size={16}
                                        className="absolute bottom-4 right-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300"
                                    />
                                </Link>
                            </Motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
