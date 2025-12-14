import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export const ThemeToggle = ({ theme, toggleTheme }) => {
    return (
        <motion.button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
            <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {theme === 'dark' ? (
                    <Sun size={18} />
                ) : (
                    <Moon size={18} />
                )}
            </motion.div>
        </motion.button>
    )
}
