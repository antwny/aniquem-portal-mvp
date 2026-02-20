import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Mail,
    Calendar,
    Handshake,
    ShieldCheck,
    LogOut,
    Menu,
    Bell,
    ChevronRight,
    Moon,
    Sun,
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
        { name: 'Alianzas', href: '/alianzas', icon: Handshake },
        { name: 'Correos', href: '/email', icon: Mail },
        { name: 'Calendario', href: '/calendar', icon: Calendar },
        { name: 'Usuarios', href: '/users', icon: ShieldCheck },
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
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col overflow-hidden">
                    <div className="h-20 flex items-center justify-center border-b border-border bg-card/50 backdrop-blur-md">
                        <img src="logo.png" alt="Aniquem" className="h-12 w-auto transition-transform hover:scale-105 duration-300" />
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-4 px-4">
                            Menu Principal
                        </div>
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                                            : 'text-foreground/60 hover:bg-muted/80 hover:text-primary hover:translate-x-1'
                                        }`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="relative z-10">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto flex items-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50 animate-pulse mr-2" />
                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto p-4 border-t border-border bg-muted/30 backdrop-blur-xl">
                        <div className="flex items-center mb-4 p-2.5 rounded-xl bg-background/50 border border-border/50 group cursor-pointer transition-all hover:border-primary/30">
                            <div className="relative">
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                                    alt="User"
                                    className="h-10 w-10 rounded-xl border-2 border-primary/10 object-cover"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <Link to="/profile" className="block">
                                    <p className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">{user?.name}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground truncate opacity-70">{user?.email}</p>
                                </Link>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full h-11 flex items-center justify-center px-4 rounded-xl text-sm font-bold text-destructive bg-destructive/5 border border-destructive/10 hover:bg-destructive hover:text-white hover:shadow-lg hover:shadow-destructive/20 transition-all duration-300"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
                <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 -ml-2 rounded-xl text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <div className="hidden lg:flex items-center ml-2">
                                <div className="h-6 w-1 bg-primary rounded-full mr-4" />
                                <h1 className="text-lg font-black tracking-tight text-foreground uppercase">
                                    {navigation.find(n => n.href === location.pathname)?.name || 'Aniquem'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end items-center space-x-2 sm:space-x-4">
                            <div className="h-8 w-px bg-border/50 mx-2 hidden sm:block" />

                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </button>

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
