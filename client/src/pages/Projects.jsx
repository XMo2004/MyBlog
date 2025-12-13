import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Github, ExternalLink, Star, GitFork, Code, Layers } from 'lucide-react';
import { projectsApi } from '../lib/api';

export const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectsApi.getAll();
                const data = res.data.map(p => ({
                    ...p,
                    tech: typeof p.tech === 'string' ? JSON.parse(p.tech) : p.tech
                }));
                // Filter active or featured if needed, or show all sorted by order
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
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
                    <Rocket size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">个人作品</span>
                </motion.div>

                <motion.h1
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    我的<span className="text-primary">项目</span>
                </motion.h1>

                <motion.p
                    className="text-muted-foreground max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    这里展示了我的个人项目和开源贡献，欢迎探索
                </motion.p>
            </section>

            {/* Projects Grid */}
            <section className="max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4">
                <div className="grid md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
                    {projects.map((project, index) => (
                        <motion.article
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group relative ${project.featured ? 'md:col-span-2' : ''}`}
                        >
                            <div className="relative h-full p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-linear-to-br ${project.color || 'from-primary/20 to-secondary/20'} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                {/* Decorative */}
                                <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full bg-linear-to-br ${project.color || 'from-primary/20 to-secondary/20'} opacity-5`} />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl bg-linear-to-br ${project.color || 'from-primary to-secondary'} text-white shadow-lg`}>
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                                    {project.name}
                                                </h3>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${project.status === 'Active'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                        </div>

                                        {project.featured && (
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                <Star size={14} />
                                                精选
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        {project.description}
                                    </p>

                                    {/* Tech Stack */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {Array.isArray(project.tech) && project.tech.map((tech) => (
                                            <span
                                                key={tech}
                                                className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Star size={14} />
                                                {project.stars}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GitFork size={14} />
                                                {project.forks}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {project.github && (
                                                <a
                                                    href={project.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                                                >
                                                    <Github size={18} />
                                                </a>
                                            )}
                                            {project.demo && (
                                                <a
                                                    href={project.demo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* Footer Note */}
            <motion.section
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-muted-foreground text-sm">
                    更多项目正在进行中，敬请期待 🎯
                </p>
            </motion.section>
        </div>
    );
};

