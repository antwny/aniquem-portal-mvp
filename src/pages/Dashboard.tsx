import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Define duplicate interfaces for now to avoid major refactor, ideally these go in a types file
interface Email {
    id: number;
    read: boolean;
    folder: 'inbox' | 'sent' | 'trash';
    deleted?: boolean;
}

const data = [
    { name: 'Ene', donaciones: 4000, voluntarios: 24 },
    { name: 'Feb', donaciones: 3000, voluntarios: 13 },
    { name: 'Mar', donaciones: 2000, voluntarios: 98 },
    { name: 'Abr', donaciones: 2780, voluntarios: 39 },
    { name: 'May', donaciones: 1890, voluntarios: 48 },
    { name: 'Jun', donaciones: 2390, voluntarios: 38 },
];

const Dashboard: React.FC = () => {
    // Read from localStorage manually to avoid hook complexity if key doesn't exist yet, 
    // or better, use the hook but we need to pass initial values.
    // simpler: just read directly for stats since we don't 'set' them here.

    const [volunteerCount, setVolunteerCount] = useState(0);
    const [unreadEmails, setUnreadEmails] = useState(0);
    const [eventCount, setEventCount] = useState(0);

    useEffect(() => {
        // Volunteers
        const storedVolunteers = localStorage.getItem('aniquem-volunteers');
        if (storedVolunteers) {
            try {
                const parsed = JSON.parse(storedVolunteers);
                setVolunteerCount(parsed.length);
            } catch (e) {
                setVolunteerCount(124); // Fallback
            }
        } else {
            setVolunteerCount(5); // Initial mock count
        }

        // Emails
        const storedEmails = localStorage.getItem('aniquem-emails');
        if (storedEmails) {
            try {
                const parsed: Email[] = JSON.parse(storedEmails);
                // Count inbox unread
                const unread = parsed.filter(e => (e.folder === 'inbox' || !e.folder) && !e.deleted && !e.read).length;
                setUnreadEmails(unread);
            } catch (e) {
                setUnreadEmails(2);
            }
        } else {
            setUnreadEmails(2); // Initial inbox has 2 unread
        }

        // Events
        const storedEvents = localStorage.getItem('aniquem-events');
        if (storedEvents) {
            try {
                const parsed = JSON.parse(storedEvents);
                setEventCount(parsed.length);
            } catch (e) {
                setEventCount(3);
            }
        } else {
            setEventCount(3);
        }

    }, []);

    const stats = [
        { name: 'Total Voluntarios', stat: volunteerCount.toString(), icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { name: 'Mensajes Sin Leer', stat: unreadEmails.toString(), icon: Mail, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        { name: 'Nuevas Donaciones', stat: 'S/. 12,400', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
        { name: 'Eventos', stat: eventCount.toString(), icon: Calendar, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Panel Principal</h2>
                    <p className="text-muted-foreground mt-1">Resumen general de las actividades de Aniquem.</p>
                </div>
                <div className="flex space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                        Sistema Operativo
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="relative bg-card pt-6 px-6 pb-8 shadow-sm hover:shadow-lg rounded-2xl border border-border transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`rounded-xl p-3 ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.name}</span>
                        </div>
                        <div className="flex items-baseline">
                            <p className="text-3xl font-extrabold text-foreground tracking-tight">{item.stat}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donations Chart */}
                <div className="bg-card shadow-sm hover:shadow-md rounded-2xl p-6 border border-border transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground">Tendencia de Donaciones</h3>
                        <select className="text-xs border-none bg-muted/50 rounded-md px-2 py-1 text-muted-foreground focus:ring-0">
                            <option>Últimos 6 meses</option>
                            <option>Este año</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <div style={{ background: 'linear-gradient(180deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 0, 0, 0) 100%)' }} />
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `S/.${value / 1000}k`} />
                                <Tooltip
                                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Line type="monotone" dataKey="donaciones" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4, fill: 'hsl(var(--background))' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Volunteers Chart */}
                <div className="bg-card shadow-sm hover:shadow-md rounded-2xl p-6 border border-border transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground">Nuevos Voluntarios</h3>
                        <div className="flex space-x-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="voluntarios" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Content */}
            <div className="bg-card shadow-sm hover:shadow-md rounded-2xl p-6 border border-border transition-shadow duration-300">
                <h3 className="text-lg font-bold text-foreground mb-6">Actividad Reciente</h3>
                <ul className="space-y-6">
                    <li className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Reunión de planificación</h4>
                                <p className="text-sm text-muted-foreground mt-1">Programada por Maria Garcia para mañana a las 10:00 AM</p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md self-start">hace 1h</span>
                        </div>
                    </li>
                    <li className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Nuevo voluntario registrado</h4>
                                <p className="text-sm text-muted-foreground mt-1">Juan Perez se ha registrado como voluntario en el área de psicología.</p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md self-start">hace 3h</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;
