import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            if (res.data.user.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || '登录失败');
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
                    <h2 className="text-2xl font-bold text-foreground">用户登录</h2>
                    <p className="text-muted-foreground mt-2">欢迎回来，请输入您的账号</p>
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

                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">用户名</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="请输入用户名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">密码</label>
                        <input
                            type="password"
                            className="w-full bg-background border border-border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="请输入密码"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
                    >
                        登录
                    </motion.button>
                </motion.form>

                <div className="mt-4 text-center">
                    <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">
                        还没有账号？立即注册
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;