import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, Trash2, Scale, Save, X, Utensils, 
    PieChart as PieChartIcon, Edit3, LayoutGrid, List,
    TrendingUp, TrendingDown, Activity, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip 
} from 'recharts';
import { weightApi, dietApi } from '../../lib/api';
import Toast from '../../components/Toast';
import DatePicker from '../../components/DatePicker';
import Loading from '../../components/Loading';

const MEAL_SLOTS = [
    { key: 'breakfast', label: '早餐' },
    { key: 'lunch', label: '午餐' },
    { key: 'dinner', label: '晚餐' },
    { key: 'snack', label: '加餐' },
];

const FOOD_DATABASE = [
    { name: '米饭', unit: '100g', calories: 116, protein: 2.6, fat: 0.3, carbs: 25.9 },
    { name: '全麦面包', unit: '1片', calories: 80, protein: 3.5, fat: 1.1, carbs: 14 },
    { name: '鸡胸肉', unit: '100g', calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    { name: '鸡蛋', unit: '1个', calories: 78, protein: 6.3, fat: 5.3, carbs: 0.6 },
    { name: '纯牛奶', unit: '250ml', calories: 150, protein: 8, fat: 8, carbs: 12 },
    { name: '苹果', unit: '1个', calories: 95, protein: 0.5, fat: 0.3, carbs: 25 },
    { name: '香蕉', unit: '1根', calories: 105, protein: 1.3, fat: 0.4, carbs: 27 },
    { name: '燕麦片', unit: '40g', calories: 150, protein: 5, fat: 3, carbs: 27 },
    { name: '花生酱', unit: '1汤匙', calories: 94, protein: 4, fat: 8, carbs: 3 },
    { name: '酸奶', unit: '150g', calories: 95, protein: 5, fat: 3, carbs: 11 },
];

const MACRO_COLORS = {
    protein: '#22c55e',
    fat: '#f97316',
    carbs: '#3b82f6',
};

const MEAL_COLORS = {
    breakfast: '#0ea5e9',
    lunch: '#22c55e',
    dinner: '#6366f1',
    snack: '#f59e0b',
};

const DAILY_CALORIES_LIMIT = 2000;

const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

const Weight = () => {
    const [weights, setWeights] = useState([]);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newWeight, setNewWeight] = useState('');
    const [newNote, setNewNote] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('diet'); // 'diet' | 'weight'

    // Diet State
    const [dietDate, setDietDate] = useState(new Date().toISOString().split('T')[0]);
    const [dietRecords, setDietRecords] = useState([]);
    const [dietLoading, setDietLoading] = useState(false);
    const [editingDietId, setEditingDietId] = useState(null);
    const [dietForm, setDietForm] = useState({
        timeSlot: 'breakfast',
        food: '',
        quantity: '',
        unit: '份',
        calories: '',
        protein: '',
        fat: '',
        carbs: '',
        note: '',
        photo: '',
        photoPreview: '',
    });
    const [dietError, setDietError] = useState('');

    useEffect(() => {
        fetchWeights();
    }, []);

    useEffect(() => {
        fetchDiet(dietDate);
    }, [dietDate]);

    const fetchWeights = async () => {
        setIsLoading(true);
        try {
            const res = await weightApi.getAll();
            setWeights(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDiet = async (date) => {
        setDietLoading(true);
        try {
            const res = await dietApi.getByDate(date);
            setDietRecords(res.data || []);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: '获取饮食记录失败' });
        } finally {
            setDietLoading(false);
        }
    };

    const handleAddWeight = async (event) => {
        event.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await weightApi.add({ date: newDate, weight: newWeight, note: newNote });
            fetchWeights();
            setMessage({ type: 'success', text: '体重记录已保存' });
            setNewWeight('');
            setNewNote('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '操作失败' });
        }
    };

    const handleDeleteWeight = async (id) => {
        if (!window.confirm('确定要删除这条记录吗？')) return;
        try {
            await weightApi.delete(id);
            setWeights(weights.filter(w => w.id !== id));
            setMessage({ type: 'success', text: '记录已删除' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '删除失败' });
        }
    };

    const handleDietChange = (field, value) => {
        setDietForm((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (dietError) setDietError('');
    };

    const handleFoodSelect = (item) => {
        setDietForm((prev) => ({
            ...prev,
            food: item.name,
            unit: item.unit,
            calories: String(item.calories),
            protein: String(item.protein),
            fat: String(item.fat),
            carbs: String(item.carbs),
        }));
        if (dietError) setDietError('');
    };

    const handleDietPhotoChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            setDietForm((prev) => ({ ...prev, photo: '', photoPreview: '' }));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setDietForm((prev) => ({
                    ...prev,
                    photo: reader.result,
                    photoPreview: reader.result,
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDietEdit = (record) => {
        setEditingDietId(record.id);
        setDietDate(formatDate(record.date));
        setDietForm({
            timeSlot: record.timeSlot,
            food: record.food,
            quantity: String(record.quantity),
            unit: record.unit,
            calories: String(record.calories),
            protein: record.protein ? String(record.protein) : '',
            fat: record.fat ? String(record.fat) : '',
            carbs: record.carbs ? String(record.carbs) : '',
            note: record.note || '',
            photo: record.photo || '',
            photoPreview: record.photo || '',
        });
        setDietError('');
        // Ensure input view is visible if needed, but in new layout it's always visible on left
    };

    const resetDietForm = () => {
        setEditingDietId(null);
        setDietForm({
            timeSlot: 'breakfast',
            food: '',
            quantity: '',
            unit: '份',
            calories: '',
            protein: '',
            fat: '',
            carbs: '',
            note: '',
            photo: '',
            photoPreview: '',
        });
        setDietError('');
    };

    const handleDietSubmit = async (event) => {
        event.preventDefault();
        setDietError('');
        const food = dietForm.food.trim();
        const unit = dietForm.unit.trim() || '份';
        const quantity = parseFloat(dietForm.quantity);
        const calories = parseFloat(dietForm.calories);
        const protein = dietForm.protein === '' ? 0 : parseFloat(dietForm.protein);
        const fat = dietForm.fat === '' ? 0 : parseFloat(dietForm.fat);
        const carbs = dietForm.carbs === '' ? 0 : parseFloat(dietForm.carbs);

        if (!dietDate || !food || !dietForm.timeSlot) {
            setDietError('请填写日期、进餐类型和食物名称');
            return;
        }
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(calories) || calories <= 0) {
            setDietError('请输入有效的份量和热量');
            return;
        }
        if ((dietForm.protein !== '' && (!Number.isFinite(protein) || protein < 0))
            || (dietForm.fat !== '' && (!Number.isFinite(fat) || fat < 0))
            || (dietForm.carbs !== '' && (!Number.isFinite(carbs) || carbs < 0))) {
            setDietError('营养素数据无效');
            return;
        }

        const payload = {
            date: dietDate,
            timeSlot: dietForm.timeSlot,
            food,
            quantity,
            unit,
            calories,
            protein: Number.isFinite(protein) && protein >= 0 ? protein : 0,
            fat: Number.isFinite(fat) && fat >= 0 ? fat : 0,
            carbs: Number.isFinite(carbs) && carbs >= 0 ? carbs : 0,
            note: dietForm.note.trim() || undefined,
            photo: dietForm.photo || undefined,
        };

        try {
            let res;
            if (editingDietId) {
                res = await dietApi.update(editingDietId, payload);
                setDietRecords((prev) =>
                    prev.map((item) => (item.id === editingDietId ? res.data : item)),
                );
                setMessage({ type: 'success', text: '饮食记录已更新' });
            } else {
                res = await dietApi.create(payload);
                setDietRecords((prev) => [...prev, res.data]);
                setMessage({ type: 'success', text: '饮食记录已添加' });
            }
            resetDietForm();
            
            // Check daily limit
            const total = (editingDietId
                ? dietRecords.map((item) => (item.id === editingDietId ? res.data : item))
                : [...dietRecords, res.data]
            ).reduce((sum, item) => sum + (item.calories || 0), 0);
            
            if (total > DAILY_CALORIES_LIMIT) {
                setMessage({ type: 'error', text: '当日总热量已超过设定阈值' });
            }
        } catch (error) {
            console.error(error);
            setDietError('保存失败，请稍后重试');
        }
    };

    const handleDietDelete = async (id) => {
        if (!window.confirm('确定要删除这条饮食记录吗？')) return;
        try {
            await dietApi.delete(id);
            setDietRecords((prev) => prev.filter((item) => item.id !== id));
            setMessage({ type: 'success', text: '饮食记录已删除' });
            if (editingDietId === id) {
                resetDietForm();
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '删除饮食记录失败' });
        }
    };

    // --- Stats & Derived Data ---

    const totalNutrition = useMemo(() => {
        return dietRecords.reduce(
            (acc, item) => ({
                calories: acc.calories + (item.calories || 0),
                protein: acc.protein + (item.protein || 0),
                fat: acc.fat + (item.fat || 0),
                carbs: acc.carbs + (item.carbs || 0),
            }),
            { calories: 0, protein: 0, fat: 0, carbs: 0 },
        );
    }, [dietRecords]);

    const macroChartData = useMemo(() => {
        const items = [
            { name: '蛋白质', key: 'protein', value: totalNutrition.protein },
            { name: '脂肪', key: 'fat', value: totalNutrition.fat },
            { name: '碳水', key: 'carbs', value: totalNutrition.carbs },
        ];
        return items.filter((item) => item.value > 0);
    }, [totalNutrition]);

    const mealCaloriesData = useMemo(() => {
        return MEAL_SLOTS.map((slot) => {
            const calories = dietRecords
                .filter((item) => item.timeSlot === slot.key)
                .reduce((sum, item) => sum + (item.calories || 0), 0);
            return {
                name: slot.label,
                key: slot.key,
                calories,
            };
        }).filter((item) => item.calories > 0);
    }, [dietRecords]);

    const frequentFoods = useMemo(() => {
        const map = new Map();
        dietRecords.forEach((item) => {
            const key = item.food;
            if (!key) return;
            const current = map.get(key) || 0;
            map.set(key, current + 1);
        });
        return Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [dietRecords]);

    const groupedDiet = useMemo(() => {
        return MEAL_SLOTS.map((slot) => ({
            ...slot,
            items: dietRecords.filter((item) => item.timeSlot === slot.key),
        }));
    }, [dietRecords]);

    const isOverLimit = totalNutrition.calories > DAILY_CALORIES_LIMIT;

    const sortedWeightsByDate = useMemo(
        () => [...weights].sort((a, b) => new Date(a.date) - new Date(b.date)),
        [weights],
    );

    const latestWeightRecord = sortedWeightsByDate.length > 0
        ? sortedWeightsByDate[sortedWeightsByDate.length - 1]
        : null;

    const previousWeightRecord = sortedWeightsByDate.length > 1
        ? sortedWeightsByDate[sortedWeightsByDate.length - 2]
        : null;

    const latestWeight = latestWeightRecord ? latestWeightRecord.weight : 0;
    const previousWeight = previousWeightRecord ? previousWeightRecord.weight : latestWeight;
    const weightDiff = latestWeight - previousWeight;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 max-w-[1600px] mx-auto"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center text-foreground">
                        <Activity className="mr-3 text-primary" size={32} /> 
                        健康管理
                    </h1>
                    <p className="text-muted-foreground mt-2">追踪体重变化与每日饮食摄入</p>
                </div>
            </div>

            {message.text && (
                <Toast
                    type={message.type}
                    message={message.text}
                    onClose={() => setMessage({ type: '', text: '' })}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- Left Column: Inputs (Sticky) --- */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="space-y-6 sticky top-6">
                        {/* Weight Input Card */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="text-base font-semibold mb-4 flex items-center text-card-foreground">
                                <Scale size={18} className="mr-2 text-primary" />
                                记录体重
                            </h2>
                            <form onSubmit={handleAddWeight} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">日期</label>
                                    <DatePicker value={newDate} onChange={setNewDate} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">体重 (kg)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newWeight}
                                            onChange={(e) => setNewWeight(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">备注</label>
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="备注..."
                                        rows="2"
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground py-2 text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center font-medium active:scale-[0.98]"
                                >
                                    <Save size={16} className="mr-2" /> 保存
                                </button>
                            </form>
                        </div>

                        {/* Diet Input Card */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold flex items-center text-card-foreground">
                                    <Utensils size={18} className="mr-2 text-primary" />
                                    记录饮食
                                </h2>
                                {editingDietId && (
                                    <button
                                        type="button"
                                        onClick={resetDietForm}
                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                                    >
                                        <X size={14} className="mr-1" /> 取消编辑
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleDietSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">日期</label>
                                    <DatePicker value={dietDate} onChange={setDietDate} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">餐点</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {MEAL_SLOTS.map((slot) => (
                                            <button
                                                key={slot.key}
                                                type="button"
                                                onClick={() => handleDietChange('timeSlot', slot.key)}
                                                className={`px-1 py-1.5 text-xs rounded-md border transition-all ${
                                                    dietForm.timeSlot === slot.key
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                                                }`}
                                            >
                                                {slot.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">食物</label>
                                    <input
                                        type="text"
                                        value={dietForm.food}
                                        onChange={(e) => handleDietChange('food', e.target.value)}
                                        placeholder="食物名称..."
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                    {/* Quick Select */}
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {frequentFoods.slice(0, 4).map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => handleFoodSelect(FOOD_DATABASE.find(f => f.name === item.name) || { name: item.name, unit: '份', calories: '', protein: '', fat: '', carbs: '' })}
                                                className="px-2 py-0.5 rounded-full border border-dashed border-border text-[10px] text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                                            >
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">份量</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={dietForm.quantity}
                                            onChange={(e) => handleDietChange('quantity', e.target.value)}
                                            placeholder="1"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">单位</label>
                                        <input
                                            type="text"
                                            value={dietForm.unit}
                                            onChange={(e) => handleDietChange('unit', e.target.value)}
                                            placeholder="份/g"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">热量 (kcal)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={dietForm.calories}
                                            onChange={(e) => handleDietChange('calories', e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">蛋白质 (g)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={dietForm.protein}
                                            onChange={(e) => handleDietChange('protein', e.target.value)}
                                            placeholder="选填"
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">备注</label>
                                    <textarea
                                        value={dietForm.note}
                                        onChange={(e) => handleDietChange('note', e.target.value)}
                                        placeholder="选填..."
                                        rows="2"
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">照片</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleDietPhotoChange}
                                        className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
                                    />
                                    {dietForm.photoPreview && (
                                        <div className="mt-2 rounded-lg border border-border overflow-hidden">
                                            <img src={dietForm.photoPreview} alt="Preview" className="w-full h-24 object-cover" />
                                        </div>
                                    )}
                                </div>
                                {dietError && <p className="text-xs text-destructive">{dietError}</p>}
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground py-2 text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center font-medium active:scale-[0.98]"
                                >
                                    <Save size={16} className="mr-2" />
                                    {editingDietId ? '更新记录' : '添加记录'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Dashboard & Data --- */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    
                    {/* 1. Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Weight Card */}
                        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">最新体重</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-foreground">{latestWeight || '--'}</span>
                                    <span className="text-xs text-muted-foreground">kg</span>
                                </div>
                                {weights.length > 1 && (
                                    <div className={`flex items-center text-xs mt-1 ${weightDiff <= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                                        {weightDiff <= 0 ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />}
                                        {Math.abs(weightDiff).toFixed(2)} kg
                                        <span className="text-muted-foreground ml-1">较上一次</span>
                                    </div>
                                )}
                            </div>
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Scale size={20} />
                            </div>
                        </div>

                        {/* Calories Card */}
                        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">今日热量 ({dietDate})</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-bold ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}>
                                        {Math.round(totalNutrition.calories)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/ {DAILY_CALORIES_LIMIT} kcal</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 mt-2 max-w-[120px]">
                                    <div 
                                        className={`h-1.5 rounded-full ${isOverLimit ? 'bg-destructive' : 'bg-primary'}`}
                                        style={{ width: `${Math.min((totalNutrition.calories / DAILY_CALORIES_LIMIT) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="h-10 w-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                                <Activity size={20} />
                            </div>
                        </div>

                        {/* Nutrition Summary Card */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <p className="text-xs font-medium text-muted-foreground mb-2">营养分布</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground">蛋白质</p>
                                    <p className="text-sm font-semibold text-green-600">{Math.round(totalNutrition.protein)}g</p>
                                </div>
                                <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground">脂肪</p>
                                    <p className="text-sm font-semibold text-orange-500">{Math.round(totalNutrition.fat)}g</p>
                                </div>
                                <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground">碳水</p>
                                    <p className="text-sm font-semibold text-blue-500">{Math.round(totalNutrition.carbs)}g</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Meal Calories Bar Chart */}
                         <div className="bg-card border border-border rounded-xl p-5 h-64 flex flex-col">
                            <h3 className="text-sm font-semibold mb-4 text-card-foreground">餐次热量分布</h3>
                            <div className="flex-1 w-full min-h-0">
                                {mealCaloriesData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mealCaloriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                                            <YAxis tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip 
                                                cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                                                contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px'}}
                                            />
                                            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                                                {mealCaloriesData.map((entry) => (
                                                    <Cell key={entry.key} fill={MEAL_COLORS[entry.key] || '#22c55e'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">暂无数据</div>
                                )}
                            </div>
                        </div>

                        {/* Macros Pie Chart */}
                        <div className="bg-card border border-border rounded-xl p-5 h-64 flex flex-col">
                            <h3 className="text-sm font-semibold mb-4 text-card-foreground">三大营养素占比</h3>
                            <div className="flex-1 w-full min-h-0">
                                {macroChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={macroChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={4}
                                            >
                                                {macroChartData.map((entry) => (
                                                    <Cell key={entry.key} fill={MACRO_COLORS[entry.key]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px'}} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">暂无数据</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Records Tabs */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[500px]">
                        <div className="border-b border-border px-6 py-3 flex items-center gap-6">
                            <button
                                onClick={() => setActiveTab('diet')}
                                className={`text-sm font-medium py-2 border-b-2 transition-colors flex items-center ${
                                    activeTab === 'diet' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Utensils size={16} className="mr-2" />
                                饮食记录
                            </button>
                            <button
                                onClick={() => setActiveTab('weight')}
                                className={`text-sm font-medium py-2 border-b-2 transition-colors flex items-center ${
                                    activeTab === 'weight' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <List size={16} className="mr-2" />
                                体重历史
                            </button>
                        </div>

                        <div className="p-0">
                            {activeTab === 'diet' ? (
                                <div className="divide-y divide-border">
                                    {dietLoading ? (
                                        <Loading />
                                    ) : (
                                        <>
                                            {groupedDiet.map((group) => (
                                                <div key={group.key} className="px-6 py-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                                                                style={{ backgroundColor: `${MEAL_COLORS[group.key]}26`, color: MEAL_COLORS[group.key] }}
                                                            >
                                                                {group.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">{group.items.length} 条</span>
                                                        </div>
                                                        {group.items.length > 0 && (
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {Math.round(group.items.reduce((sum, i) => sum + (i.calories || 0), 0))} kcal
                                                            </span>
                                                        )}
                                                    </div>
                                                    {group.items.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground pl-8">暂无记录</p>
                                                    ) : (
                                                        <div className="space-y-2 pl-2">
                                                            {group.items.map((item) => (
                                                                <div key={item.id} className="group flex items-start justify-between gap-3 rounded-lg hover:bg-muted/50 p-2 transition-colors">
                                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                        {item.photo && (
                                                                            <img src={item.photo} alt={item.food} className="w-10 h-10 rounded-md object-cover shrink-0 bg-muted" />
                                                                        )}
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="text-sm font-medium text-foreground">{item.food}</p>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {item.quantity} {item.unit}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                {Math.round(item.calories)} kcal 
                                                                                {item.protein ? ` · P:${item.protein}g` : ''}
                                                                                {item.fat ? ` · F:${item.fat}g` : ''}
                                                                                {item.carbs ? ` · C:${item.carbs}g` : ''}
                                                                            </p>
                                                                            {item.note && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{item.note}</p>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleDietEdit(item)}
                                                                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                                                                        >
                                                                            <Edit3 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDietDelete(item.id)}
                                                                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {dietRecords.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground text-sm">
                                                    暂无今日饮食记录
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
                                            <tr>
                                                <th className="px-6 py-3">日期</th>
                                                <th className="px-6 py-3">体重</th>
                                                <th className="px-6 py-3">备注</th>
                                                <th className="px-6 py-3 text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {weights.map((record) => (
                                                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 text-foreground">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        {record.weight} <span className="text-xs text-muted-foreground font-normal">kg</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                                                        {record.note || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteWeight(record.id)}
                                                            className="text-muted-foreground hover:text-destructive p-2 rounded-full transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {weights.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                                                        暂无体重记录
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Weight;
