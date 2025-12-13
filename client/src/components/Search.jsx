import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Search = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Sync with URL
    useEffect(() => {
        const query = searchParams.get('search') || '';
        if (query) {
            setSearchTerm(query);
            setIsOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (isOpen && !searchParams.get('search')) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const toggleSearch = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div ref={containerRef} className="relative flex items-center">
            <AnimatePresence>
                {isOpen && (
                    <motion.form
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 120, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                            mass: 1
                        }}
                        onSubmit={handleSearch}
                        className="overflow-hidden mr-2"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索全站..."
                            className="w-full bg-muted/50 border border-border rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </motion.form>
                )}
            </AnimatePresence>
            
            <motion.button
                onClick={toggleSearch}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative"
                aria-label={isOpen ? "关闭搜索" : "搜索"}
                whileTap={{ scale: 0.9 }}
                layout
            >
                <motion.div
                    initial={false}
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {isOpen ? <X size={18} /> : <SearchIcon size={18} />}
                </motion.div>
            </motion.button>
        </div>
    );
};
