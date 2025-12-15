import React, { useEffect, useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import { InputRule } from '@tiptap/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// 行内公式组件
const InlineMathComponent = ({ node, updateAttributes, deleteNode, editor }) => {
    const [isEditing, setIsEditing] = useState(!node.attrs.latex);
    const [latex, setLatex] = useState(node.attrs.latex || '');
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const renderRef = useRef(null);

    // 同步节点属性变化
    useEffect(() => {
        setLatex(node.attrs.latex || '');
    }, [node.attrs.latex]);

    useEffect(() => {
        if (!isEditing && latex && renderRef.current) {
            try {
                katex.render(latex, renderRef.current, {
                    throwOnError: false,
                    displayMode: false,
                    errorColor: '#ef4444',
                });
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
    }, [latex, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSubmit = () => {
        if (latex.trim()) {
            updateAttributes({ latex: latex.trim() });
            setIsEditing(false);
        } else {
            deleteNode();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            if (!latex.trim()) {
                deleteNode();
            }
        }
    };

    if (isEditing) {
        return (
            <NodeViewWrapper 
                as="span" 
                className="inline-math-editor"
                style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'baseline' }}
            >
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-sm">
                    <span className="text-blue-600 dark:text-blue-400 text-xs">$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={latex}
                        onChange={(e) => setLatex(e.target.value)}
                        onBlur={handleSubmit}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none text-foreground min-w-[100px] font-mono text-sm"
                        placeholder="输入 LaTeX 公式..."
                    />
                    <span className="text-blue-600 dark:text-blue-400 text-xs">$</span>
                </span>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper 
            as="span" 
            className="inline-math-node cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded px-1 transition-colors"
            onClick={() => setIsEditing(true)}
            style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'baseline' }}
        >
            <span 
                ref={renderRef}
                style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    verticalAlign: 'middle',
                }}
            />
            {error && (
                <span className="text-red-500 text-xs ml-1">({error})</span>
            )}
        </NodeViewWrapper>
    );
};

// 块级公式组件
const BlockMathComponent = ({ node, updateAttributes, deleteNode, editor }) => {
    const [isEditing, setIsEditing] = useState(!node.attrs.latex);
    const [latex, setLatex] = useState(node.attrs.latex || '');
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);
    const renderRef = useRef(null);

    // 同步节点属性变化
    useEffect(() => {
        setLatex(node.attrs.latex || '');
    }, [node.attrs.latex]);

    useEffect(() => {
        if (!isEditing && latex && renderRef.current) {
            try {
                katex.render(latex, renderRef.current, {
                    throwOnError: false,
                    displayMode: true,
                    errorColor: '#ef4444',
                });
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
    }, [latex, isEditing]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
            // 自动调整高度
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const handleSubmit = () => {
        if (latex.trim()) {
            updateAttributes({ latex: latex.trim() });
            setIsEditing(false);
        } else {
            deleteNode();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            if (!latex.trim()) {
                deleteNode();
            }
        }
    };

    if (isEditing) {
        return (
            <NodeViewWrapper className="block-math-editor my-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">$$</span>
                        <textarea
                            ref={textareaRef}
                            value={latex}
                            onChange={(e) => {
                                setLatex(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onBlur={handleSubmit}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-sm resize-none"
                            placeholder="输入 LaTeX 公式... (Cmd/Ctrl+Enter 保存，Esc 取消)"
                            rows={1}
                        />
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">$$</span>
                    </div>
                    {latex && (
                        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-blue-100 dark:border-blue-900">
                            <div className="text-xs text-muted-foreground mb-1">预览:</div>
                            <div 
                                ref={renderRef}
                                className="text-center overflow-x-auto"
                            />
                        </div>
                    )}
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper 
            className="block-math-node my-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg p-2 transition-colors"
            onClick={() => setIsEditing(true)}
        >
            <div 
                ref={renderRef}
                className="text-center overflow-x-auto"
            />
            {error && (
                <div className="text-red-500 text-xs text-center mt-2">
                    错误: {error}
                </div>
            )}
        </NodeViewWrapper>
    );
};

// 行内公式扩展
export const InlineMath = Node.create({
    name: 'inlineMath',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '',
                parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.inline-math',
            },
            {
                tag: 'span[data-type="inline-math"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                class: 'inline-math',
                'data-type': 'inline-math',
                'data-latex': node.attrs.latex,
            }),
            node.attrs.latex,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InlineMathComponent);
    },

    addCommands() {
        return {
            setInlineMath: (latex) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { latex },
                });
            },
        };
    },

    addInputRules() {
        return [
            // 匹配 $...$ 语法 (非贪婪匹配，不能跨行)
            new InputRule({
                find: /(?:^|[^$])\$([^$\n]+)\$$/,
                handler: ({ state, range, match }) => {
                    const latex = match[1];
                    if (!latex) return null;
                    
                    const { tr } = state;
                    // 调整 range 以排除开头可能的非 $ 字符
                    const actualStart = match[0].startsWith('$') ? range.from : range.from + 1;
                    
                    tr.replaceWith(actualStart, range.to, this.type.create({ latex }));
                    return tr;
                },
            }),
        ];
    },

    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const latex = node.attrs.latex || '';
                    state.write(`$${latex}$`);
                },
                parse: {
                    // 在 markdown 解析时识别 $ ... $ 语法
                    setup(markdownit) {
                        const dollarRegex = /\$([^$\n]+?)\$/;
                        
                        markdownit.inline.ruler.before('escape', 'inline_math', (state, silent) => {
                            if (state.src[state.pos] !== '$') return false;
                            
                            const match = state.src.slice(state.pos).match(dollarRegex);
                            if (!match) return false;
                            
                            if (!silent) {
                                const token = state.push('inline_math', 'span', 0);
                                token.content = match[1];
                                token.markup = '$';
                            }
                            
                            state.pos += match[0].length;
                            return true;
                        });

                        markdownit.renderer.rules.inline_math = (tokens, idx) => {
                            const latex = tokens[idx].content;
                            return `<span class="inline-math" data-type="inline-math" data-latex="${latex}">${latex}</span>`;
                        };
                    },
                },
            },
        };
    },
});

// 块级公式扩展
export const BlockMath = Node.create({
    name: 'blockMath',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            latex: {
                default: '',
                parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div.block-math',
            },
            {
                tag: 'div[data-type="block-math"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                class: 'block-math',
                'data-type': 'block-math',
                'data-latex': node.attrs.latex,
            }),
            node.attrs.latex,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(BlockMathComponent);
    },

    addCommands() {
        return {
            setBlockMath: (latex) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { latex },
                });
            },
        };
    },

    addInputRules() {
        return [
            // 匹配 $$...$$ 语法 (在新行开始时)
            new InputRule({
                find: /^\$\$(.+)\$\$$/,
                handler: ({ state, range, match }) => {
                    const latex = match[1];
                    if (!latex) return null;
                    
                    const { tr } = state;
                    tr.replaceWith(range.from, range.to, this.type.create({ latex }));
                    return tr;
                },
            }),
        ];
    },

    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const latex = node.attrs.latex || '';
                    state.write(`$$${latex}$$\n\n`);
                },
                parse: {
                    // 在 markdown 解析时识别 $$ ... $$ 语法
                    setup(markdownit) {
                        markdownit.block.ruler.before('fence', 'block_math', (state, startLine, endLine, silent) => {
                            const start = state.bMarks[startLine] + state.tShift[startLine];
                            const max = state.eMarks[startLine];
                            
                            // 检查是否以 $$ 开头
                            if (state.src.slice(start, start + 2) !== '$$') return false;
                            
                            let pos = start + 2;
                            let nextLine = startLine;
                            let content = '';
                            let foundEnd = false;
                            
                            // 查找结束的 $$
                            while (nextLine < endLine) {
                                const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
                                const lineEnd = state.eMarks[nextLine];
                                const line = state.src.slice(lineStart, lineEnd);
                                
                                if (nextLine === startLine) {
                                    // 第一行,检查是否在同一行结束
                                    const firstLine = state.src.slice(pos, lineEnd);
                                    const endMatch = firstLine.match(/^(.*?)\$\$/);
                                    if (endMatch) {
                                        content = endMatch[1];
                                        foundEnd = true;
                                        break;
                                    } else {
                                        content = firstLine + '\n';
                                    }
                                } else {
                                    // 后续行
                                    if (line.includes('$$')) {
                                        const endIdx = line.indexOf('$$');
                                        content += line.slice(0, endIdx);
                                        foundEnd = true;
                                        break;
                                    } else {
                                        content += line + '\n';
                                    }
                                }
                                
                                nextLine++;
                            }
                            
                            if (!foundEnd) return false;
                            
                            if (!silent) {
                                const token = state.push('block_math', 'div', 0);
                                token.content = content.trim();
                                token.markup = '$$';
                                token.block = true;
                                token.map = [startLine, nextLine + 1];
                            }
                            
                            state.line = nextLine + 1;
                            return true;
                        });

                        markdownit.renderer.rules.block_math = (tokens, idx) => {
                            const latex = tokens[idx].content;
                            return `<div class="block-math" data-type="block-math" data-latex="${latex}">${latex}</div>`;
                        };
                    },
                },
            },
        };
    },
});
