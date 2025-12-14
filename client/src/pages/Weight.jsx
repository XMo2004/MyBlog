import React, { useState, useEffect, useMemo } from 'react';
import { weightApi } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Scale } from 'lucide-react';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import useTheme from '../components/useTheme';
import Loading from '../components/Loading';

const Weight = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year', 'all'
    const { theme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await weightApi.getAll();
                // Format date for chart
                const formattedData = res.data.map(item => ({
                    ...item,
                    dateObj: new Date(item.date),
                    dateStr: format(new Date(item.date), 'MM-dd'),
                    fullDate: format(new Date(item.date), 'yyyy-MM-dd')
                }));
                setData(formattedData);
            } catch (error) {
                console.error('Failed to fetch weight data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        const now = new Date();
        const today = startOfDay(now);
        
        switch (timeRange) {
            case 'week':
                return data.filter(item => isAfter(item.dateObj, subDays(today, 7)));
            case 'month':
                return data.filter(item => isAfter(item.dateObj, subDays(today, 30)));
            case 'year':
                return data.filter(item => isAfter(item.dateObj, subDays(today, 365)));
            default:
                return data;
        }
    }, [data, timeRange]);

    const chartColors = {
        grid: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        text: theme === 'dark' ? '#9ca3af' : '#6b7280',
        line: theme === 'dark' ? '#a78bfa' : '#7c3aed', // primary-ish color
        tooltipBg: theme === 'dark' ? '#1f2937' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb',
        tooltipText: theme === 'dark' ? '#f3f4f6' : '#111827'
    };

    if (loading) {
        return <Loading />;
    }


    const ranges = [
        { key: 'week', label: '近一周' },
        { key: 'month', label: '近一月' },
        { key: 'year', label: '近一年' },
        { key: 'all', label: '全部' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 py-8 max-w-4xl pt-24"
        >
            <div className="mb-10 text-center">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4"
                >
                    <Scale className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">
                    体重记录
                </h1>
                <p className="text-muted-foreground">记录每一天的变化，见证更好的自己</p>
            </div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl shadow-sm p-6 mb-8"
            >
                <div className="flex justify-end mb-6">
                    <div className="bg-muted p-1 rounded-lg inline-flex">
                        {ranges.map(range => (
                            <button
                                key={range.key}
                                onClick={() => setTimeRange(range.key)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    timeRange === range.key
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    {filteredData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={filteredData}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 0,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                                <XAxis 
                                    dataKey="dateStr" 
                                    stroke={chartColors.text} 
                                    tick={{ fill: chartColors.text }} 
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={['dataMin - 1', 'dataMax + 1']} 
                                    unit="kg" 
                                    stroke={chartColors.text} 
                                    tick={{ fill: chartColors.text }} 
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: chartColors.tooltipBg, 
                                        borderColor: chartColors.tooltipBorder,
                                        borderRadius: '0.5rem',
                                        color: chartColors.tooltipText
                                    }}
                                    itemStyle={{ color: chartColors.line }}
                                    labelStyle={{ color: chartColors.tooltipText, marginBottom: '0.25rem', fontWeight: 600 }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullDate;
                                        }
                                        return label;
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="weight" 
                                    name="体重 (kg)" 
                                    stroke={chartColors.line} 
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                    strokeWidth={3} 
                                    dot={{ r: 4, strokeWidth: 0, fill: chartColors.line }}
                                    isAnimationActive={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Scale size={48} className="opacity-20 mb-4" />
                            <p>该时间段暂无数据</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
            >
                 <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold text-card-foreground">详细记录</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">日期</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">体重 (kg)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">备注</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {[...filteredData].reverse().map((record) => (
                                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        {record.fullDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                        {record.weight}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {record.note || '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-muted-foreground">
                                        暂无数据
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Weight;
