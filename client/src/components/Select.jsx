import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({ options = [], value, onChange, placeholder = "Select...", className = "", triggerClassName = "", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => {
        const optVal = typeof opt === 'object' ? opt.value : opt;
        return optVal === value;
    });
    
    const displayValue = selectedOption 
        ? (typeof selectedOption === 'object' ? (selectedOption.label || selectedOption.value) : selectedOption) 
        : placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 bg-background border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                    isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${triggerClassName}`}
                disabled={disabled}
            >
                <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {displayValue}
                </span>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                    >
                        <div className="p-1">
                            {options.map((option, index) => {
                                const optValue = typeof option === 'object' ? option.value : option;
                                const optLabel = typeof option === 'object' ? (option.label || option.value) : option;
                                const isSelected = optValue === value;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            onChange(optValue);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                                            isSelected 
                                                ? 'bg-primary/10 text-primary font-medium' 
                                                : 'text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <span className="truncate">{optLabel}</span>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                );
                            })}
                            {options.length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                    No options
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Select;
