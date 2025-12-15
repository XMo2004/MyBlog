import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Text from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import HardBreak from '@tiptap/extension-hard-break';
import Paragraph from '@tiptap/extension-paragraph';
import { 
    Bold, Italic, Underline as UnderlineIcon, 
    Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Undo, Redo,
    Type, Palette, Highlighter, RemoveFormatting,
    AlignLeft, AlignCenter, AlignRight, Ghost, X,
    Info, AlertTriangle, XCircle, CheckCircle2, Lightbulb,
    Image as ImageIcon, MessageSquare, GitBranch, ListChecks
} from 'lucide-react';
import AnnotationDialog from './AnnotationDialog';
import MindMapDialog from './MindMapDialog';
import QuizDialog from './QuizDialog';
import MindMap from './MindMap';
import Quiz from './Quiz';

// 防抖 Hook
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);
    
    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    
    return debouncedCallback;
};

const MACARON_COLORS = [
    { name: '蜜桃粉', value: 'var(--rt-highlight-peach)' },
    { name: '清新橙', value: 'var(--rt-highlight-orange)' },
    { name: '柠檬黄', value: 'var(--rt-highlight-lemon)' },
    { name: '薄荷绿', value: 'var(--rt-highlight-mint)' },
    { name: '冰川蓝', value: 'var(--rt-highlight-blue)' },
    { name: '香芋紫', value: 'var(--rt-highlight-purple)' },
];

const TEXT_COLORS = [
    { name: '默认', value: 'var(--rt-text-default)' },
    { name: '次要', value: 'var(--rt-text-secondary)' },
    { name: '提示灰', value: 'var(--rt-text-muted)' },
    { name: '主题蓝', value: 'var(--rt-text-blue)' },
    { name: '强调红', value: 'var(--rt-text-red)' },
    { name: '成功绿', value: 'var(--rt-text-green)' },
    { name: '活力橙', value: 'var(--rt-text-orange)' },
    { name: '柔和紫', value: 'var(--rt-text-purple)' },
];

const normalizeMathBackslashes = (markdown) => {
    if (!markdown) return markdown;
    const fix = (content) => content.replace(/\\\\([A-Za-z])/g, '\\$1');
    let result = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, p1) => `$$${fix(p1)}$$`);
    result = result.replace(/\$([^$\n]*?)\$/g, (match, p1) => `$${fix(p1)}$`);
    return result;
};

const useIsDarkTheme = () => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('light') ? false : true;
            setIsDark(isDarkMode);
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

const CALLOUT_TYPES = {
    info: {
        color: '#60A5FA', // Blue 400
        bgColor: '#EFF6FF', // Blue 50
        borderColor: '#BFDBFE', // Blue 200
        darkBgColor: 'rgba(59, 130, 246, 0.12)',
        darkBorderColor: 'rgba(59, 130, 246, 0.5)',
        icon: Info,
        label: '信息',
    },
    warning: {
        color: '#F59E0B', // Amber 500
        bgColor: '#FFFBEB', // Amber 50
        borderColor: '#FDE68A', // Amber 200
        darkBgColor: 'rgba(245, 158, 11, 0.12)',
        darkBorderColor: 'rgba(245, 158, 11, 0.5)',
        icon: AlertTriangle,
        label: '注意',
    },
    error: {
        color: '#EF4444', // Red 500
        bgColor: '#FEF2F2', // Red 50
        borderColor: '#FECACA', // Red 200
        darkBgColor: 'rgba(239, 68, 68, 0.12)',
        darkBorderColor: 'rgba(239, 68, 68, 0.5)',
        icon: XCircle,
        label: '警告',
    },
    success: {
        color: '#10B981', // Emerald 500
        bgColor: '#ECFDF5', // Emerald 50
        borderColor: '#A7F3D0', // Emerald 200
        darkBgColor: 'rgba(16, 185, 129, 0.12)',
        darkBorderColor: 'rgba(16, 185, 129, 0.5)',
        icon: CheckCircle2,
        label: '成功',
    },
    tip: {
        color: '#8B5CF6', // Violet 500
        bgColor: '#F5F3FF', // Violet 50
        borderColor: '#DDD6FE', // Violet 200
        darkBgColor: 'rgba(139, 92, 246, 0.12)',
        darkBorderColor: 'rgba(139, 92, 246, 0.5)',
        icon: Lightbulb,
        label: '提示',
    }
};

// Callout Component
const CalloutComponent = ({ node, updateAttributes, extension }) => {
    const isDark = useIsDarkTheme();
    const { type } = node.attrs;
    const config = CALLOUT_TYPES[type] || CALLOUT_TYPES.info;
    const Icon = config.icon;

    return (
        <NodeViewWrapper className="my-4">
            <div 
                className={`flex gap-3 p-4 rounded-xl border transition-all duration-200 text-foreground`}
                style={{
                    backgroundColor: isDark ? (config.darkBgColor || config.bgColor) : config.bgColor,
                    borderColor: isDark ? (config.darkBorderColor || config.borderColor) : config.borderColor,
                }}
            >
                <div 
                    className="shrink-0 mt-0.5 select-none"
                    contentEditable={false}
                    style={{ color: config.color }}
                >
                    <Icon size={20} />
                </div>
                <div className="grow min-w-0">
                    <NodeViewContent className="outline-none" />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

// Callout Extension
const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    draggable: true,

    addAttributes() {
        return {
            type: {
                default: 'info',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="callout"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutComponent)
    },
    
    addCommands() {
        return {
            setCallout: (attributes) => ({ commands }) => {
                return commands.wrapIn(this.name, attributes)
            },
            toggleCallout: (attributes) => ({ commands }) => {
                return commands.toggleWrap(this.name, attributes)
            },
            unsetCallout: () => ({ commands }) => {
                return commands.lift(this.name)
            },
        }
    },
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const type = node.attrs.type || 'info';
                    state.write(`:::${type}\n`);
                    state.renderContent(node);
                    state.write('\n:::\n');
                },
                parse: {
                    setup(md) {
                        md.block.ruler.before('fence', 'callout', (state, startLine, endLine, silent) => {
                            const start = state.bMarks[startLine] + state.tShift[startLine];
                            const max = state.eMarks[startLine];
                            const marker = state.src.slice(start, start + 3);
                            if (marker !== ':::') return false;

                            let pos = start + 3;
                            while (pos < max && state.src.charCodeAt(pos) === 32) {
                                pos += 1;
                            }
                            const type = state.src.slice(pos, max).trim() || 'info';
                            if (!['info', 'warning', 'error', 'success', 'tip'].includes(type)) {
                                return false;
                            }

                            let nextLine = startLine;
                            for (;;) {
                                nextLine += 1;
                                if (nextLine >= endLine) break;
                                const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
                                const lineMax = state.eMarks[nextLine];
                                if (lineStart < lineMax && state.src.slice(lineStart, lineStart + 3) === ':::') {
                                    break;
                                }
                            }

                            if (silent) {
                                return true;
                            }

                            const tokenOpen = state.push('callout_open', 'div', 1);
                            tokenOpen.block = true;
                            tokenOpen.attrs = [
                                ['data-type', 'callout'],
                                ['data-callout-type', type],
                            ];
                            tokenOpen.map = [startLine, nextLine];

                            state.md.block.tokenize(state, startLine + 1, nextLine);

                            const tokenClose = state.push('callout_close', 'div', -1);
                            tokenClose.block = true;

                            state.line = nextLine + 1;
                            return true;
                        });
                    }
                }
            }
        }
    },
});

// MindMap Node View Component
const MindMapNodeView = ({ node, updateAttributes }) => {
    return (
        <NodeViewWrapper className="my-4">
            <MindMap
                data={node.attrs.data}
                onDataChange={(newData) => updateAttributes({ data: newData })}
                readOnly={false}
            />
        </NodeViewWrapper>
    );
};

// MindMap Extension
const MindMapNode = Node.create({
    name: 'mindmap',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            data: {
                default: JSON.stringify({ id: 'root', text: '思维导图', children: [] }),
                parseHTML: element => element.getAttribute('data-mindmap'),
                renderHTML: attributes => {
                    return { 'data-mindmap': attributes.data };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="mindmap"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mindmap' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MindMapNodeView);
    },

    addCommands() {
        return {
            insertMindMap: (data) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { data },
                });
            },
        };
    },

    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const data = node.attrs.data || '{}';
                    state.write(`\n\`\`\`mindmap\n${data}\n\`\`\`\n`);
                },
            },
        };
    },
});

// Quiz Node View Component
const QuizNodeView = ({ node }) => {
    return (
        <NodeViewWrapper className="my-4">
            <Quiz data={node.attrs.data} />
        </NodeViewWrapper>
    );
};

// Quiz Extension
const QuizNode = Node.create({
    name: 'quiz',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            data: {
                default: JSON.stringify({
                    question: '问题',
                    options: [],
                    correctAnswers: [],
                    explanation: '',
                    isMultiple: false,
                    shuffle: true
                }),
                parseHTML: element => element.getAttribute('data-quiz'),
                renderHTML: attributes => {
                    return { 'data-quiz': attributes.data };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="quiz"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'quiz' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(QuizNodeView);
    },

    addCommands() {
        return {
            insertQuiz: (data) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { data },
                });
            },
        };
    },

    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const data = node.attrs.data || '{}';
                    state.write(`\n\`\`\`quiz\n${data}\n\`\`\`\n`);
                },
            },
        };
    },
});

// Annotation Mark Extension
const Annotation = Mark.create({
  name: 'annotation',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'annotation',
      },
    }
  },

  addAttributes() {
    return {
      explanation: {
        default: '',
        parseHTML: element => element.getAttribute('data-explanation'),
        renderHTML: attributes => {
          if (!attributes.explanation) {
            return {}
          }
          return {
            'data-explanation': attributes.explanation,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-explanation]',
        getAttrs: element => ({
          explanation: element.getAttribute('data-explanation'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setAnnotation: (explanation) => ({ commands }) => {
        return commands.setMark(this.name, { explanation })
      },
      toggleAnnotation: (explanation) => ({ commands }) => {
        return commands.toggleMark(this.name, { explanation })
      },
      unsetAnnotation: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open(state, mark) {
            const explanation = mark.attrs.explanation || ''
            return `<span class="annotation" data-explanation="${explanation.replace(/"/g, '&quot;')}">`
          },
          close() {
            return '</span>'
          },
          mixable: true,
        },
      }
    }
  },
});

// Custom Spoiler Extension
const Spoiler = Mark.create({
  name: 'spoiler',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'spoiler',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => element.classList.contains('spoiler') && null,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }) => commands.toggleMark(this.name),
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: ':spoiler[',
          close: ']',
          expelEnclosingWhitespace: true,
        },
        parse: {
          setup(md) {
            md.inline.ruler.push('spoiler', (state, silent) => {
              if (!state.src.startsWith(':spoiler[', state.pos)) return false;

              let depth = 1;
              let pos = state.pos + 9;
              while (pos < state.posMax) {
                if (state.src[pos] === '[') depth++;
                if (state.src[pos] === ']') depth--;
                if (depth === 0) break;
                pos++;
              }

              if (depth !== 0) return false;

              if (!silent) {
                const openToken = state.push('spoiler_open', 'span', 1);
                openToken.attrs = [['class', 'spoiler']];

                const content = state.src.slice(state.pos + 9, pos);
                const textToken = state.push('text', '', 0);
                textToken.content = content;

                state.push('spoiler_close', 'span', -1);
              }

              state.pos = pos + 1;
              return true;
            });
          }
        }
      }
    }
  }
});

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
});

// Custom Text extension to preserve non-breaking spaces in Markdown
const CustomText = Text.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const parts = node.text.split('\u00A0');
                    parts.forEach((part, index) => {
                        if (part) state.text(part);
                        if (index < parts.length - 1) state.write('&nbsp;');
                    });
                },
            },
        };
    },
});

// Custom HardBreak extension to use two spaces instead of backslash
const CustomHardBreak = HardBreak.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state, node, parent, index) {
                    state.write('  \n')
                },
                parse: {
                    // handled by markdown-it
                }
            }
        }
    }
});

const MarkdownParagraph = Paragraph.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    if (!node.content || node.content.size === 0) {
                        state.write('&nbsp;');
                        state.closeBlock(node);
                        return;
                    }
                    state.renderInline(node);
                    state.closeBlock(node);
                },
            },
        };
    },
});

const ImageComponent = ({ node, updateAttributes, selected }) => {
    const { src, alt, width, textAlign } = node.attrs;
    const [imageError, setImageError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    const displayWidth = typeof width === 'number' && width > 0 && width <= 100 ? width : 100;
    
    // 计算对齐样式
    const getAlignmentStyle = () => {
        switch (textAlign) {
            case 'left':
                return { marginLeft: 0, marginRight: 'auto' };
            case 'right':
                return { marginLeft: 'auto', marginRight: 0 };
            case 'center':
            default:
                return { marginLeft: 'auto', marginRight: 'auto' };
        }
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    return (
        <NodeViewWrapper className="my-4">
            <div
                className={`relative transition-all duration-200 ${
                    selected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background rounded-lg' : ''
                }`}
                contentEditable={false}
                style={{
                    width: `${displayWidth}%`,
                    maxWidth: '100%',
                    display: 'block',
                    ...getAlignmentStyle(),
                }}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {imageError ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
                        <ImageIcon size={32} className="text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">图片加载失败</span>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={alt || ''}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ width: '100%', height: 'auto', opacity: isLoading ? 0 : 1 }}
                        className="rounded-lg shadow-sm block transition-opacity duration-200"
                        draggable={false}
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
};

const ImageNode = Node.create({
    name: 'image',
    group: 'block',
    draggable: true,
    selectable: true,
    atom: true,
    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: element => element.getAttribute('src') || element.getAttribute('data-src'),
            },
            alt: {
                default: null,
                parseHTML: element => element.getAttribute('alt') || '',
            },
            title: {
                default: null,
                parseHTML: element => element.getAttribute('title'),
            },
            width: {
                default: 100,
                parseHTML: element => {
                    // 从 style 或 data-width 解析宽度
                    const dataWidth = element.getAttribute('data-width');
                    if (dataWidth) return parseInt(dataWidth, 10) || 100;
                    
                    const style = element.getAttribute('style') || '';
                    const widthMatch = style.match(/width:\s*(\d+)%/);
                    if (widthMatch) return parseInt(widthMatch[1], 10);
                    
                    const attrWidth = element.getAttribute('width');
                    if (attrWidth) return parseInt(attrWidth, 10) || 100;
                    
                    return 100;
                },
            },
            textAlign: {
                default: 'center',
                parseHTML: element => {
                    // 从 data-align 或 style 解析对齐
                    const dataAlign = element.getAttribute('data-align');
                    if (dataAlign && ['left', 'center', 'right'].includes(dataAlign)) {
                        return dataAlign;
                    }
                    
                    const style = element.getAttribute('style') || '';
                    if (style.includes('margin-right: 0') || style.includes('margin-right:0')) {
                        return 'right';
                    }
                    if (style.includes('margin-left: 0;') && !style.includes('margin-right: 0')) {
                        return 'left';
                    }
                    return 'center';
                },
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const { src, alt, title, width, textAlign } = HTMLAttributes;
        const style = `width: ${width || 100}%`;
        return ['img', mergeAttributes({ src, alt, title, style, 'data-align': textAlign, 'data-width': width }, { draggable: 'false' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageComponent);
    },
    addCommands() {
        return {
            setImage:
                (options) =>
                ({ commands }) => {
                    if (!options || !options.src) return false;
                    const width = typeof options.width === 'number' 
                        ? Math.max(10, Math.min(100, options.width))
                        : typeof options.width === 'string'
                            ? Math.max(10, Math.min(100, parseInt(options.width, 10) || 100))
                            : 100;
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            src: options.src,
                            alt: options.alt || '',
                            title: options.title || null,
                            width,
                            textAlign: options.textAlign || 'center',
                        },
                    });
                },
            updateImageAttributes:
                (attributes) =>
                ({ commands, state }) => {
                    const { selection } = state;
                    const node = state.doc.nodeAt(selection.from);
                    if (node?.type.name === 'image') {
                        return commands.updateAttributes('image', attributes);
                    }
                    return false;
                },
        };
    },
    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const src = node.attrs.src || '';
                    const alt = (node.attrs.alt || '').replace(/"/g, '&quot;');
                    const width = node.attrs.width || 100;
                    const textAlign = node.attrs.textAlign || 'center';
                    
                    // 简化的输出格式：使用 data 属性存储信息
                    // 这样源码更简洁易读
                    if (width === 100 && textAlign === 'center') {
                        // 默认情况，使用标准 Markdown
                        state.write(`![${alt}](${src})`);
                    } else {
                        // 非默认情况，使用简洁的 HTML 格式
                        state.write(`<img src="${src}" alt="${alt}" data-width="${width}" data-align="${textAlign}" />`);
                    }
                },
            },
        };
    },
});

const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
        onClick={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-all duration-200 ${
            isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={title}
        type="button"
    >
        {children}
    </button>
);

const ToolbarGroup = ({ children, className = "" }) => (
    <div className={`flex items-center gap-0.5 px-2 py-1 bg-muted/30 rounded-lg border border-border/50 ${className}`}>
        {children}
    </div>
);

const MenuBar = ({ editor, onOpenAnnotation, onOpenMindMap, onOpenQuiz }) => {
    if (!editor) {
        return null;
    }

    // 安全的字体切换处理
    const handleFontChange = (event) => {
        const value = event.target.value;
        try {
            if (value) {
                editor.chain().focus().setFontFamily(value).run();
            } else {
                editor.chain().focus().unsetFontFamily().run();
            }
        } catch (error) {
            console.error('Font change error:', error);
        }
    };

    // 安全的颜色切换
    const handleColorChange = (colorValue) => {
        try {
            if (editor.isActive('textStyle', { color: colorValue })) {
                editor.chain().focus().unsetColor().run();
            } else {
                editor.chain().focus().setColor(colorValue).run();
            }
        } catch (error) {
            console.error('Color change error:', error);
        }
    };

    // 安全的高亮切换
    const handleHighlightChange = (colorValue) => {
        try {
            if (editor.isActive('highlight', { color: colorValue })) {
                editor.chain().focus().unsetHighlight().run();
            } else {
                editor.chain().focus().setHighlight({ color: colorValue }).run();
            }
        } catch (error) {
            console.error('Highlight change error:', error);
        }
    };

    // 获取当前字体
    const getCurrentFont = () => {
        try {
            return editor.getAttributes('textStyle')?.fontFamily || '';
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20 transition-all">
            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="粗体"
                >
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="斜体"
                >
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="下划线"
                >
                    <UnderlineIcon size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="删除线"
                >
                    <Strikethrough size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="行内代码"
                >
                    <Code size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => {
                        if (onOpenAnnotation) {
                            const currentAttrs = editor.getAttributes('annotation');
                            onOpenAnnotation(currentAttrs?.explanation || '');
                        }
                    }}
                    isActive={editor.isActive('annotation')}
                    title="添加或修改批注"
                >
                    <MessageSquare size={16} />
                </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="左对齐"
                >
                    <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="居中对齐"
                >
                    <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="右对齐"
                >
                    <AlignRight size={16} />
                </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="标题 1"
                >
                    <Heading1 size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="标题 2"
                >
                    <Heading2 size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="标题 3"
                >
                    <Heading3 size={16} />
                </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                 <div className="flex gap-1 items-center px-1">
                    {TEXT_COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={(e) => {
                                e.preventDefault();
                                handleColorChange(color.value);
                            }}
                            className={`w-4 h-4 rounded-full border border-border/50 flex items-center justify-center transition-transform hover:scale-110 ${
                                editor.isActive('textStyle', { color: color.value })
                                ? 'ring-2 ring-offset-1 ring-primary'
                                : ''
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            type="button"
                        />
                    ))}
                    <div className="w-px h-4 bg-border/50 mx-1" />
                    <select
                        onChange={handleFontChange}
                        value={getCurrentFont()}
                        className="h-6 text-xs bg-transparent border-none outline-none max-w-[80px] text-muted-foreground hover:text-foreground cursor-pointer"
                        title="字体"
                    >
                        <option value="">默认字体</option>
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'SimSun','宋体',serif">宋体</option>
                        <option value="'SimHei','黑体','Microsoft YaHei','微软雅黑',sans-serif">黑体/雅黑</option>
                        <option value="'KaiTi','STKaiti','楷体','华文楷体',serif">楷体</option>
                        <option value="'FangSong','STFangsong','仿宋','华文仿宋',serif">仿宋</option>
                        <option value="'LXGW WenKai','霞鹜文楷','KaiTi','楷体',cursive">手写体</option>
                    </select>
                </div>
            </ToolbarGroup>

            <ToolbarGroup>
                 <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="高亮"
                >
                    <Highlighter size={16} />
                </ToolbarButton>
                <div className="flex gap-1 items-center px-1">
                    {MACARON_COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={(e) => {
                                e.preventDefault();
                                handleHighlightChange(color.value);
                            }}
                            className={`w-3 h-3 rounded-full border border-border/50 transition-transform hover:scale-125 ${
                                editor.isActive('highlight', { color: color.value }) 
                                ? 'ring-2 ring-offset-1 ring-primary' 
                                : ''
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            type="button"
                        />
                    ))}
                </div>
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="无序列表"
                >
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="有序列表"
                >
                    <ListOrdered size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="引用"
                >
                    <Quote size={16} />
                </ToolbarButton>
                 <ToolbarButton
                    onClick={() => editor.chain().focus().toggleSpoiler().run()}
                    isActive={editor.isActive('spoiler')}
                    title="防剧透 (Spoiler)"
                >
                    <Ghost size={16} />
                </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                 {Object.entries(CALLOUT_TYPES).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                        <ToolbarButton
                            key={type}
                            onClick={() => {
                                if (editor.isActive('callout')) {
                                    if (editor.isActive('callout', { type })) {
                                        editor.chain().focus().unsetCallout().run();
                                    } else {
                                        editor.chain().focus().updateAttributes('callout', { type }).run();
                                    }
                                } else {
                                    editor.chain().focus().setCallout({ type }).run();
                                }
                            }}
                            isActive={editor.isActive('callout', { type })}
                            title={`插入${config.label}块`}
                        >
                            <Icon size={16} style={{ color: config.color }} />
                        </ToolbarButton>
                    )
                })}
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => onOpenMindMap && onOpenMindMap()}
                    title="插入思维导图"
                >
                    <GitBranch size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => onOpenQuiz && onOpenQuiz()}
                    title="插入选择题"
                >
                    <ListChecks size={16} />
                </ToolbarButton>
            </ToolbarGroup>

            <div className="flex-1" />

             <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                    title="清除格式"
                >
                    <RemoveFormatting size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="撤销"
                >
                    <Undo size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="重做"
                >
                    <Redo size={16} />
                </ToolbarButton>
            </ToolbarGroup>
        </div>
    );
};

const ImageBubbleMenuContent = ({ editor }) => {
    const [attributes, setAttributes] = useState(() => {
        try {
            return editor.getAttributes('image') || {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const updateAttributes = () => {
            try {
                if (editor.isActive('image')) {
                    setAttributes(editor.getAttributes('image') || {});
                }
            } catch (error) {
                console.error('Error updating image attributes:', error);
            }
        };
        
        editor.on('selectionUpdate', updateAttributes);
        editor.on('transaction', updateAttributes);
        
        return () => {
            editor.off('selectionUpdate', updateAttributes);
            editor.off('transaction', updateAttributes);
        };
    }, [editor]);
    
    if (!editor.isActive('image')) return null;

    const handleAltChange = (e) => {
        try {
            const newAlt = e.target.value;
            editor.chain().updateAttributes('image', { alt: newAlt }).run();
        } catch (error) {
            console.error('Error updating alt:', error);
        }
    };
    
    const handleWidthChange = (e) => {
        try {
            const newWidth = Math.max(10, Math.min(100, parseInt(e.target.value, 10) || 100));
            editor.chain().updateAttributes('image', { width: newWidth }).run();
        } catch (error) {
            console.error('Error updating width:', error);
        }
    };

    const handleAlignChange = (align) => {
        try {
            editor.chain().updateAttributes('image', { textAlign: align }).run();
        } catch (error) {
            console.error('Error updating alignment:', error);
        }
    };

    const displayWidth = typeof attributes.width === 'number' && attributes.width > 0 ? attributes.width : 100;
    const currentAlign = attributes.textAlign || 'center';

    const alignOptions = [
        { value: 'left', icon: AlignLeft, label: '左对齐' },
        { value: 'center', icon: AlignCenter, label: '居中' },
        { value: 'right', icon: AlignRight, label: '右对齐' },
    ];

    return (
        <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-popover shadow-xl text-popover-foreground animate-in fade-in zoom-in-95 w-80">
            {/* 图片描述输入 */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">描述文字</label>
                <input
                    type="text"
                    value={attributes.alt || ''}
                    onChange={handleAltChange}
                    placeholder="添加图片描述 (用于辅助功能)..."
                    className="text-xs w-full bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
            </div>

            {/* 对齐方式 */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">对齐方式</label>
                <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
                    {alignOptions.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => handleAlignChange(value)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs transition-all ${
                                currentAlign === value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                            title={label}
                            type="button"
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </div>

            {/* 尺寸调整 */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">尺寸调整</label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={displayWidth}
                        onChange={handleWidthChange}
                        className="flex-1 accent-primary h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="w-10 text-right text-xs font-mono text-muted-foreground">{displayWidth}%</span>
                </div>
                {/* 快捷尺寸按钮 */}
                <div className="flex gap-1 mt-1">
                    {[25, 50, 75, 100].map((size) => (
                        <button
                            key={size}
                            onClick={() => handleWidthChange({ target: { value: size } })}
                            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                displayWidth === size
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                            type="button"
                        >
                            {size}%
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RichTextEditor = ({ content, onChange, className = '', editorClassName = '', variant = 'default' }) => {
    const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState('');
    const [isMindMapDialogOpen, setIsMindMapDialogOpen] = useState(false);
    const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
    const [editorError, setEditorError] = useState(null);
    const onChangeRef = useRef(onChange);
    
    // 保持 onChange 引用最新
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    
    // 防抖处理内容变更
    const debouncedOnChange = useDebounce((markdown) => {
        try {
            if (onChangeRef.current) {
                onChangeRef.current(markdown);
            }
        } catch (error) {
            console.error('Error in onChange callback:', error);
        }
    }, 100);

    // Memoize extensions 避免重复创建
    const extensions = useMemo(() => [
        StarterKit.configure({
            hardBreak: false,
            paragraph: false,
            text: false,
        }),
        CustomText,
        CustomHardBreak,
        MarkdownParagraph,
        Spoiler,
        Annotation,
        Callout,
        ImageNode,
        MindMapNode,
        QuizNode,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        FontFamily,
        FontSize,
        TextAlign.configure({
            types: ['heading', 'paragraph', 'image'],
        }),
        Underline,
        Markdown.configure({
            html: true,
            transformPastedText: true,
            transformCopiedText: true,
        }),
    ], []);
    
    const editor = useEditor({
        extensions,
        content: content,
        editorProps: {
            attributes: {
                class: `prose dark:prose-invert max-w-none focus:outline-none px-8 py-6 ${variant === 'seamless' ? 'min-h-[calc(100vh-200px)]' : 'min-h-[400px]'} ${editorClassName}`,
            },
            handleKeyDown(view, event) {
                try {
                    if (!view || !event) return false;
                    const editorInstance = view.state?.doc ? view : null;
                    if (!editorInstance) return false;
                    
                    if (event.key === 'Tab') {
                        // 使用 view.state 而不是 editor，避免闭包问题
                        const { state } = view;
                        const { selection } = state;
                        
                        // 检查是否在列表中
                        let inList = false;
                        let inCodeBlock = false;
                        let inParagraph = false;
                        
                        state.doc.nodesBetween(selection.from, selection.to, (node) => {
                            if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
                                inList = true;
                            }
                            if (node.type.name === 'codeBlock') {
                                inCodeBlock = true;
                            }
                            if (node.type.name === 'paragraph') {
                                inParagraph = true;
                            }
                        });
                        
                        if (inCodeBlock) {
                            event.preventDefault();
                            const tr = state.tr.insertText('    ', selection.from, selection.to);
                            view.dispatch(tr);
                            return true;
                        }
                        
                        if (inParagraph && !inList) {
                            event.preventDefault();
                            const { $from } = selection;
                            const start = $from.start();
                            const paragraph = $from.parent;
                            const text = paragraph.textContent || '';
                            const indentUnit = '\u00A0\u00A0\u00A0\u00A0';
                            
                            if (event.shiftKey) {
                                if (text.startsWith(indentUnit)) {
                                    view.dispatch(state.tr.delete(start, start + indentUnit.length));
                                    return true;
                                }
                                if (text.startsWith('\u00A0')) {
                                    let count = 0;
                                    while (text[count] === '\u00A0') {
                                        count += 1;
                                    }
                                    if (count > 0) {
                                        view.dispatch(state.tr.delete(start, start + count));
                                    }
                                    return true;
                                }
                                return true;
                            }
                            view.dispatch(state.tr.insertText(indentUnit, start));
                            return true;
                        }
                    }
                } catch (error) {
                    console.error('Error in handleKeyDown:', error);
                }
                return false;
            },
            handlePaste(view, event) {
                try {
                    const clipboardData = event.clipboardData || window.clipboardData;
                    if (!clipboardData) {
                        return false;
                    }
                    const files = Array.from(clipboardData.files || []).filter((file) =>
                        file.type.startsWith('image/')
                    );
                    if (files.length === 0) {
                        return false;
                    }
                    event.preventDefault();
                    const file = files[0];
                    
                    // 文件大小检查 (最大 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        console.warn('Image too large. Maximum size is 10MB.');
                        return true;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            if (typeof reader.result === 'string') {
                                const { state } = view;
                                const { tr } = state;
                                const node = state.schema.nodes.image.create({
                                    src: reader.result,
                                    alt: file.name,
                                });
                                view.dispatch(tr.replaceSelectionWith(node));
                            }
                        } catch (error) {
                            console.error('Error inserting image:', error);
                        }
                    };
                    reader.onerror = () => {
                        console.error('Error reading file');
                    };
                    reader.readAsDataURL(file);
                    return true;
                } catch (error) {
                    console.error('Error in handlePaste:', error);
                    return false;
                }
            },
        },
        onUpdate: ({ editor }) => {
            try {
                const markdown = editor.storage.markdown?.getMarkdown() || '';
                const normalized = normalizeMathBackslashes(markdown);
                debouncedOnChange(normalized);
            } catch (error) {
                console.error('Error in onUpdate:', error);
            }
        },
        onError: ({ error }) => {
            console.error('Editor error:', error);
            setEditorError(error);
        },
    });

    useEffect(() => {
        if (editor && content !== editor.storage.markdown?.getMarkdown()) {
             // Sync content if needed, but avoiding loops
        }
    }, [content, editor]);

    const customStyles = `
      .ProseMirror ul {
        list-style-type: disc;
        padding-left: 1.5em;
        margin: 1em 0;
      }
      .ProseMirror ol {
        list-style-type: decimal;
        padding-left: 1.5em;
        margin: 1em 0;
      }
      .ProseMirror li {
        margin: 0.2em 0;
      }
      .ProseMirror blockquote {
        border-left: 3px solid hsl(var(--border));
        padding-left: 1rem;
        margin-left: 0;
        font-style: italic;
      }
      .ProseMirror h1 {
        font-size: 2.25em;
        font-weight: 800;
        margin-top: 0.8em;
        margin-bottom: 0.4em;
        line-height: 1.1;
      }
      .ProseMirror h2 {
        font-size: 1.8em;
        font-weight: 700;
        margin-top: 0.7em;
        margin-bottom: 0.35em;
        line-height: 1.2;
      }
      .ProseMirror h3 {
        font-size: 1.5em;
        font-weight: 600;
        margin-top: 0.6em;
        margin-bottom: 0.3em;
        line-height: 1.3;
      }
      .ProseMirror h4 {
        font-size: 1.25em;
        font-weight: 600;
        margin-top: 0.5em;
        margin-bottom: 0.25em;
        line-height: 1.4;
      }
      .ProseMirror .spoiler {
        background-color: rgba(168, 85, 247, 0.2);
        border: 1px dashed rgba(168, 85, 247, 0.5);
        border-radius: 4px;
        padding: 0 4px;
      }
    `;

    const containerClass = variant === 'seamless'
        ? `bg-background transition-all ${className}`
        : `border border-border rounded-lg overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring transition-all ${className}`;

    // 错误状态显示
    if (editorError) {
        return (
            <div className={containerClass}>
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <XCircle className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">编辑器加载失败</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        请刷新页面重试，如果问题持续存在，请联系管理员。
                    </p>
                    <button
                        onClick={() => {
                            setEditorError(null);
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        刷新页面
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass}>
            <style>{customStyles}</style>
            
            {editor && (
                <>
                    <BubbleMenu 
                        editor={editor} 
                        tippyOptions={{ duration: 100 }}
                        shouldShow={({ editor, state }) => {
                            const { selection } = state;
                            return !selection.empty && !editor.isActive('image');
                        }}
                    >
                        <div className="flex items-center gap-1 p-1.5 rounded-xl border border-border bg-popover shadow-xl text-popover-foreground animate-in fade-in zoom-in-95">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                isActive={editor.isActive('bold')}
                                title="粗体"
                            >
                                <Bold size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                isActive={editor.isActive('italic')}
                                title="斜体"
                            >
                                <Italic size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                isActive={editor.isActive('strike')}
                                title="删除线"
                            >
                                <Strikethrough size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleCode().run()}
                                isActive={editor.isActive('code')}
                                title="代码"
                            >
                                <Code size={14} />
                            </ToolbarButton>
                            <div className="w-px h-4 bg-border mx-1" />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHighlight().run()}
                                isActive={editor.isActive('highlight')}
                                title="高亮"
                            >
                                <Highlighter size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => {
                                    const currentAttrs = editor.getAttributes('annotation');
                                    setCurrentAnnotation(currentAttrs?.explanation || '');
                                    setIsAnnotationDialogOpen(true);
                                }}
                                isActive={editor.isActive('annotation')}
                                title="添加或修改批注"
                            >
                                <MessageSquare size={14} />
                            </ToolbarButton>
                        </div>
                    </BubbleMenu>

                    <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 100, placement: 'bottom' }}
                        shouldShow={({ editor }) => editor.isActive('image')}
                    >
                        <ImageBubbleMenuContent editor={editor} />
                    </BubbleMenu>

                    <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
                        <div className="flex items-center gap-1 p-1.5 rounded-xl border border-border bg-popover shadow-xl text-popover-foreground animate-in fade-in zoom-in-95">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                isActive={editor.isActive('heading', { level: 1 })}
                                title="一级标题"
                            >
                                <Heading1 size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                isActive={editor.isActive('heading', { level: 2 })}
                                title="二级标题"
                            >
                                <Heading2 size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                isActive={editor.isActive('bulletList')}
                                title="列表"
                            >
                                <List size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setImage({ src: prompt('Image URL') }).run()}
                                title="图片"
                            >
                                <ImageIcon size={14} />
                            </ToolbarButton>
                        </div>
                    </FloatingMenu>
                </>
            )}

            <MenuBar 
                editor={editor} 
                onOpenAnnotation={(explanation) => {
                    setCurrentAnnotation(explanation);
                    setIsAnnotationDialogOpen(true);
                }}
                onOpenMindMap={() => setIsMindMapDialogOpen(true)}
                onOpenQuiz={() => setIsQuizDialogOpen(true)}
            />
            <div className="bg-background">
                <EditorContent editor={editor} />
            </div>
            
            <AnnotationDialog
                isOpen={isAnnotationDialogOpen}
                initialValue={currentAnnotation}
                onClose={() => {
                    setIsAnnotationDialogOpen(false);
                    setCurrentAnnotation('');
                }}
                onConfirm={(explanation) => {
                    if (editor) {
                        if (explanation.trim()) {
                            editor.chain().focus().setAnnotation(explanation).run();
                        } else {
                            // 如果内容为空，则移除批注
                            editor.chain().focus().unsetAnnotation().run();
                        }
                    }
                }}
            />

            <MindMapDialog
                isOpen={isMindMapDialogOpen}
                onClose={() => setIsMindMapDialogOpen(false)}
                onConfirm={(data) => {
                    if (editor) {
                        editor.chain().focus().insertMindMap(data).run();
                    }
                }}
            />

            <QuizDialog
                isOpen={isQuizDialogOpen}
                onClose={() => setIsQuizDialogOpen(false)}
                onConfirm={(data) => {
                    if (editor) {
                        editor.chain().focus().insertQuiz(data).run();
                    }
                }}
            />
        </div>
    );
};

export default RichTextEditor;
