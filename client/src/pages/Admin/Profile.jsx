import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Briefcase, GraduationCap, Code, Heart, Plus, Trash2 } from 'lucide-react';
import { profileApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';

const AdminProfile = () => {
    const [profile, setProfile] = useState({
        name: '', title: '', location: '', bio: '',
        email: '', github: '', twitter: '', linkedin: '',
        skills: [],
        interests: [],
        experience: [],
        education: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await profileApi.get();
            let data = res.data;
            // Parse JSON strings if they come as strings
            try {
                if (typeof data.skills === 'string') data.skills = JSON.parse(data.skills);
                if (typeof data.interests === 'string') data.interests = JSON.parse(data.interests);
                if (typeof data.experience === 'string') data.experience = JSON.parse(data.experience);
                if (typeof data.education === 'string') data.education = JSON.parse(data.education);
            } catch (e) {
                console.error("Error parsing JSON fields", e);
            }
            // Ensure arrays
            data.skills = Array.isArray(data.skills) ? data.skills : [];
            data.interests = Array.isArray(data.interests) ? data.interests : [];
            data.experience = Array.isArray(data.experience) ? data.experience : [];
            data.education = Array.isArray(data.education) ? data.education : [];

            setProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setMessage({ type: 'error', text: '加载个人信息失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (field, index, subField, value) => {
        const newArray = [...profile[field]];
        if (typeof newArray[index] === 'object') {
            newArray[index] = { ...newArray[index], [subField]: value };
        } else {
            newArray[index] = value;
        }
        setProfile(prev => ({ ...prev, [field]: newArray }));
    };

    const addItem = (field, initialValue) => {
        setProfile(prev => ({ ...prev, [field]: [...prev[field], initialValue] }));
    };

    const removeItem = (field, index) => {
        setProfile(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        const dataToSave = {
            ...profile,
            skills: JSON.stringify(profile.skills),
            interests: JSON.stringify(profile.interests),
            experience: JSON.stringify(profile.experience),
            education: JSON.stringify(profile.education),
        };

        try {
            await profileApi.update(dataToSave);
            setMessage({ type: 'success', text: '个人信息已保存' });
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage({ type: 'error', text: '保存失败' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">个人信息管理</h1>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={16} />
                    {isSaving ? '保存中...' : '保存更改'}
                </motion.button>
            </div>

            <Toast 
                message={message.text} 
                type={message.type} 
                onClose={() => setMessage({ type: '', text: '' })} 
            />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1600px] mx-auto">
                {/* Basic Info */}
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><User size={18} /> 基本资料</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">姓名</label>
                            <input type="text" name="name" value={profile.name || ''} onChange={handleChange} placeholder="姓名" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">头像 URL</label>
                            <input type="text" name="avatar" value={profile.avatar || ''} onChange={handleChange} placeholder="头像图片链接" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">头衔/职位</label>
                            <input type="text" name="title" value={profile.title || ''} onChange={handleChange} placeholder="头衔/职位" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">所在地</label>
                            <input type="text" name="location" value={profile.location || ''} onChange={handleChange} placeholder="所在地" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input type="text" name="email" value={profile.email || ''} onChange={handleChange} placeholder="Email" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">GitHub</label>
                            <input type="text" name="github" value={profile.github || ''} onChange={handleChange} placeholder="GitHub URL" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Twitter</label>
                            <input type="text" name="twitter" value={profile.twitter || ''} onChange={handleChange} placeholder="Twitter URL" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">LinkedIn</label>
                            <input type="text" name="linkedin" value={profile.linkedin || ''} onChange={handleChange} placeholder="LinkedIn URL" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">个人简介</label>
                            <textarea name="bio" value={profile.bio || ''} onChange={handleChange} placeholder="个人简介" rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none" />
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><Code size={18} /> 技能栈</h2>
                        <button type="button" onClick={() => addItem('skills', { name: '', level: 50 })} className="text-sm text-primary flex items-center gap-1 hover:underline"><Plus size={16} /> 添加技能</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.skills.map((skill, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input type="text" value={skill.name} onChange={(e) => handleArrayChange('skills', index, 'name', e.target.value)} placeholder="技能名称" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                                <input type="number" value={skill.level} onChange={(e) => handleArrayChange('skills', index, 'level', parseInt(e.target.value))} placeholder="%" className="w-20 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" min="0" max="100" />
                                <button type="button" onClick={() => removeItem('skills', index)} className="text-muted-foreground hover:text-destructive p-2 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Experience */}
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><Briefcase size={18} /> 工作经历</h2>
                        <button type="button" onClick={() => addItem('experience', { title: '', company: '', period: '', description: '' })} className="text-sm text-primary flex items-center gap-1 hover:underline"><Plus size={16} /> 添加经历</button>
                    </div>
                    <div className="space-y-4">
                        {profile.experience.map((exp, index) => (
                            <div key={index} className="space-y-3 p-4 border border-border rounded-md bg-muted/30 relative group">
                                <button type="button" onClick={() => removeItem('experience', index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <input type="text" value={exp.title} onChange={(e) => handleArrayChange('experience', index, 'title', e.target.value)} placeholder="职位" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <input type="text" value={exp.company} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} placeholder="公司" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <input type="text" value={exp.period} onChange={(e) => handleArrayChange('experience', index, 'period', e.target.value)} placeholder="时间段 (e.g. 2020 - Present)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                                    </div>
                                </div>
                                <textarea value={exp.description} onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)} placeholder="工作描述..." className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none" rows={2} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><GraduationCap size={18} /> 教育背景</h2>
                        <button type="button" onClick={() => addItem('education', { degree: '', school: '', period: '' })} className="text-sm text-primary flex items-center gap-1 hover:underline"><Plus size={16} /> 添加教育</button>
                    </div>
                    <div className="space-y-3">
                        {profile.education.map((edu, index) => (
                            <div key={index} className="flex gap-3 items-center flex-wrap md:flex-nowrap p-3 border border-border rounded-md bg-muted/30 group">
                                <input type="text" value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} placeholder="学位" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground font-medium" />
                                <input type="text" value={edu.school} onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)} placeholder="学校" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                                <input type="text" value={edu.period} onChange={(e) => handleArrayChange('education', index, 'period', e.target.value)} placeholder="时间段" className="w-32 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                                <button type="button" onClick={() => removeItem('education', index)} className="text-muted-foreground hover:text-destructive p-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interests */}
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><Heart size={18} /> 兴趣爱好</h2>
                        <button type="button" onClick={() => addItem('interests', '')} className="text-sm text-primary flex items-center gap-1 hover:underline"><Plus size={16} /> 添加兴趣</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {profile.interests.map((interest, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted/30 p-1 pl-2 rounded-md border border-border group">
                                <input type="text" value={interest} onChange={(e) => handleArrayChange('interests', index, null, e.target.value)} className="bg-transparent border-none text-sm focus:outline-none w-24" placeholder="兴趣" />
                                <button type="button" onClick={() => removeItem('interests', index)} className="text-muted-foreground hover:text-destructive p-1 opacity-100 lg:opacity-50 lg:group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminProfile;
