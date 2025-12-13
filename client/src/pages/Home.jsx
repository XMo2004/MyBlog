
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import api, { settingsApi } from '../lib/api';
import ThreeBackground from '../components/ThreeBackground';

const TypewriterText = ({ texts, typingSpeed = 100, deleteSpeed = 50, pauseDuration = 2000 }) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!texts || texts.length === 0) return;
        const currentFullText = texts[currentTextIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < currentFullText.length) {
                    setDisplayText(currentFullText.slice(0, displayText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(displayText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                }
            }
        }, isDeleting ? deleteSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, currentTextIndex, texts, typingSpeed, deleteSpeed, pauseDuration]);

    return (
        <span className="inline-block min-h-[1.5em]">
            {displayText}
            <Motion.span
                className="inline-block w-0.5 h-5 bg-primary ml-1 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
            />
        </span>
    );
};

export const Home = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        signatures: [],
        heroTitle: '构建未来',
        heroSubtitle: '分享关于软件工程、设计模式和产品构建之旅的思考。',
        siteTitle: '我的数字花园'
    });
    const [searchParams, setSearchParams] = useSearchParams();
    const currentCategory = searchParams.get('category') || '';
    const currentTag = searchParams.get('tag') || '';
    const currentSearch = searchParams.get('search') || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsRes, settingsRes] = await Promise.all([
                    api.get('/posts', { 
                        params: { 
                            category: currentCategory || undefined, 
                            tag: currentTag || undefined,
                            search: currentSearch || undefined
                        } 
                    }),
                    settingsApi.get()
                ]);

                setPosts(postsRes.data);

                const s = settingsRes.data;
                setSettings({
                    signatures: s.signature ? s.signature.split('|').map(t => t.trim()) : [
                        "代码即诗歌，程序即远方 ✨",
                        "在0和1之间寻找无限可能 🚀"
                    ],
                    heroTitle: s.heroTitle || '构建未来',
                    heroSubtitle: s.heroSubtitle || '分享关于软件工程、设计模式和产品构建之旅的思考。',
                    siteTitle: s.siteTitle || '我的数字花园'
                });

            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentCategory, currentTag, currentSearch]);

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="relative text-center space-y-6 pt-16 pb-12 min-h-[45vh] flex flex-col justify-center items-center">
                <ThreeBackground />

                {/* Subtle Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none" />

                <Motion.div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm text-secondary-foreground mb-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Sparkles size={14} className="text-primary" />
                    <span>{settings.siteTitle}</span>
                </Motion.div>

                <Motion.h1
                    className="text-5xl md:text-7xl font-bold tracking-tight relative z-10 bg-clip-text text-transparent bg-[linear-gradient(to_right,hsl(var(--foreground))_20%,hsl(var(--primary))_50%,hsl(var(--foreground))_80%)] bg-size-[200%_auto] animate-shimmer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {settings.heroTitle}
                </Motion.h1>

                <Motion.div
                    className="flex items-center justifycenter text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <TypewriterText texts={settings.signatures} />
                </Motion.div>

                <Motion.p
                    className="text-lg text-muted-foreground max-w-xl mx-auto relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    {settings.heroSubtitle}
                </Motion.p>
            </section>

            {/* Post List */}
            <section className="w-full mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {currentCategory
                            ? `分类：${currentCategory}`
                            : currentTag
                                ? `标签：${currentTag}`
                                : currentSearch
                                    ? `搜索：${currentSearch}`
                                    : '最新文章'}
                    </h2>
                    <Link to="/posts" className="text-sm font-medium text-primary hover:underline">查看全部</Link>
                </div>
                {(currentCategory || currentTag || currentSearch) && (
                    <div className="mb-6">
                        <button
                            onClick={() => { 
                                searchParams.delete('category'); 
                                searchParams.delete('tag'); 
                                searchParams.delete('search');
                                setSearchParams(searchParams); 
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            清除筛选
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {posts.map((post, index) => (
                            <Motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-card hover:bg-muted/50 border border-border/50 rounded-xl flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 overflow-hidden"
                            >
                                <Link to={`/post/${post.id}`} className="flex flex-col h-full p-6">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                        {post.category && (
                                            <span 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSearchParams({ category: post.category.name });
                                                }}
                                                className="text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium hover:bg-primary/20 cursor-pointer transition-colors relative z-10"
                                            >
                                                {post.category.name}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-3 line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 grow">
                                        {post.summary || post.content.substring(0, 150).replace(/[#*`]/g, '') + '...'}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                                        <div className="flex gap-2 overflow-hidden flex-wrap h-6">
                                            {post.tags.slice(0, 3).map(tag => (
                                                <span 
                                                    key={tag.id} 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSearchParams({ tag: tag.name });
                                                    }}
                                                    className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md whitespace-nowrap hover:bg-secondary cursor-pointer transition-colors relative z-10"
                                                >
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        <ArrowRight size={16} className="text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                                    </div>
                                </Link>
                            </Motion.article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
