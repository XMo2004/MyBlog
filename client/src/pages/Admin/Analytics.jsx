import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, TrendingDown, Users, Eye, Monitor,
    Smartphone, Tablet, Globe, Clock, RefreshCw, Calendar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { visitApi } from '../../lib/api';
import Loading from '../../components/Loading';
import Toast from '../../components/Toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color = 'text-primary' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all"
    >
        <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
                <Icon size={20} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                    trend >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                    {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(trend)}%</span>
                </div>
            )}
        </div>
        <div className="mt-4">
            <div className="text-2xl font-bold">{value?.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">{title}</div>
            {subValue && <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>}
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-lg text-sm">
                <p className="font-medium mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const [data, setData] = useState(null);
    const [recentVisits, setRecentVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [dateRange, setDateRange] = useState('30');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, recentRes] = await Promise.all([
                visitApi.getAnalytics({ days: dateRange }),
                visitApi.getRecentVisits({ limit: 20 })
            ]);
            setData(analyticsRes.data);
            setRecentVisits(recentRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            setMessage({ type: 'error', text: '获取统计数据失败' });
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <Loading />;

    const { summary, trendData, topPages, hourlyDistribution, deviceData, browserData } = data || {};

    // 格式化小时分布数据
    const hourlyData = hourlyDistribution?.map((count, hour) => ({
        hour: `${hour}:00`,
        count
    })) || [];

    return (
        <div className="space-y-6">
            <Toast
                message={message.text}
                type={message.type}
                onClose={() => setMessage({ type: '', text: '' })}
            />

            {/* 页面标题 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="text-primary" size={24} />
                        访问统计
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        网站访问数据分析和用户行为洞察
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                    >
                        <option value="7">最近 7 天</option>
                        <option value="30">最近 30 天</option>
                        <option value="90">最近 90 天</option>
                    </select>
                    <button
                        onClick={fetchData}
                        className="p-2 border border-border rounded-md hover:bg-secondary"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="今日浏览量 (PV)"
                    value={summary?.todayPV}
                    subValue={`昨日: ${summary?.yesterdayPV}`}
                    icon={Eye}
                    trend={parseFloat(summary?.pvGrowth)}
                    color="text-blue-500"
                />
                <StatCard
                    title="今日访客数 (UV)"
                    value={summary?.todayUV}
                    subValue={`昨日: ${summary?.yesterdayUV}`}
                    icon={Users}
                    trend={parseFloat(summary?.uvGrowth)}
                    color="text-green-500"
                />
                <StatCard
                    title="本周浏览量"
                    value={summary?.weekPV}
                    subValue={`访客: ${summary?.weekUV}`}
                    icon={Calendar}
                    color="text-purple-500"
                />
                <StatCard
                    title="总浏览量"
                    value={summary?.totalPV}
                    subValue={`总访客: ${summary?.totalUV}`}
                    icon={Globe}
                    color="text-orange-500"
                />
            </div>

            {/* 趋势图表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PV/UV趋势 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
                >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" />
                        访问趋势
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorUV" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => value.slice(5)}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="pv" name="浏览量" stroke="#8884d8" fillOpacity={1} fill="url(#colorPV)" />
                                <Area type="monotone" dataKey="uv" name="访客数" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUV)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 设备分布 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-lg p-6"
                >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Monitor size={18} className="text-primary" />
                        设备分布
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deviceData?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* 第二行图表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 小时分布 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
                >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        访问时段分布（最近7天）
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="访问次数" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 浏览器分布 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-lg p-6"
                >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Globe size={18} className="text-primary" />
                        浏览器分布
                    </h3>
                    <div className="space-y-3">
                        {browserData?.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm">{item.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* 底部：热门页面和实时访问 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 热门页面 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                >
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Eye size={18} className="text-primary" />
                            热门页面
                        </h3>
                    </div>
                    <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
                        {topPages?.map((page, index) => (
                            <div key={page.path} className="p-4 flex items-center justify-between hover:bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm truncate max-w-[250px]" title={page.path}>
                                        {page.path}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground">{page.count} 次</span>
                            </div>
                        ))}
                        {(!topPages || topPages.length === 0) && (
                            <div className="p-8 text-center text-muted-foreground text-sm">暂无数据</div>
                        )}
                    </div>
                </motion.div>

                {/* 实时访问 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                >
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            最近访问
                        </h3>
                    </div>
                    <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
                        {recentVisits?.map((visit) => (
                            <div key={visit.id} className="p-4 hover:bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm truncate max-w-[200px]" title={visit.path}>
                                        {visit.path}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(visit.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span>{visit.ip}</span>
                                    <span className="truncate max-w-[200px]">
                                        {visit.userAgent?.slice(0, 50)}...
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!recentVisits || recentVisits.length === 0) && (
                            <div className="p-8 text-center text-muted-foreground text-sm">暂无访问记录</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
