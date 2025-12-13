import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    fontFamily: 'inherit',
});

const Mermaid = ({ chart }) => {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('light') ? false : true;
            setIsDark(isDarkMode);
            mermaid.initialize({
                startOnLoad: false,
                theme: isDarkMode ? 'dark' : 'default',
            });
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const renderChart = async () => {
            if (!containerRef.current || !chart) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (error) {
                console.error('Mermaid render error:', error);
                setSvg(`<div class="text-red-500 bg-red-500/10 p-4 rounded-lg">Failed to render diagram</div>`);
            }
        };

        renderChart();
    }, [chart, isDark]);

    return (
        <div
            className="mermaid-chart my-8 flex justify-center bg-card p-4 rounded-xl border border-border shadow-sm overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default Mermaid;
