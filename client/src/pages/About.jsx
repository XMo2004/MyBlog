import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    User, MapPin, Briefcase, GraduationCap, Heart, Code, 
    Coffee, Mail, Github, Twitter, Linkedin, ExternalLink,
    Calendar, Download, Terminal
} from 'lucide-react';
import { profileApi } from '../lib/api';

export const About = () => {
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        title: '',
        location: '',
        bio: '',
        avatar: '',
        experience: [],
        education: [],
        skills: [],
        interests: [],
        social: {},
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await profileApi.get();
                let data = res.data;
                try {
                    if (typeof data.skills === 'string') data.skills = JSON.parse(data.skills);
                    if (typeof data.interests === 'string') data.interests = JSON.parse(data.interests);
                    if (typeof data.experience === 'string') data.experience = JSON.parse(data.experience);
                    if (typeof data.education === 'string') data.education = JSON.parse(data.education);
                } catch (e) {
                    console.error("Error parsing JSON fields", e);
                }

                data.social = {
                    github: data.github,
                    twitter: data.twitter,
                    linkedin: data.linkedin,
                };

                setPersonalInfo(data);
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const getGithubUsername = (url) => {
        if (!url) return null;
        try {
            // Handle full URLs
            if (url.startsWith('http') || url.startsWith('www')) {
                const urlObj = new URL(url.startsWith('www') ? `https://${url}` : url);
                const pathParts = urlObj.pathname.split('/').filter(p => p);
                return pathParts[0] || null;
            }
            // Handle simple string or other formats (e.g., just username)
            const cleanUrl = url.split('?')[0].replace(/\/$/, '');
            const parts = cleanUrl.split('/').filter(p => p);
            return parts.length > 0 ? parts[parts.length - 1] : null;
        } catch (e) {
            // Fallback
            return null;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    const githubUsername = getGithubUsername(personalInfo.social.github);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] mx-auto px-4 py-12">
            <motion.div 
                className="grid lg:grid-cols-[350px_1fr] gap-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Left Sidebar - Profile Info */}
                <div className="lg:relative">
                    <div className="lg:sticky lg:top-24 space-y-8">
                        <motion.div variants={itemVariants} className="text-center lg:text-left space-y-6">
                            <div className="relative inline-block">
                                <div className="w-48 h-48 mx-auto lg:mx-0 rounded-2xl overflow-hidden border-4 border-background shadow-xl ring-1 ring-border">
                                    {personalInfo.avatar ? (
                                        <img 
                                            src={personalInfo.avatar} 
                                            alt={personalInfo.name} 
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                            <User size={64} className="text-primary/40" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 -right-3 bg-card px-4 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-2 text-sm font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>Available</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold tracking-tight">{personalInfo.name}</h1>
                                <p className="text-xl text-primary font-medium">{personalInfo.title}</p>
                                <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                                    <MapPin size={16} />
                                    <span>{personalInfo.location}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                                {personalInfo.social.github && (
                                    <a href={personalInfo.social.github} target="_blank" rel="noreferrer" className="p-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <Github size={20} />
                                    </a>
                                )}
                                {personalInfo.social.twitter && (
                                    <a href={personalInfo.social.twitter} target="_blank" rel="noreferrer" className="p-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <Twitter size={20} />
                                    </a>
                                )}
                                {personalInfo.social.linkedin && (
                                    <a href={personalInfo.social.linkedin} target="_blank" rel="noreferrer" className="p-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <Linkedin size={20} />
                                    </a>
                                )}
                                {personalInfo.email && (
                                    <a href={`mailto:${personalInfo.email}`} className="p-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <Mail size={20} />
                                    </a>
                                )}
                            </div>

                            {/* Bio */}
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <p className="text-muted-foreground leading-relaxed">
                                    {personalInfo.bio}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Heart size={18} className="text-primary" />
                                兴趣爱好
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {personalInfo.interests?.map((item, i) => (
                                    <span key={i} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground border border-border">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Content - Details */}
                <div className="space-y-12">
                    
                    {/* Education */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <GraduationCap size={24} />
                            </div>
                            教育背景
                        </h2>
                        <div className="grid gap-4">
                            {personalInfo.education?.map((edu, index) => (
                                <div key={index} className="group flex items-center gap-4 bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/50 transition-colors cursor-default">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors duration-300">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{edu.school}</h3>
                                        <p className="text-muted-foreground">{edu.degree}</p>
                                    </div>
                                    <div className="text-sm font-medium text-primary bg-primary/5 px-3 py-1 rounded-full group-hover:bg-primary/10 transition-colors">
                                        {edu.period}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Experience */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Briefcase size={24} />
                            </div>
                            工作经历
                        </h2>
                        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-linear-to-b before:from-primary/50 before:to-transparent">
                            {personalInfo.experience?.map((exp, index) => (
                                <div key={index} className="relative group">
                                    <div className="absolute -left-[29px] top-1.5 w-6 h-6 rounded-full border-4 border-background bg-primary shadow-sm group-hover:scale-110 transition-transform duration-300" />
                                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/50 transition-colors relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform translate-x-4 -translate-y-4">
                                            <Briefcase size={100} />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{exp.title}</h3>
                                                <p className="text-primary font-medium text-lg">{exp.company}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full w-fit border border-border/50">
                                                <Calendar size={14} />
                                                {exp.period}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap relative z-10">
                                            {exp.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Skills */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Code size={24} />
                            </div>
                            技能栈
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {personalInfo.skills?.map((skill, index) => (
                                <div key={index} className="space-y-2 group">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium group-hover:text-primary transition-colors">{skill.name}</span>
                                        <span className="text-muted-foreground">{skill.level}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-secondary/50 overflow-hidden backdrop-blur-sm border border-border/50">
                                        <motion.div 
                                            className="h-full bg-linear-to-r from-primary to-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.level}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 * index }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* GitHub Stats */}
                    {githubUsername && (
                        <motion.section variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Terminal size={24} />
                                </div>
                                GitHub 动态
                            </h2>
                            {imgError ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <a 
                                        href={personalInfo.social.github}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="p-4 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-3 relative z-10 shadow-sm">
                                            <Github size={32} className="text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1 relative z-10">GitHub Profile</h3>
                                        <p className="text-sm text-muted-foreground relative z-10">View repositories and activity</p>
                                    </a>
                                    <a 
                                        href={`${personalInfo.social.github}?tab=repositories`}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="p-4 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-3 relative z-10 shadow-sm">
                                            <Code size={32} className="text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1 relative z-10">Top Languages</h3>
                                        <p className="text-sm text-muted-foreground relative z-10">View language statistics</p>
                                    </a>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                                        <img 
                                            src={`https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=transparent&hide_border=true&title_color=8b5cf6&text_color=999&icon_color=8b5cf6`}
                                            alt="GitHub Stats"
                                            className="w-full bg-card border border-border rounded-xl shadow-sm min-h-[150px] hover:border-primary/50 transition-colors"
                                            onError={() => setImgError(true)}
                                        />
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                                        <img 
                                            src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=transparent&hide_border=true&title_color=8b5cf6&text_color=999`}
                                            alt="Top Langs"
                                            className="w-full bg-card border border-border rounded-xl shadow-sm min-h-[150px] hover:border-primary/50 transition-colors"
                                            onError={() => setImgError(true)}
                                        />
                                    </motion.div>
                                </div>
                            )}
                        </motion.section>
                    )}

                </div>
            </motion.div>
        </div>
    );
};
