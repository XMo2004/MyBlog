import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Type, Signature } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import Toast from '../../components/Toast';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        siteTitle: '',
        siteSubtitle: '',
        signature: '',
        heroTitle: '',
        heroSubtitle: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await settingsApi.get();
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: '加载设置失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await settingsApi.update(settings);
            setMessage({ type: 'success', text: '设置已保存' });
        } catch (error) {
            console.error('Failed to update settings:', error);
            setMessage({ type: 'error', text: '保存设置失败' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div>加载中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">网站设置</h1>
                    <p className="text-sm text-muted-foreground mt-1">管理网站全局配置，如标题、签名等。</p>
                </div>
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

            {/* Settings Form */}
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto">
                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <Globe size={18} className="text-primary" />
                        基础信息
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">网站标题</label>
                            <input
                                type="text"
                                name="siteTitle"
                                value={settings.siteTitle || ''}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                placeholder="例如：我的数字花园"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">网站副标题</label>
                            <input
                                type="text"
                                name="siteSubtitle"
                                value={settings.siteSubtitle || ''}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                placeholder="例如：记录学习与生活"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <Type size={18} className="text-primary" />
                        首页展示
                    </h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hero 标题</label>
                        <input
                            type="text"
                            name="heroTitle"
                            value={settings.heroTitle || ''}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            placeholder="例如：构建未来"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hero 副标题</label>
                        <textarea
                            name="heroSubtitle"
                            value={settings.heroSubtitle || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
                            placeholder="例如：分享关于软件工程..."
                        />
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-card rounded-lg border border-border shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <Signature size={18} className="text-primary" />
                        个性化
                    </h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">签名语句</label>
                        <textarea
                            name="signature"
                            value={settings.signature || ''}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
                            placeholder="例如：代码即诗歌 | 探索技术边界"
                        />
                        <p className="text-xs text-muted-foreground">首页打字机效果显示的语句，多条语句请用竖线 "|" 分隔。</p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
