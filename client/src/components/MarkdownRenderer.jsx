import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { twMerge } from 'tailwind-merge';
import { Check, Copy, Hash, Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Mermaid from './Mermaid';

const fontSettings = {
  fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
};

const customLight = {
  ...oneLight,
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    ...fontSettings,
  },
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    ...fontSettings,
    background: 'transparent', // Ensure transparency for custom background
  },
  'comment': {
    ...oneLight['comment'],
    fontStyle: 'normal',
  },
};

const languageMap = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  java: 'java',
  cpp: 'cplusplus',
  'c++': 'cplusplus',
  c: 'c',
  cs: 'csharp',
  'c#': 'csharp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  rb: 'ruby',
  ruby: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  kotlin: 'kotlin',
  scss: 'sass',
  sass: 'sass',
  css: 'css3',
  html: 'html5',
  xml: 'xml',
  sql: 'mysql',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  docker: 'docker',
  dockerfile: 'docker',
  react: 'react',
  vue: 'vue',
  angular: 'angularjs',
  git: 'git',
  linux: 'linux',
  mysql: 'mysql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  redis: 'redis',
  nginx: 'nginx',
  apache: 'apache',
  ubuntu: 'ubuntu',
  centos: 'centos',
  debian: 'debian',
  fedora: 'fedora',
};

const useIsDarkTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('light') ? false : true;
      setIsDark(isDarkMode);
    };

    // checkTheme(); // Initial check is now done in useState

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

const ZoomImage = ({ src, alt, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        className="my-8 relative group cursor-zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="rounded-xl shadow-lg mx-auto max-h-[600px] object-contain border border-border/50 bg-card"
          loading="lazy"
          {...props}
        />
        {alt && (
          <span className="block text-center text-sm text-muted-foreground mt-2">
            {alt}
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              src={src}
              alt={alt}
              className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const CodeBlock = ({ language, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [iconError, setIconError] = useState(false);
  const isDark = useIsDarkTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (language === 'mermaid') {
    return <Mermaid chart={String(children)} />;
  }

  const lang = language?.toLowerCase() || '';
  const iconName = languageMap[lang] || lang;
  const iconUrl = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconName}/${iconName}-original.svg`;

  return (
    <div className={`my-6 rounded-xl overflow-hidden border border-border/50 shadow-xl ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'bg-[#252526] border-white/5' : 'bg-[#f6f6f6] border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {language && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono border ${isDark ? 'bg-background/50 text-muted-foreground/80 border-border/50' : 'bg-white text-gray-600 border-gray-200'}`}>
              {!iconError ? (
                <img 
                  src={iconUrl} 
                  alt={language} 
                  className="w-3.5 h-3.5 object-contain" 
                  onError={() => setIconError(true)}
                />
              ) : (
                <Terminal size={10} />
              )}
              <span>{language}</span>
            </div>
          )}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-md transition-all duration-200 ${isDark
                ? 'text-muted-foreground hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        style={isDark ? vscDarkPlus : customLight}
        language={language}
        PreTag="div"
        className="m-0! bg-transparent! p-4! overflow-x-auto text-sm md:text-[15px] 2xl:text-base! 3xl:text-lg! leading-relaxed font-mono"
        showLineNumbers={true}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1.5em',
          textAlign: 'right',
          userSelect: 'none',
          color: isDark ? '#6e7681' : '#a0a0a0',
          fontStyle: 'normal'
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const CALLOUT_TYPES_MD = {
  info: {
    color: '#60A5FA',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    darkBgColor: 'rgba(59, 130, 246, 0.12)',
    darkBorderColor: 'rgba(59, 130, 246, 0.5)',
    icon: Info,
    label: '信息',
  },
  warning: {
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    darkBgColor: 'rgba(245, 158, 11, 0.12)',
    darkBorderColor: 'rgba(245, 158, 11, 0.5)',
    icon: AlertTriangle,
    label: '注意',
  },
  error: {
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    darkBgColor: 'rgba(239, 68, 68, 0.12)',
    darkBorderColor: 'rgba(239, 68, 68, 0.5)',
    icon: AlertCircle,
    label: '警告',
  },
  success: {
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    darkBgColor: 'rgba(16, 185, 129, 0.12)',
    darkBorderColor: 'rgba(16, 185, 129, 0.5)',
    icon: CheckCircle,
    label: '成功',
  },
  tip: {
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    darkBgColor: 'rgba(139, 92, 246, 0.12)',
    darkBorderColor: 'rgba(139, 92, 246, 0.5)',
    icon: Lightbulb,
    label: '提示',
  },
};

const remarkCallout = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return;
      if (!CALLOUT_TYPES_MD[node.name]) return;

      const data = node.data || (node.data = {});
      const type = node.name;

      data.hName = 'div';
      const existingClass = data.hProperties?.className || [];
      const classList = Array.isArray(existingClass) ? existingClass : [existingClass].filter(Boolean);
      const className = classList.concat(['callout', `callout-${type}`]);

      data.hProperties = {
        ...data.hProperties,
        className,
      };
    });
  };
};

const remarkSpoiler = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'textDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'containerDirective'
      ) {
        if (node.name !== 'spoiler') return;

        const data = node.data || (node.data = {});
        const tagName = node.type === 'textDirective' ? 'span' : 'div';

        data.hName = tagName;
        data.hProperties = {
          ...data.hProperties,
          className: 'spoiler',
        };
      }
    });
  };
};

const Spoiler = ({ as: Component = 'span', children, className, ...props }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <Component
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(!revealed);
      }}
      className={twMerge(
        "cursor-pointer transition-all duration-200 rounded px-1",
        revealed 
          ? "bg-purple-100/50 dark:bg-purple-500/20 text-foreground" 
          : "bg-purple-300 dark:bg-purple-700/60 text-transparent select-none hover:bg-purple-400 dark:hover:bg-purple-600/80",
        className
      )}
      title={revealed ? "Click to hide" : "Click to reveal"}
      {...props}
    >
      {children}
    </Component>
  );
};

const CalloutBlock = ({ className, children, ...props }) => {
  const isDark = useIsDarkTheme();
  const match = className?.match(/callout-(\w+)/);
  const type = match?.[1] || 'info';
  const config = CALLOUT_TYPES_MD[type] || CALLOUT_TYPES_MD.info;
  const Icon = config.icon;

  return (
    <div className="my-4" {...props}>
      <div
        className="flex gap-3 p-4 rounded-xl border transition-all duration-200 text-foreground"
        style={{
          backgroundColor: isDark ? (config.darkBgColor || config.bgColor) : config.bgColor,
          borderColor: isDark ? (config.darkBorderColor || config.borderColor) : config.borderColor,
        }}
      >
        <div
          className="shrink-0 mt-0.5 select-none"
          style={{ color: config.color }}
        >
          <Icon size={20} />
        </div>
        <div className="grow min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const MarkdownRenderer = ({ content: _content, className }) => {
  // Ensure content is a string
  const content = typeof _content === 'string' 
    ? _content 
    : (_content === null || _content === undefined) 
      ? '' 
      : String(_content);

  const headingCounts = {}
  const getNodeText = (node) => {
    if (!node) return ''
    const walk = (n) => {
      if (typeof n === 'string') return n
      if (n && typeof n.value === 'string') return n.value
      if (n && Array.isArray(n.children)) return n.children.map(walk).join('')
      return ''
    }
    return walk(node).trim()
  }
  const slugify = (str) => {
    const s = (str || '').toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-\u4e00-\u9fa5]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (!s) return undefined
    const count = headingCounts[s] || 0
    headingCounts[s] = count + 1
    return count === 0 ? s : `${s}-${count}`
  }
  return (
    <div className={twMerge(
      "prose dark:prose-invert max-w-none",
      "prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0",
      "prose-img:rounded-xl prose-img:shadow-lg",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
      "prose-headings:scroll-mt-28 prose-headings:font-display",
      "prose-p:leading-7 prose-p:text-foreground/90",
      className
    )}>
      <ReactMarkdown
        urlTransform={(url) => url}
        remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkSpoiler, remarkCallout]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          div({ node, className, children, ...props }) {
            if (className?.includes('callout')) {
              return <CalloutBlock className={className} {...props}>{children}</CalloutBlock>
            }
            if (className === 'spoiler') {
              return <Spoiler as="div" className={className} {...props}>{children}</Spoiler>
            }
            return <div className={className} {...props}>{children}</div>
          },
          span({ node, className, children, ...props }) {
            if (className === 'spoiler') {
              return <Spoiler as="span" className={className} {...props}>{children}</Spoiler>
            }
            // Handle annotation spans
            if (props['data-explanation']) {
              const explanation = props['data-explanation'];
              return (
                <span 
                  {...props} 
                  className={twMerge("annotation", className)}
                >
                  {children}
                  <span className="annotation-tooltip">
                    {explanation}
                  </span>
                </span>
              );
            }
            return <span className={className} {...props}>{children}</span>
          },
          h1({ node, ...props }) {
            return (
              <div className="relative group">
                <h1
                  {...props}
                  id={slugify(getNodeText(node))}
                  className="text-3xl md:text-5xl font-bold tracking-tight mt-12 mb-6 pb-4 border-b border-border flex items-center gap-2 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                />
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`#${slugify(getNodeText(node))}`} className="text-muted-foreground hover:text-primary">
                    <Hash size={20} />
                  </a>
                </div>
              </div>
            )
          },
          h2({ node, ...props }) {
            return (
              <div className="relative group">
                <h2
                  {...props}
                  id={slugify(getNodeText(node))}
                  className="text-2xl md:text-3xl font-bold tracking-tight mt-12 mb-6 text-foreground flex items-center gap-3 before:content-[''] before:block before:w-1.5 before:h-8 before:bg-primary before:rounded-full before:mr-2"
                />
              </div>
            )
          },
          h3({ node, children, ...props }) {
            return (
              <h3 {...props} id={slugify(getNodeText(node))} className="text-xl md:text-2xl font-semibold tracking-tight mt-8 mb-4 text-foreground flex items-center gap-2 group">
                <span className="text-primary/40 group-hover:text-primary transition-colors">#</span>
                <span>{children}</span>
              </h3>
            )
          },
          h4({ node, ...props }) {
            return <h4 {...props} id={slugify(getNodeText(node))} className="text-lg md:text-xl font-semibold mt-6 mb-3 text-foreground" />
          },
          h5({ node, ...props }) {
            return <h5 {...props} id={slugify(getNodeText(node))} className="text-base md:text-lg font-medium mt-4 mb-2 text-foreground" />
          },
          h6({ node, ...props }) {
            return <h6 {...props} id={slugify(getNodeText(node))} className="text-sm md:text-base font-medium mt-4 mb-2 text-muted-foreground uppercase tracking-wider" />
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <CodeBlock language={match[1]} {...props}>
                {children}
              </CodeBlock>
            ) : (
              <code className={`${className} bg-primary/10 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-primary font-medium border border-primary/20`} {...props}>
                {children}
              </code>
            )
          },
          img({ node, ...props }) {
            return <ZoomImage {...props} />;
          },
          a({ node, ...props }) {
            const isInternal = props.href && (props.href.startsWith('/') || props.href.startsWith('#'));
            if (isInternal) {
              return (
                <a
                  {...props}
                  className="text-primary font-medium hover:underline underline-offset-4 decoration-primary/30 transition-all"
                />
              )
            }
            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline underline-offset-4 decoration-primary/30 transition-all inline-flex items-center gap-0.5"
              />
            )
          },
          blockquote({ node, children, ...props }) {
            return (
              <blockquote
                {...props}
                className="not-italic border-l-4 border-primary/50 pl-6 py-4 my-8 bg-muted/30 rounded-r-lg text-muted-foreground relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-primary/5 to-transparent pointer-events-none" />
                {children}
              </blockquote>
            )
          },
          ul({ node, className, ...props }) {
            const isTaskList = className?.includes('contains-task-list');
            return (
              <ul
                {...props}
                className={twMerge(
                  "my-6 [&>li]:mt-2 [&_ul]:my-0! [&_ol]:my-0!",
                  isTaskList ? "list-none pl-0" : "ml-6 list-disc marker:text-primary",
                  className
                )}
              />
            )
          },
          ol({ node, className, ...props }) {
            return (
              <ol
                {...props}
                className={twMerge(
                  "my-6 ml-6 list-decimal [&>li]:mt-2 marker:text-primary [&_ul]:my-0! [&_ol]:my-0! marker:font-bold",
                  className
                )}
              />
            )
          },
          li({ node, className, ...props }) {
            const isTaskList = className?.includes('task-list-item');
            return (
              <li
                {...props}
                className={twMerge(
                  "text-foreground/90 leading-7",
                  isTaskList ? "list-none relative pl-8 flex items-start gap-2" : "",
                  className
                )}
              />
            )
          },
          input({ node, ...props }) {
            if (props.type === 'checkbox') {
              return (
                <div className="relative inline-flex items-center justify-center w-5 h-5 mr-2 -ml-7 translate-y-[2px]">
                  <input
                    {...props}
                    className="peer appearance-none w-4 h-4 border-2 border-muted-foreground/30 rounded-sm bg-background checked:bg-primary checked:border-primary transition-all cursor-pointer"
                  />
                  <Check size={12} className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                </div>
              )
            }
            return <input {...props} />
          },
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-8 rounded-lg border border-border shadow-sm">
                <table {...props} className="w-full text-sm text-left border-collapse" />
              </div>
            )
          },
          thead({ node, ...props }) {
            return <thead {...props} className="bg-muted/30 text-xs uppercase text-muted-foreground font-semibold" />
          },
          th({ node, ...props }) {
            return <th {...props} className="px-6 py-4 border-b border-border tracking-wider bg-muted/10" />
          },
          td({ node, ...props }) {
            return <td {...props} className="px-6 py-4 border-b border-border/50 transition-colors" />
          },
          tr({ node, ...props }) {
            return <tr {...props} className="bg-card hover:bg-muted/20 transition-colors group" />
          },
          hr({ node, ...props }) {
            return <hr {...props} className="my-12 border-border/60" />
          },
          span({ node, className, children, ...props }) {
            // Handle annotation spans with click trigger
            if (props['data-explanation']) {
              const explanation = props['data-explanation'];
              const [isOpen, setIsOpen] = React.useState(false);
              const spanRef = React.useRef(null);
              
              React.useEffect(() => {
                const handleClickOutside = (event) => {
                  if (spanRef.current && !spanRef.current.contains(event.target)) {
                    setIsOpen(false);
                  }
                };
                
                if (isOpen) {
                  document.addEventListener('mousedown', handleClickOutside);
                  return () => document.removeEventListener('mousedown', handleClickOutside);
                }
              }, [isOpen]);
              
              return (
                <span 
                  ref={spanRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className={twMerge("annotation-click", className)}
                  style={{ position: 'relative' }}
                >
                  {children}
                  {isOpen && (
                    <span className="annotation-tooltip-click">
                      {explanation}
                    </span>
                  )}
                </span>
              );
            }
            return <span {...props} className={className}>{children}</span>;
          }

        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);
