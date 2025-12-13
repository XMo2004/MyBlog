import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';

const TOC = ({ content, scrollContainer }) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        // We don't parse content string anymore, we scan the DOM.
        // But we need to react when content changes (re-render).
        if (!content) return;

        // Small timeout to ensure DOM is ready after MarkdownRenderer update
        const timer = setTimeout(() => {
            const elements = Array.from(document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3'));
            const extractedHeadings = elements.map(el => ({
                id: el.id,
                text: el.innerText,
                level: parseInt(el.tagName.substring(1), 10)
            })).filter(h => h.id && h.text);

            setHeadings(extractedHeadings);
        }, 100);

        return () => clearTimeout(timer);
    }, [content]);

    useEffect(() => {
        const container = scrollContainer ? document.querySelector(scrollContainer) : null;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                root: container, // Use container if provided, else viewport (null)
                rootMargin: '-100px 0px -66% 0px'
            }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            headings.forEach((heading) => {
                const element = document.getElementById(heading.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [headings, scrollContainer]);

    const scrollToHeading = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100;

            if (scrollContainer) {
                const container = document.querySelector(scrollContainer);
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    const relativeTop = elementRect.top - containerRect.top;

                    container.scrollTo({
                        top: container.scrollTop + relativeTop + yOffset,
                        behavior: 'smooth'
                    });
                }
            } else {
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
            setActiveId(id);
        }
    };

    if (headings.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90 pb-2 border-b border-border">
                <List size={16} className="text-primary" />
                <span>目录</span>
            </div>
            <ul className="space-y-2.5 text-sm relative border-l border-border/40 ml-1.5 pl-4">
                {headings.map((heading, index) => (
                    <li
                        key={`${heading.id}-${index}`}
                        className={`
                            relative cursor-pointer transition-all duration-200 block
                            ${heading.level === 1 ? 'font-semibold text-foreground/90' : 'text-muted-foreground'}
                            ${heading.level === 2 ? '' : ''}
                            ${heading.level === 3 ? 'pl-4' : ''}
                            ${activeId === heading.id
                                ? 'text-primary font-medium translate-x-1'
                                : 'hover:text-foreground hover:translate-x-1'
                            }
                        `}
                        onClick={() => scrollToHeading(heading.id)}
                    >
                        {activeId === heading.id && (
                            <span className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                        )}
                        {heading.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TOC;
