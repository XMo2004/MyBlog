import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// 可折叠块组件
const DetailsComponent = ({ node, updateAttributes, editor }) => {
    const [isOpen, setIsOpen] = useState(node.attrs.open);
    const [title, setTitle] = useState(node.attrs.title || '点击展开');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        setIsOpen(node.attrs.open);
    }, [node.attrs.open]);

    useEffect(() => {
        setTitle(node.attrs.title || '点击展开');
    }, [node.attrs.title]);

    const handleToggle = () => {
        const newOpen = !isOpen;
        setIsOpen(newOpen);
        updateAttributes({ open: newOpen });
    };

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        updateAttributes({ title: title.trim() || '点击展开' });
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleBlur();
        }
    };

    return (
        <NodeViewWrapper className="details-node my-4">
            <div className="border border-border rounded-lg overflow-hidden bg-card/50">
                {/* Summary/Header */}
                <div 
                    className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                        if (!isEditingTitle) {
                            handleToggle();
                        }
                    }}
                >
                    <span 
                        className="text-muted-foreground transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                        <ChevronRight size={18} />
                    </span>
                    
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent border-none outline-none text-foreground font-medium"
                            autoFocus
                        />
                    ) : (
                        <span 
                            className="flex-1 font-medium text-foreground"
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setIsEditingTitle(true);
                            }}
                            title="双击编辑标题"
                        >
                            {title}
                        </span>
                    )}
                </div>
                
                {/* Content */}
                <div 
                    className={`overflow-hidden transition-all duration-200 ${
                        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-4 py-3 border-t border-border/50">
                        <NodeViewContent className="outline-none" />
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

// 可折叠块扩展
export const Details = Node.create({
    name: 'details',
    group: 'block',
    content: 'block+',
    draggable: true,

    addAttributes() {
        return {
            title: {
                default: '点击展开',
                parseHTML: element => element.querySelector('summary')?.textContent || element.getAttribute('data-title') || '点击展开',
            },
            open: {
                default: false,
                parseHTML: element => element.hasAttribute('open') || element.getAttribute('data-open') === 'true',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'details',
            },
            {
                tag: 'div[data-type="details"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        return [
            'details',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'details',
                'data-title': node.attrs.title,
                open: node.attrs.open ? 'open' : null,
            }),
            ['summary', {}, node.attrs.title],
            ['div', { class: 'details-content' }, 0],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DetailsComponent);
    },

    addCommands() {
        return {
            setDetails: (attributes) => ({ commands }) => {
                return commands.wrapIn(this.name, attributes);
            },
            toggleDetails: (attributes) => ({ commands }) => {
                return commands.toggleWrap(this.name, attributes);
            },
            unsetDetails: () => ({ commands }) => {
                return commands.lift(this.name);
            },
            insertDetails: (attributes) => ({ commands, state }) => {
                const { selection } = state;
                const content = selection.empty ? 
                    { type: 'paragraph', content: [{ type: 'text', text: '在这里输入内容...' }] } :
                    null;
                    
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes || { title: '点击展开', open: true },
                    content: content ? [content] : undefined,
                });
            },
        };
    },

    addStorage() {
        return {
            markdown: {
                serialize(state, node) {
                    const title = node.attrs.title || '点击展开';
                    const open = node.attrs.open ? ' open' : '';
                    state.write(`<details${open}>\n<summary>${title}</summary>\n\n`);
                    state.renderContent(node);
                    state.write('\n</details>\n\n');
                },
            },
        };
    },
});

export default Details;
