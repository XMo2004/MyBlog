import React, { useState, useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { 
    FileText, MessageSquare, Tag, Link as LinkIcon, Folder, Users, 
    Activity, AlertCircle, RotateCw, TrendingUp, PieChart as PieChartIcon, Type 
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminApi } from '../../lib/api';

// 动画变体配置
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
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

const CountUp = ({ from = 0, to, duration = 1.5 }) => {
    const nodeRef = useRef();
    
    useEffect(() => {
        const node = nodeRef.current;
        const controls = animate(from, to, {
            duration,
            onUpdate(value) {
                if (node) node.textContent = Math.round(value).toLocaleString();
            }
        });
        return () => controls.stop();
    }, [from, to, duration]);

    return <span ref={nodeRef} />;
};

const StatCard = ({ title, value, icon: Icon, subValue, color, animate: shouldAnimate }) => (
    <motion.div 
        variants={itemVariants}
        className="bg-card border border-border p-5 rounded-lg flex flex-col gap-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
    >
        <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">{title}</span>
            <div className={`p-2 rounded-full bg-background/50 group-hover:bg-primary/10 transition-colors ${color}`}>
                <Icon size={18} />
            </div>
        </div>
        <div>
            <h3 className="text-2xl font-bold tracking-tight">
                {shouldAnimate ? <CountUp to={value} /> : value}
            </h3>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
    </motion.div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-md shadow-xl text-sm">
                <p className="font-semibold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [tagDistribution, setTagDistribution] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.getStats();
            setStats(res.data);
            if (res.data.trendData) {
                setTrendData(res.data.trendData);
            }
            if (res.data.heatmapData) {
                setHeatmapData(res.data.heatmapData);
            }
            if (res.data.tagDistribution) {
                setTagDistribution(res.data.tagDistribution);
            }
            if (res.data.categoryDistribution) {
                setCategoryDistribution(res.data.categoryDistribution);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setError(error.response?.data?.message || '加载统计数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // 准备饼图数据
    const getPieData = () => {
        if (!tagDistribution || tagDistribution.length === 0) return [];
        return tagDistribution;
    };

    const getCategoryPieData = () => {
        if (!categoryDistribution || categoryDistribution.length === 0) return [];
        return categoryDistribution;
    };

    const getHeatmapColor = (count) => {
        if (count === 0) return 'bg-secondary/30';
        if (count < 1000) return 'bg-green-100 dark:bg-green-900/30';
        if (count < 3000) return 'bg-green-300 dark:bg-green-700/50';
        if (count < 5000) return 'bg-green-500 dark:bg-green-600';
        return 'bg-green-700 dark:bg-green-500';
    };

    const renderHeatmap = () => {
        if (!heatmapData || heatmapData.length === 0) return null;

        // Generate dates for the last year
        const today = new Date();
        const dates = [];
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }

        // Create a map for quick lookup
        const countMap = new Map();
        heatmapData.forEach(item => {
            countMap.set(item.date, { count: item.count, postCount: item.postCount });
        });

        const weeks = [];
        let currentWeek = [];

        // Fill weeks
        dates.forEach((date, index) => {
            if (date.getDay() === 0 && currentWeek.length > 0) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(date);
            if (index === dates.length - 1 && currentWeek.length > 0) {
                weeks.push(currentWeek);
            }
        });

        return (
            <div className="flex gap-1 overflow-x-auto pb-2">
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                        {week.map((date, dIndex) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const data = countMap.get(dateStr) || { count: 0, postCount: 0 };
                            return (
                                <div
                                    key={dateStr}
                                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(data.count)}`}
                                    title={`${dateStr}\n文章: ${data.postCount} 篇\n字数: ${data.count} 字`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive gap-4">
            <AlertCircle size={48} />
            <p className="text-lg font-medium">{error}</p>
            <button 
                onClick={fetchStats}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                <RotateCw size={16} />
                重试
            </button>
        </div>
    );

    if (!stats) return null;

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
                    <p className="text-muted-foreground mt-1">欢迎回来，查看您的应用概览。</p>
                </div>
                <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border">
                    上次更新: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* 统计卡片区域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                <StatCard
                    title="已发布文章"
                    value={stats.posts.published}
                    subValue={`${stats.posts.drafts} 草稿`}
                    icon={FileText}
                    color="text-blue-500"
                    animate={true}
                />
                <StatCard
                    title="总字数"
                    value={stats.totalWordCount}
                    icon={Type}
                    color="text-green-500"
                    animate={true}
                />
                <StatCard
                    title="总资源"
                    value={stats.resources + stats.projects}
                    subValue={`${stats.projects} 项目, ${stats.resources} 资源`}
                    icon={Folder}
                    color="text-purple-500"
                    animate={true}
                />
            </div>

            {/* 写作热力图 */}
            <motion.div 
                variants={itemVariants}
                className="bg-card border border-border rounded-xl p-6 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">写作活跃度</h2>
                        <p className="text-xs text-muted-foreground">过去一年的文章字数统计</p>
                    </div>
                </div>
                <div className="w-full overflow-hidden">
                    {renderHeatmap()}
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-end">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-secondary/30"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700/50"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500"></div>
                    <span>More</span>
                </div>
            </motion.div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-6">
                {/* 访问趋势图 - 占8列 */}
                <motion.div 
                    variants={itemVariants}
                    className="lg:col-span-8 2xl:col-span-8 3xl:col-span-9 bg-card border border-border rounded-xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <TrendingUp size={20} />
                            </div>
                            <h2 className="font-semibold text-lg">访问趋势 (最近7天)</h2>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="views" name="浏览量" stroke="#82ca9d" fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="visits" name="访客数" stroke="#8884d8" fillOpacity={1} fill="url(#colorVisits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 最近活动 - 占4列 */}
                <motion.div 
                    variants={itemVariants}
                    className="lg:col-span-4 2xl:col-span-4 3xl:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col"
                >
                    <div className="p-6 border-b border-border flex items-center gap-2 shrink-0">
                        <Activity size={20} className="text-primary" />
                        <h2 className="font-semibold text-lg">最近活动</h2>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto grow" style={{ maxHeight: '300px' }}>
                        {stats.recentLogs.map((log, index) => (
                            <motion.div 
                                key={log.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                                    <div>
                                        <div className="text-sm font-medium truncate w-32" title={log.action}>{log.action}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                {log.model}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleDateString()}
                                </span>
                            </motion.div>
                        ))}
                        {stats.recentLogs.length === 0 && (
                            <div className="text-muted-foreground text-center py-12 text-sm">暂无活动</div>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 标签分布图 */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-card border border-border rounded-xl p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Tag size={20} />
                        </div>
                        <h2 className="font-semibold text-lg">标签分布</h2>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getPieData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {getPieData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 分类分布图 */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-card border border-border rounded-xl p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Folder size={20} />
                        </div>
                        <h2 className="font-semibold text-lg">分类分布</h2>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getCategoryPieData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {getCategoryPieData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
