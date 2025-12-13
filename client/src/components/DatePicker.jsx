import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DatePicker = ({ value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef(null);

    // Initialize currentMonth based on value if provided
    useEffect(() => {
        if (value) {
            setCurrentMonth(parseISO(value));
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const onDateClick = (day) => {
        onChange(format(day, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={(e) => { e.preventDefault(); prevMonth(); }}
                    className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-foreground">
                    {format(currentMonth, 'yyyy年MM月')}
                </span>
                <button
                    onClick={(e) => { e.preventDefault(); nextMonth(); }}
                    className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    };

    const renderWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="w-8 text-center text-xs font-medium text-muted-foreground" key={i}>
                    {['日', '一', '二', '三', '四', '五', '六'][i]}
                </div>
            );
        }
        return <div className="flex justify-between mb-2">{days}</div>;
    };

    const renderCalendarGrid = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        
        const days = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        const weeks = [];
        let week = [];

        days.forEach((day) => {
            week.push(day);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        });

        const selectedDate = value ? parseISO(value) : null;

        return (
            <div className="flex flex-col gap-1">
                {weeks.map((week, i) => (
                    <div key={i} className="flex justify-between">
                        {week.map((day, j) => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onDateClick(day);
                                    }}
                                    className={`
                                        w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-all
                                        ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                                        ${isSelected 
                                            ? "bg-primary text-primary-foreground shadow-md font-medium" 
                                            : "hover:bg-secondary"
                                        }
                                        ${isToday && !isSelected ? "border border-primary text-primary" : ""}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div 
                className="relative cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
                <div className={`
                    w-full bg-background border rounded-lg pl-10 pr-3 py-2 text-foreground transition-all
                    ${isOpen ? 'ring-2 ring-primary border-transparent' : 'border-input group-hover:border-primary/50'}
                `}>
                    {value || <span className="text-muted-foreground">选择日期</span>}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 mt-2 p-4 bg-card border border-border rounded-xl shadow-xl w-[280px]"
                    >
                        {renderHeader()}
                        {renderWeekDays()}
                        {renderCalendarGrid()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatePicker;
