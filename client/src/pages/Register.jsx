import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';

export const Register = () => {
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        phone: '', 
        verificationCode: '',
        captchaText: ''
    });
    const [captcha, setCaptcha] = useState({ id: '', svg: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    const fetchCaptcha = useCallback(async () => {
        try {
            const res = await authApi.getCaptcha();
            setCaptcha({ id: res.data.captchaId, svg: res.data.svg });
        } catch (err) {
            console.error('Failed to fetch captcha', err);
        }
    }, []);

    useEffect(() => {
        fetchCaptcha();
    }, [fetchCaptcha]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const validateField = async (name, value) => {
        let errorMsg = '';
        // Clear previous error for this field
        setFieldErrors(prev => ({ ...prev, [name]: '' }));

        switch (name) {
            case 'username':
                if (!value) {
                    errorMsg = '请输入用户名';
                } else if (!/^[A-Za-z0-9_]{3,32}$/.test(value)) {
                    errorMsg = '用户名需3-32位字母数字下划线';
                } else {
                    try {
                        const res = await authApi.checkAvailability('username', value);
                        if (!res.data.available) {
                            errorMsg = '用户名已存在';
                        }
                    } catch (e) {
                        console.error('Check username failed', e);
                    }
                }
                break;
            case 'password':
                if (!value) {
                    errorMsg = '请输入密码';
                } else if (value.length < 8) {
                    errorMsg = '密码至少8位';
                }
                break;
            case 'phone':
                if (!value) {
                    errorMsg = '请输入手机号';
                } else if (!/^\d{11}$/.test(value)) {
                    errorMsg = '手机号格式不正确';
                } else {
                    try {
                        const res = await authApi.checkAvailability('phone', value);
                        if (!res.data.available) {
                            errorMsg = '手机号已注册';
                        }
                    } catch (e) {
                        console.error('Check phone failed', e);
                    }
                }
                break;
            case 'verificationCode':
                if (!value) {
                    errorMsg = '请输入验证码';
                }
                break;
            case 'captchaText':
                if (!value) {
                    errorMsg = '请输入图形验证码';
                } else if (value.length !== 4) {
                    errorMsg = '图形验证码长度错误';
                }
                break;
        }

        if (errorMsg) {
            setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
        }
        return errorMsg;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const handleSendCode = async () => {
        const phoneError = await validateField('phone', formData.phone);
        if (phoneError) return;

        setError('');
        try {
            await authApi.sendCode(formData.phone);
            setMessage('验证码已发送 (请查看服务器控制台)');
            setCountdown(60);
        } catch (err) {
            setError(err.response?.data?.message || '发送验证码失败');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const errors = {};
        let hasError = false;
        const fields = ['username', 'password', 'phone', 'verificationCode', 'captchaText'];
        
        for (const field of fields) {
            const errorMsg = await validateField(field, formData[field]);
            if (errorMsg) {
                errors[field] = errorMsg;
                hasError = true;
            }
        }

        if (hasError) return;

        setError('');
        setMessage('');
        try {
            const res = await authApi.register({
                ...formData,
                captchaId: captcha.id
            });
            setMessage('注册成功，正在跳转登录页...');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || '注册失败');
            // Refresh captcha on failure
            fetchCaptcha();
            setFormData(prev => ({ ...prev, captchaText: '' }));
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md bg-card border border-border p-6 md:p-8 rounded-lg shadow-sm"
            >
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mb-4">
                        <Terminal size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">用户注册</h2>
                    <p className="text-muted-foreground mt-2">注册新账号</p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-destructive/10 text-destructive p-3 rounded-md mb-6 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-primary/10 text-primary p-3 rounded-md mb-6 text-sm text-center"
                    >
                        {message}
                    </motion.div>
                )}

                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">用户名</label>
                        <input
                            type="text"
                            name="username"
                            className={`w-full bg-background border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors ${fieldErrors.username ? 'border-destructive' : 'border-border'}`}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            onBlur={handleBlur}
                            placeholder="请输入用户名"
                        />
                        {fieldErrors.username && <p className="text-destructive text-xs mt-1">{fieldErrors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">密码</label>
                        <input
                            type="password"
                            name="password"
                            className={`w-full bg-background border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors ${fieldErrors.password ? 'border-destructive' : 'border-border'}`}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onBlur={handleBlur}
                            placeholder="请输入密码"
                        />
                        {fieldErrors.password && <p className="text-destructive text-xs mt-1">{fieldErrors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">手机号</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="phone"
                                className={`flex-1 bg-background border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors ${fieldErrors.phone ? 'border-destructive' : 'border-border'}`}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                onBlur={handleBlur}
                                placeholder="请输入手机号"
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={countdown > 0}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {countdown > 0 ? `${countdown}s` : '发送验证码'}
                            </button>
                        </div>
                        {fieldErrors.phone && <p className="text-destructive text-xs mt-1">{fieldErrors.phone}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">验证码</label>
                        <input
                            type="text"
                            name="verificationCode"
                            className={`w-full bg-background border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors ${fieldErrors.verificationCode ? 'border-destructive' : 'border-border'}`}
                            value={formData.verificationCode}
                            onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                            onBlur={handleBlur}
                            placeholder="请输入验证码"
                        />
                        {fieldErrors.verificationCode && <p className="text-destructive text-xs mt-1">{fieldErrors.verificationCode}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">图形验证码</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="captchaText"
                                className={`flex-1 bg-background border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors ${fieldErrors.captchaText ? 'border-destructive' : 'border-border'}`}
                                value={formData.captchaText}
                                onChange={(e) => setFormData({ ...formData, captchaText: e.target.value })}
                                onBlur={handleBlur}
                                placeholder="请输入右侧字符"
                            />
                            <div 
                                className="h-[42px] bg-white rounded-md border border-border cursor-pointer overflow-hidden relative group"
                                onClick={fetchCaptcha}
                                title="点击刷新"
                            >
                                <div 
                                    className="h-full w-[100px]"
                                    dangerouslySetInnerHTML={{ __html: captcha.svg }} 
                                />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <RefreshCw size={16} className="text-black/50" />
                                </div>
                            </div>
                        </div>
                        {fieldErrors.captchaText && <p className="text-destructive text-xs mt-1">{fieldErrors.captchaText}</p>}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
                    >
                        注册
                    </motion.button>
                </motion.form>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                        已有账号？立即登录
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
