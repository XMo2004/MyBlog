import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, BookOpen, User, Github, ChevronDown, Library, Columns, Package, UserCircle, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import useTheme from '../components/useTheme';
import { Search } from '../components/Search';

// Navigation menu configuration
const navItems = [
    {
        label: '文库',
        icon: Library,
        submenu: [
            { label: '全部文章', path: '/' },
            { label: '分类列表', path: '/categories' },
            { label: '标签列表', path: '/tags' },
        ]
    },
    {
        label: '专栏',
        icon: Columns,
        path: '/columns',
        submenu: null
    },
    {
        label: '资源',
        icon: Package,
        path: '/resources',
        submenu: null
    },
    {
        label: '我的',
        icon: UserCircle,
        submenu: [
            { label: '我的项目', path: '/projects' },
            { label: '我的回忆', path: '/memories' },
            { label: '体重管理', path: '/weight' },
            { label: '关于我', path: '/about' },
        ]
    },
];

export const MainLayout = () => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Check for user login status
        const checkUser = () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (e) {
                    console.error('Failed to parse user data', e);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };
        
        checkUser();
        // Listen for storage events (optional, but good for multi-tab)
        window.addEventListener('storage', checkUser);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', checkUser);
        };
    }, []);

    useEffect(() => {
        // Re-check user on location change (e.g. after login redirect)
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) { setUser(null); }
        } else {
            setUser(null);
        }
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const isColumnDetailPage = /^\/columns\/[^/]+$/.test(location.pathname);
    const isPostDetailPage = /^\/posts\/[^/]+$/.test(location.pathname);
    const isFullWidthPage = isColumnDetailPage || isPostDetailPage;

    return (
        <div className={`bg-background text-foreground flex flex-col ${isColumnDetailPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            {/* Navigation */}
            <nav
                className={`fixed top-0 left-0 right-0 z-60 transition-all duration-300 border-b ${scrolled || mobileMenuOpen
                    ? 'bg-background/80 backdrop-blur-md border-border py-2'
                    : 'bg-transparent border-transparent py-4'
                    }`}
            >
                <div className="max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] 4xl:max-w-[1800px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group z-50 relative">
                            <div className="p-1.5 bg-foreground text-background rounded-lg group-hover:rotate-12 transition-transform">
                                <Terminal size={18} />
                            </div>
                            <span
                                className="text-xl font-bold tracking-tight text-foreground group-hover:text-muted-foreground transition-colors duration-300"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                XMo's Space
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-1">
                            {navItems.map((item) => (
                                <NavDropdown
                                    key={item.label}
                                    item={item}
                                    currentPath={location.pathname}
                                />
                            ))}
                        </div>

                        {/* Right Side - Theme Toggle & Login */}
                        <div className="hidden md:flex items-center gap-2">
                            <Search />
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            {user ? (
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
                                >
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold border border-primary/20">
                                        {user.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium hidden lg:block">{user.username}</span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
                                    >
                                        登录
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
                                    >
                                        注册
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center gap-4 z-50 relative">
                            <Search />
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-muted-foreground hover:text-foreground"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-background border-b border-border overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                {navItems.map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        {item.submenu ? (
                                            <>
                                                <div className="font-medium text-muted-foreground px-2 text-sm flex items-center gap-2">
                                                    <item.icon size={16} />
                                                    {item.label}
                                                </div>
                                                <div className="pl-4 space-y-2 border-l-2 border-border/50 ml-2">
                                                    {item.submenu.map(sub => (
                                                        <Link
                                                            key={sub.path}
                                                            to={sub.path}
                                                            className={`block py-2 text-sm ${location.pathname === sub.path ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                className={`flex items-center gap-2 py-2 px-2 font-medium ${location.pathname === item.path ? 'text-primary' : 'text-foreground'}`}
                                            >
                                                <item.icon size={16} />
                                                {item.label}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-border flex gap-2">
                                    {user ? (
                                        <Link
                                            to="/profile"
                                            className="flex-1 text-center py-2 bg-primary/10 text-primary rounded-md font-medium flex items-center justify-center gap-2"
                                        >
                                            <UserCircle size={18} />
                                            {user.username}
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="flex-1 text-center py-2 bg-primary/10 text-primary rounded-md font-medium"
                                            >
                                                登录
                                            </Link>
                                            <Link
                                                to="/register"
                                                className="flex-1 text-center py-2 bg-primary/10 text-primary rounded-md font-medium"
                                            >
                                                注册
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className={`flex-1 ${isColumnDetailPage ? 'pt-[72px] min-h-0' : 'pt-24 pb-12 px-4 sm:px-6'}`}>
                <div className={isFullWidthPage ? (isColumnDetailPage ? 'h-full min-h-0' : 'w-full') : 'max-w-5xl 2xl:max-w-7xl 3xl:max-w-[1600px] 4xl:max-w-[1800px] mx-auto'}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={isColumnDetailPage ? 'h-full' : ''}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer */}
            {!isColumnDetailPage && (
                <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-8 mt-auto">
                    <div className="max-w-5xl 2xl:max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col items-center md:items-start gap-1.5">
                            <p className="text-sm font-medium text-foreground/80">
                                © {new Date().getFullYear()} 小陌 XMo. All rights reserved.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                既然选择了远方，便只顾风雨兼程
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <a 
                                href="https://github.com/xmo-dev" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm group"
                            >
                                <Github size={18} className="group-hover:scale-110 transition-transform" />
                                <span>GitHub</span>
                            </a>
                            <div className="h-4 w-px bg-border" />
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <span>Created by</span>
                                <span className="font-medium text-foreground">小陌 XMo</span>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

// Navigation dropdown component with hover submenu
const NavDropdown = ({ item, currentPath }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const Icon = item.icon;

    // Check if current path matches any submenu item
    const isActive = hasSubmenu
        ? item.submenu.some(sub => sub.path === currentPath)
        : item.path === currentPath;

    // For items without submenu, render a simple link
    if (!hasSubmenu) {
        return (
            <Link
                to={item.path}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
            >
                <Icon size={16} />
                <span>{item.label}</span>
            </Link>
        );
    }

    // For items with submenu, render a dropdown
    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
            >
                <Icon size={16} />
                <span>{item.label}</span>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-1 min-w-[140px] py-1.5 bg-popover border border-border rounded-lg shadow-xl shadow-black/20"
                    >
                        {item.submenu.map((subItem) => (
                            <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`block px-4 py-2 text-sm transition-colors ${currentPath === subItem.path
                                    ? 'text-foreground bg-muted'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                {subItem.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
