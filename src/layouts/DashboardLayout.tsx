import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Mail,
    Calendar,
    Users,
    Menu,
    LogOut,
    Bell,
    Moon,
    Sun,
    ChevronRight,
    Check
} from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    type: 'email' | 'event' | 'system';
    read: boolean;
}

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Notifications State
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notificationRef = useRef<HTMLDivElement>(null);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Correos', href: '/email', icon: Mail },
        { name: 'Calendario', href: '/calendar', icon: Calendar },
        { name: 'Voluntarios', href: '/volunteers', icon: Users },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Load Notifications
    useEffect(() => {
        const loadNotifications = () => {
            const newNotifications: Notification[] = [];

            // 1. System Notification (Mock)
            newNotifications.push({
                id: 1,
                title: 'Bienvenido al Portal',
                message: 'Has iniciado sesión correctamente.',
                time: 'Ahora',
                type: 'system',
                read: false
            });

            // 2. Unread Emails
            const storedEmails = localStorage.getItem('aniquem-emails');
            if (storedEmails) {
                try {
                    const parsedEmails = JSON.parse(storedEmails);
                    const unread = parsedEmails.filter((e: any) => !e.read && e.folder === 'inbox').slice(0, 3);
                    unread.forEach((e: any) => {
                        newNotifications.push({
                            id: e.id,
                            title: 'Nuevo Correo',
                            message: `De ${e.sender}: ${e.subject}`,
                            time: e.date,
                            type: 'email',
                            read: false
                        });
                    });
                } catch (e) { console.error(e); }
            }

            // 3. Upcoming Events
            const storedEvents = localStorage.getItem('aniquem-events');
            if (storedEvents) {
                try {
                    const parsedEvents = JSON.parse(storedEvents);
                    // Mock logic: just take the first 2 events
                    const upcoming = parsedEvents.slice(0, 2);
                    upcoming.forEach((e: any) => {
                        newNotifications.push({
                            id: e.id,
                            title: 'Evento Próximo',
                            message: `${e.title} - ${e.time}`,
                            time: 'Hoy',
                            type: 'event',
                            read: false
                        });
                    });
                } catch (e) { console.error(e); }
            }

            setNotifications(newNotifications);
        };

        if (isNotificationsOpen) {
            loadNotifications();
        }
    }, [isNotificationsOpen]);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        if (isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationsOpen]);


    return (
        <div className="min-h-screen bg-background flex transition-colors duration-300 font-sans text-foreground">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-20 flex items-center justify-center border-b border-border bg-card/50 backdrop-blur-md">
                        <img src="/logo.png" alt="Aniquem" className="h-12 w-auto transition-transform hover:scale-105 duration-300" />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
                            Menu Principal
                        </div>
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'text-foreground/70 hover:bg-muted hover:text-primary hover:pl-5'
                                        }`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                                    {item.name}
                                    {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-border bg-card/50 backdrop-blur-md">
                        <div className="flex items-center mb-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <img
                                src={user?.avatar || 'https://ui-avatars.com/api/?name=User'}
                                alt="User"
                                className="h-10 w-10 rounded-full border-2 border-primary/20"
                            />
                            <div className="ml-3 overflow-hidden">
                                <Link to="/profile" className="hover:underline">
                                    <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
                                </Link>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted focus:outline-none transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Title or Breadcrumb (Optional) */}
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-red-800 bg-clip-text text-transparent">
                                {navigation.find(n => n.href === location.pathname)?.name || 'Aniquem'}
                            </h1>
                        </div>

                        <div className="flex-1 flex justify-end items-center space-x-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-muted transition-all duration-200"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </button>

                            {/* Notification Dropdown */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className={`p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-muted transition-all duration-200 relative ${isNotificationsOpen ? 'bg-muted text-primary' : ''}`}
                                >
                                    <Bell className="h-6 w-6" />
                                    {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />}
                                </button>

                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200 border border-border">
                                        <div className="py-2">
                                            <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                                                <button onClick={() => setNotifications([])} className="text-xs text-primary hover:underline">Mark all read</button>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notification) => (
                                                        <div key={notification.id} className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                                                                <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{notification.time}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                                                            <div className="mt-2 flex items-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notification.type === 'email' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                        notification.type === 'event' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                                    }`}>
                                                                    {notification.type === 'email' ? 'Correo' : notification.type === 'event' ? 'Evento' : 'Sistema'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                                        <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p>Todo al día</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Link to="/email" onClick={() => setIsNotificationsOpen(false)} className="block px-4 py-2 text-sm text-center text-primary font-medium hover:bg-muted/50 transition-colors border-t border-border">
                                                Ver todo
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
