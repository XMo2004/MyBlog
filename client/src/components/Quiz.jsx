import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CheckCircle2, XCircle, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = ({ data }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [quizData, setQuizData] = useState(null);

    // Parse JSON data safely
    useEffect(() => {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            
            // Validate structure
            if (!parsed || !parsed.question || !Array.isArray(parsed.options)) {
                throw new Error("Invalid quiz format");
            }
            
            // Normalize options if they are just strings
            const normalizedOptions = parsed.options.map((opt, idx) => {
                if (typeof opt === 'string') {
                    return { id: String(idx), text: opt };
                }
                return opt;
            });

            // Normalize correct answer(s)
            let normalizedCorrect = [];
            if (Array.isArray(parsed.correctAnswers)) {
                normalizedCorrect = parsed.correctAnswers;
            } else if (parsed.correctAnswer) {
                // If correctAnswer is a string (text), find the option id
                // If it's an index or id, use it
                const found = normalizedOptions.find(o => o.text === parsed.correctAnswer || o.id === parsed.correctAnswer);
                if (found) {
                    normalizedCorrect = [found.id];
                } else {
                    // Fallback: assume it's an index if number
                    if (typeof parsed.correctAnswer === 'number') {
                         normalizedCorrect = [String(parsed.correctAnswer)];
                    } else {
                         normalizedCorrect = [parsed.correctAnswer];
                    }
                }
            }

            setQuizData({
                ...parsed,
                options: normalizedOptions,
                correctAnswers: normalizedCorrect,
                isMultiple: parsed.isMultiple || normalizedCorrect.length > 1
            });
            setParseError(null);
        } catch (e) {
            console.error("Quiz parse error:", e);
            setParseError("无法解析测验内容，请检查 JSON 格式。");
        }
    }, [data]);

    if (parseError) {
        return (
            <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
                <span className="text-sm font-medium">{parseError}</span>
            </div>
        );
    }

    if (!quizData) return null;

    const { question, options, correctAnswers, explanation, isMultiple } = quizData;

    const handleOptionClick = (optionId) => {
        if (isSubmitted) return;

        if (isMultiple) {
            setSelectedOptions(prev => 
                prev.includes(optionId) 
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        setShowExplanation(true);
    };

    const handleRetry = () => {
        setSelectedOptions([]);
        setIsSubmitted(false);
        setShowExplanation(false);
    };

    const isCorrect = (optionId) => correctAnswers.includes(optionId);
    const isSelected = (optionId) => selectedOptions.includes(optionId);

    // Calculate result
    const allCorrectSelected = correctAnswers.every(id => selectedOptions.includes(id));
    const noIncorrectSelected = selectedOptions.every(id => correctAnswers.includes(id));
    const isSuccess = allCorrectSelected && noIncorrectSelected && selectedOptions.length === correctAnswers.length;

    return (
        <div className="my-6 p-6 bg-card border border-border rounded-2xl shadow-sm">
            {/* Question */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {question}
                </ReactMarkdown>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {options.map((option) => {
                    let stateClass = "border-border hover:bg-muted/50";
                    let icon = null;

                    if (isSubmitted) {
                        if (isCorrect(option.id)) {
                            stateClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                            icon = <CheckCircle2 className="text-green-500" size={20} />;
                        } else if (isSelected(option.id)) {
                            stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                            icon = <XCircle className="text-red-500" size={20} />;
                        } else {
                            stateClass = "opacity-50";
                        }
                    } else if (isSelected(option.id)) {
                        stateClass = "border-primary bg-primary/5 ring-1 ring-primary";
                    }

                    return (
                        <motion.div
                            key={option.id}
                            whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                            onClick={() => handleOptionClick(option.id)}
                            className={`
                                relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${stateClass}
                            `}
                        >
                            <div className={`
                                flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors
                                ${isSelected(option.id) 
                                    ? 'border-primary bg-primary text-primary-foreground' 
                                    : 'border-muted-foreground/30'
                                }
                            `}>
                                {isSelected(option.id) && <div className="w-2 h-2 bg-current rounded-full" />}
                            </div>
                            
                            <div className="flex-1 prose prose-sm dark:prose-invert max-w-none pointer-events-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({node, ...props}) => <p className="m-0" {...props} />
                                    }}
                                >
                                    {option.text}
                                </ReactMarkdown>
                            </div>

                            {icon}
                        </motion.div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {isMultiple ? '多项选择题' : '单项选择题'}
                </div>
                
                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOptions.length === 0}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium 
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                        提交答案
                    </button>
                ) : (
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                        重试
                    </button>
                )}
            </div>

            {/* Explanation */}
            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 overflow-hidden"
                    >
                        <div className={`p-4 rounded-xl border ${isSuccess ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                <HelpCircle size={18} />
                                <span>解析</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {explanation || '暂无解析'}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Quiz;
