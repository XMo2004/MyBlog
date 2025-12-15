import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    User, MapPin, Briefcase, GraduationCap, Heart, Code, 
    Coffee, Mail, Github, Twitter, Linkedin, ExternalLink,
    Calendar, Download, Terminal, Brain, Sparkles, Zap, 
    Palette, Music, Camera, Book, Gamepad2, Quote, Award
} from 'lucide-react';
import { profileApi } from '../lib/api';

const MbtiCard = ({ mbti }) => {
    const [imgError, setImgError] = useState(false);
    
    if (!mbti) return null;
    
    return (
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800 relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-40 h-40 mb-2 relative transition-transform duration-500 hover:scale-105">
                    {!imgError ? (
                        <img 
                            src="https://www.16personalities.com/static/images/personality-types/avatars/infj-advocate.svg" 
                            alt="INFJ Avatar"
                            className="w-full h-full object-contain drop-shadow-none"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100/50 rounded-full">
                            <Brain size={64} className="text-emerald-600 opacity-50" />
                        </div>
                    )}
                </div>
                
                <h2 className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mb-1 tracking-tight">
                    {mbti.type}
                </h2>
                <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400 uppercase tracking-wider">{mbti.title}</p>
            </div>
        </div>
    );
};

// Tech Stack Color Mapping
const techColors = {
    "react": "#61DAFB",
    "vue": "#4FC08D",
    "angular": "#DD0031",
    "javascript": "#F7DF1E",
    "typescript": "#3178C6",
    "html": "#E34F26",
    "css": "#1572B6",
    "sass": "#CC6699",
    "less": "#1D365D",
    "nodejs": "#339933",
    "node.js": "#339933",
    "python": "#3776AB",
    "java": "#007396",
    "go": "#00ADD8",
    "golang": "#00ADD8",
    "rust": "#000000",
    "c": "#A8B9CC",
    "c++": "#00599C",
    "c#": "#239120",
    "php": "#777BB4",
    "ruby": "#CC342D",
    "swift": "#F05138",
    "kotlin": "#7F52FF",
    "dart": "#0175C2",
    "flutter": "#02569B",
    "docker": "#2496ED",
    "kubernetes": "#326CE5",
    "aws": "#232F3E",
    "azure": "#0078D4",
    "gcp": "#4285F4",
    "git": "#F05032",
    "github": "#181717",
    "gitlab": "#FC6D26",
    "mysql": "#4479A1",
    "postgresql": "#4169E1",
    "mongodb": "#47A248",
    "redis": "#DC382D",
    "graphql": "#E10098",
    "next.js": "#000000",
    "nextjs": "#000000",
    "tailwindcss": "#06B6D4",
    "bootstrap": "#7952B3",
    "linux": "#FCC624",
    "ubuntu": "#E95420",
    "nginx": "#009639",
    "apache": "#D22128",
    "jenkins": "#D24939",
    "jira": "#0052CC",
    "figma": "#F24E1E",
    "photoshop": "#31A8FF",
    "illustrator": "#FF9A00"
};

const getSkillConfig = (name) => {
    const lowerName = name.toLowerCase().replace(/\s+/g, '');
    // Try exact match or match after removing dots/spaces
    let color = techColors[lowerName] || techColors[name.toLowerCase()] || "#a1a1aa"; // Default to zinc-400
    
    // Special handle for C# -> csharp, C++ -> cplusplus for Simple Icons
    let slug = lowerName;
    if (lowerName === "c#") slug = "csharp";
    if (lowerName === "c++") slug = "cplusplus";
    if (lowerName === ".net") slug = "dotnet";
    
    return { color, slug };
};

const SkillBadge = ({ skill, index }) => {
    const { color, slug } = getSkillConfig(skill.name);
    const [iconError, setIconError] = useState(false);
    const iconUrl = `https://cdn.simpleicons.org/${slug}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50 hover:bg-card transition-all duration-300 overflow-hidden cursor-default"
            style={{ "--skill-color": color }}
            whileHover={{ 
                borderColor: color,
                boxShadow: `0 4px 20px -10px ${color}30`,
                y: -2
            }}
        >
            {/* Background Tint on Hover */}
            <div className="absolute inset-0 bg-[var(--skill-color)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon */}
            <div className="relative z-10 w-10 h-10 shrink-0 flex items-center justify-center bg-secondary/50 rounded-lg p-2 group-hover:bg-background/80 transition-colors duration-300">
                {!iconError ? (
                    <img 
                        src={iconUrl} 
                        alt={skill.name}
                        className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                        onError={() => setIconError(true)}
                    />
                ) : (
                    <Code className="w-5 h-5 text-muted-foreground group-hover:text-[var(--skill-color)]" />
                )}
            </div>

            {/* Text Info */}
            <div className="relative z-10 flex flex-col min-w-0 flex-1">
                <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-sm truncate group-hover:text-[var(--skill-color)] transition-colors duration-300">
                        {skill.name}
                    </span>
                    <span className="text-xs text-muted-foreground/70 font-mono group-hover:text-[var(--skill-color)] transition-colors duration-300">
                        {skill.level}%
                    </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + (index * 0.05), ease: "easeOut" }}
                        className="h-full bg-[var(--skill-color)] rounded-full shadow-[0_0_8px_var(--skill-color)]"
                    />
                </div>
            </div>
        </motion.div>
    );
};

const InterestCard = ({ interest, index }) => {
    // 简单的图标映射逻辑，实际项目中可以更精细
    const icons = [Sparkles, Zap, Palette, Music, Camera, Book, Gamepad2, Coffee];
    const Icon = icons[index % icons.length] || Heart;
    const colors = [
        "bg-red-500/10 text-red-600",
        "bg-orange-500/10 text-orange-600",
        "bg-amber-500/10 text-amber-600",
        "bg-green-500/10 text-green-600",
        "bg-emerald-500/10 text-emerald-600",
        "bg-teal-500/10 text-teal-600",
        "bg-cyan-500/10 text-cyan-600",
        "bg-blue-500/10 text-blue-600",
        "bg-indigo-500/10 text-indigo-600",
        "bg-violet-500/10 text-violet-600",
        "bg-fuchsia-500/10 text-fuchsia-600",
        "bg-pink-500/10 text-pink-600",
        "bg-rose-500/10 text-rose-600",
    ];
    const colorClass = colors[index % colors.length];

    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 ${colorClass} bg-opacity-50 backdrop-blur-xs transition-all cursor-default`}
        >
            <Icon size={28} className="mb-2 opacity-80" />
            <span className="font-medium text-sm text-center opacity-90">{interest}</span>
        </motion.div>
    );
};

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
        email: '',
        mbti: null
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

                // Inject default MBTI data if not present
                if (!data.mbti) {
                    data.mbti = {
                        type: "INTJ-A",
                        title: "建筑师",
                        desc: "富有想象力和战略性的思想家，一切皆在计划之中。",
                        traits: [
                            { label: "内向 (Introverted)", value: 82, color: "bg-blue-500" },
                            { label: "直觉 (Intuitive)", value: 76, color: "bg-amber-500" },
                            { label: "理智 (Thinking)", value: 68, color: "bg-emerald-500" },
                            { label: "计划 (Judging)", value: 84, color: "bg-violet-500" }
                        ]
                    };
                }

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
        <div className="max-w-7xl mx-auto px-4 py-12">
            <motion.div 
                className="grid lg:grid-cols-[380px_1fr] gap-8 lg:gap-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Left Sidebar - Profile & MBTI */}
                <div className="lg:relative">
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {/* Profile Card */}
                        <motion.div variants={itemVariants} className="text-center space-y-6 bg-card p-8 rounded-3xl border border-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-primary/10 to-transparent" />
                            
                            <div className="relative inline-block">
                                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-background ring-1 ring-border/50">
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
                                <div className="absolute bottom-1 right-1 bg-background px-3 py-1 rounded-full border border-border flex items-center gap-1.5 text-xs font-medium text-green-600">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Available
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">{personalInfo.name}</h1>
                                <p className="text-lg text-primary font-medium">{personalInfo.title}</p>
                                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                    <MapPin size={14} />
                                    <span>{personalInfo.location}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                {personalInfo.social.github && (
                                    <a href={personalInfo.social.github} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-1">
                                        <Github size={18} />
                                    </a>
                                )}
                                {personalInfo.social.twitter && (
                                    <a href={personalInfo.social.twitter} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-1">
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {personalInfo.social.linkedin && (
                                    <a href={personalInfo.social.linkedin} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-1">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {personalInfo.email && (
                                    <a href={`mailto:${personalInfo.email}`} className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-1">
                                        <Mail size={18} />
                                    </a>
                                )}
                            </div>
                        </motion.div>

                        {/* MBTI Card */}
                        <motion.div variants={itemVariants}>
                            <MbtiCard mbti={personalInfo.mbti} />
                        </motion.div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="space-y-10">
                    
                    {/* Bio Section */}
                    <motion.section variants={itemVariants} className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <span className="w-8 h-1 rounded-full bg-primary" />
                            关于我
                        </h2>
                        <div className="bg-card p-8 rounded-3xl border border-border relative overflow-hidden group hover:border-primary/20 transition-colors">
                            <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:rotate-45">
                                <Quote size={200} />
                            </div>
                            <div className="relative z-10 flex flex-col gap-2">
                                <Quote className="text-primary/20 rotate-180 self-start" size={40} />
                                <p className="text-lg leading-loose text-muted-foreground font-medium px-2 md:px-6">
                                    {personalInfo.bio}
                                </p>
                                <Quote className="text-primary/20 self-end" size={40} />
                            </div>
                        </div>
                    </motion.section>

                    {/* Interests Section */}
                    <motion.section variants={itemVariants} className="space-y-6">
                         <h2 className="text-2xl font-bold flex items-center gap-3">
                            <span className="w-8 h-1 rounded-full bg-primary" />
                            兴趣爱好
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {personalInfo.interests?.map((item, i) => (
                                <InterestCard key={i} interest={item} index={i} />
                            ))}
                        </div>
                    </motion.section>

                    {/* Experience & Education Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Experience */}
                        <motion.section variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Briefcase size={20} />
                                </div>
                                工作经历
                            </h2>
                            <div className="space-y-4">
                                {personalInfo.experience?.map((exp, index) => (
                                    <div key={index} className="bg-card p-5 rounded-2xl border border-border/50 hover:border-blue-500/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{exp.title}</h3>
                                            <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full text-muted-foreground">{exp.period}</span>
                                        </div>
                                        <p className="text-blue-600/80 font-medium text-sm mb-3">{exp.company}</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Education */}
                        <motion.section variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <GraduationCap size={20} />
                                </div>
                                教育背景
                            </h2>
                            <div className="space-y-4">
                                {personalInfo.education?.map((edu, index) => (
                                    <div key={index} className="bg-card p-5 rounded-2xl border border-border/50 hover:border-emerald-500/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold group-hover:text-emerald-600 transition-colors">{edu.school}</h3>
                                                <p className="text-sm text-muted-foreground">{edu.degree}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs font-medium text-emerald-600/80 bg-emerald-500/5 px-3 py-1 rounded-full w-fit">
                                            {edu.period}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    </div>

                    {/* Skills */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <span className="w-8 h-1 rounded-full bg-primary" />
                            技能栈
                        </h2>
                        <div className="bg-card p-6 rounded-3xl border border-border">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {personalInfo.skills?.map((skill, index) => (
                                    <SkillBadge key={index} skill={skill} index={index} />
                                ))}
                            </div>
                        </div>
                    </motion.section>

                    {/* GitHub Stats */}
                    {githubUsername && (
                        <motion.section variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-zinc-800 text-white dark:bg-zinc-700">
                                    <Github size={20} />
                                </div>
                                GitHub 动态
                            </h2>
                            {imgError ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <a 
                                        href={personalInfo.social.github}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-3xl hover:border-primary/50 transition-all group"
                                    >
                                        <div className="p-4 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-3">
                                            <Github size={32} />
                                        </div>
                                        <h3 className="font-semibold text-lg">GitHub Profile</h3>
                                    </a>
                                    <a 
                                        href={`${personalInfo.social.github}?tab=repositories`}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-3xl hover:border-primary/50 transition-all group"
                                    >
                                        <div className="p-4 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-3">
                                            <Code size={32} />
                                        </div>
                                        <h3 className="font-semibold text-lg">Top Languages</h3>
                                    </a>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                                        <img 
                                            src={`https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=transparent&hide_border=true&title_color=8b5cf6&text_color=999&icon_color=8b5cf6`}
                                            alt="GitHub Stats"
                                            className="w-full bg-card border border-border rounded-3xl min-h-[150px] hover:border-primary/50 transition-colors"
                                            onError={() => setImgError(true)}
                                        />
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                                        <img 
                                            src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=transparent&hide_border=true&title_color=8b5cf6&text_color=999`}
                                            alt="Top Langs"
                                            className="w-full bg-card border border-border rounded-3xl min-h-[150px] hover:border-primary/50 transition-colors"
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

export default About;