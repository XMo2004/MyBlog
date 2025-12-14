import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';

const AnnotationDialog = ({ isOpen, onClose, onConfirm, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value.trim());
    onClose();
  };

  const handleDelete = () => {
    onConfirm('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">添加批注</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="annotation-input" className="block text-sm font-medium text-muted-foreground mb-3">
              请输入批注内容
            </label>
            <textarea
              ref={inputRef}
              id="annotation-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="为选中的文本添加解释或说明..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl 
                       text-foreground placeholder:text-muted-foreground/50
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                       resize-none transition-all"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              鼠标悬停在标注文本上时，会显示这段批注内容
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
            <div className="flex gap-2">
              {initialValue && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg text-sm font-medium
                           text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30
                           transition-all border border-red-200 dark:border-red-900/30"
                >
                  删除
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium 
                         text-muted-foreground hover:text-foreground
                         hover:bg-muted transition-all"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium
                         bg-primary text-primary-foreground
                         hover:bg-primary/90
                         transition-all shadow-sm hover:shadow"
              >
                确定
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnotationDialog;
