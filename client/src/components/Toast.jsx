import React, { useEffect } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message && duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-card border border-border min-w-[300px] max-w-[400px]"
        >
          <div className={`p-2 rounded-full shrink-0 ${
            type === 'success' ? 'bg-green-500/10 text-green-500' : 
            type === 'error' ? 'bg-destructive/10 text-destructive' :
            'bg-blue-500/10 text-blue-500'
          }`}>
            {type === 'success' ? <CheckCircle size={20} /> : 
             type === 'error' ? <AlertCircle size={20} /> :
             <Info size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium wrap-break-word">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="关闭通知"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast
