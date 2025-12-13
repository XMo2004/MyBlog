import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Terminal,
    User,
    Folder,
    Link as LinkIcon,
    BookOpen,
    Scale
} from 'lucide-react';
import { ThemeToggle, useTheme } from '../components/ThemeToggle';

const SidebarItem = ({ icon, label, path, isActive }) => (
    <Link
        to={path}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-200 group ${isActive
            ? 'bg-secondary text-foreground font-medium'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
    >
        {React.createElement(icon, { size: 16 })}
        <span className="text-sm">{label}</span>
    </Link>
);

export const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);
    const { theme, toggleTheme } = useTheme();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            navigate('/login');
        }
    };

    // Close sidebar on route change for mobile
    React.useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    return (
        <div className="h-screen overflow-hidden bg-background flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-60 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-14 flex items-center px-4 border-b border-border">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center">
                                <Terminal size={16} />
                            </div>
                            <span className="font-semibold text-sm">Blog Admin</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                        <div className="space-y-1">
                            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
                                概览
                            </p>
                            <SidebarItem
                                icon={LayoutDashboard}
                                label="仪表盘"
                                path="/dashboard"
                                isActive={location.pathname === '/dashboard'}
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
                                内容管理
                            </p>
                            <SidebarItem
                                icon={FileText}
                                label="文章"
                                path="/dashboard/posts"
                                isActive={location.pathname.includes('/dashboard/posts')}
                            />
                            <SidebarItem
                                icon={User}
                                label="个人资料"
                                path="/dashboard/profile"
                                isActive={location.pathname.includes('/dashboard/profile')}
                            />
                            <SidebarItem
                                icon={Scale}
                                label="健康管理"
                                path="/dashboard/weight"
                                isActive={location.pathname === '/dashboard/weight'}
                            />
                            <SidebarItem
                                icon={Folder}
                                label="项目"
                                path="/dashboard/projects"
                                isActive={location.pathname.includes('/dashboard/projects')}
                            />
                            <SidebarItem
                                icon={LinkIcon}
                                label="资源"
                                path="/dashboard/resources"
                                isActive={location.pathname.includes('/dashboard/resources')}
                            />
                            <SidebarItem
                                icon={BookOpen}
                                label="专栏"
                                path="/dashboard/columns"
                                isActive={location.pathname.includes('/dashboard/columns')}
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
                                系统
                            </p>
                            <SidebarItem
                                icon={Settings}
                                label="设置"
                                path="/dashboard/settings"
                                isActive={location.pathname === '/dashboard/settings'}
                            />
                            <SidebarItem
                                icon={Terminal}
                                label="系统工具"
                                path="/dashboard/tools"
                                isActive={location.pathname === '/dashboard/tools'}
                            />
                            <SidebarItem
                                icon={User}
                                label="管理员"
                                path="/dashboard/admins"
                                isActive={location.pathname === '/dashboard/admins'}
                            />
                            <SidebarItem
                                icon={User}
                                label="用户与角色"
                                path="/dashboard/users"
                                isActive={location.pathname === '/dashboard/users'}
                            />
                        </div>
                    </nav>

                    {/* Footer / User */}
                    <div className="p-4 border-t border-border">
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                            <LogOut size={16} />
                            <span className="text-sm">退出登录</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-3 ml-auto">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium text-xs border border-border">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                />
            )}
        </div>
    );
};
