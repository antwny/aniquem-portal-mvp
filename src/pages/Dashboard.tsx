import React, { useEffect, useState } from 'react';
import { Users, Calendar, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Handshake } from 'lucide-react';

interface Email {
    id: number;
    read: boolean;
    folder: 'inbox' | 'sent' | 'trash';
    deleted?: boolean;
    subject?: string;
    date?: string;
    sender?: string;
}

const emptyData = [
    { name: 'Ene', donaciones: 0, voluntarios: 0 },
    { name: 'Feb', donaciones: 0, voluntarios: 0 },
    { name: 'Mar', donaciones: 0, voluntarios: 0 },
];

const Dashboard: React.FC = () => {
    const [unreadEmails, setUnreadEmails] = useState(0);
    const [newProspects, setNewProspects] = useState(0);
    const [meetingsToday, setMeetingsToday] = useState(0);
    const [inProcessAllies, setInProcessAllies] = useState(0);
    const [recentActivity, setRecentActivity] = useState<{ id: number; title: string; subtitle: string; time: string }[]>([]);

    useEffect(() => {
        let activityList: { id: number; title: string; subtitle: string; time: string, timestamp: number }[] = [];

        // Emails
        const storedEmails = localStorage.getItem('aniquem-emails');
        if (storedEmails) {
            try {
                const parsed: Email[] = JSON.parse(storedEmails);
                const unread = parsed.filter(e => (e.folder === 'inbox' || !e.folder) && !e.deleted && !e.read).length;
                setUnreadEmails(unread);

                parsed.slice(0, 3).forEach((e, idx) => {
                    activityList.push({
                        id: e.id || Date.now() + idx,
                        title: `Correo: ${e.subject || 'Sin Asunto'}`,
                        subtitle: `De: ${e.sender || 'Desconocido'}`,
                        time: e.date || 'Reciente',
                        timestamp: e.id || 0
                    });
                });
            } catch (e) {
                setUnreadEmails(0);
            }
        } else {
            setUnreadEmails(0);
        }

        // Alianzas Stats
        const storedAlianzas = localStorage.getItem('aniquem-alianzas');
        if (storedAlianzas) {
            try {
                const alianzas = JSON.parse(storedAlianzas);
                setNewProspects(alianzas.length);
                const inProcess = alianzas.filter((a: any) => a.estado === 'contactado' || a.estado === 'negociacion').length;
                setInProcessAllies(inProcess || 0);
            } catch (e) {
                setNewProspects(0);
            }
        }

        // Events Stats
        const storedEvents = localStorage.getItem('aniquem-events');
        if (storedEvents) {
            try {
                const events = JSON.parse(storedEvents);
                const today = new Date();
                const todayCount = events.filter((e: any) =>
                    e.day === today.getDate() &&
                    e.month === today.getMonth() &&
                    e.year === today.getFullYear()
                ).length;
                setMeetingsToday(todayCount);

                events.slice(0, 3).forEach((e: any, idx: number) => {
                    activityList.push({
                        id: e.id || Date.now() + 100 + idx,
                        title: `Evento Especial: ${e.title}`,
                        subtitle: `Agendado para el ${e.day}/${e.month + 1}/${e.year}`,
                        time: 'Pronto',
                        timestamp: e.id || 1
                    });
                });
            } catch (e) {
                setMeetingsToday(0);
            }
        }

        // Sort activity by pretending the ones with higher IDs are newer
        activityList.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivity(activityList.slice(0, 5));

    }, []);

    const stats = [
        { name: 'Prospectos Totales', stat: newProspects.toString(), icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { name: 'Mensajes Sin Leer', stat: unreadEmails.toString(), icon: Mail, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        { name: 'Alianzas en Proceso', stat: inProcessAllies.toString(), icon: Handshake, color: 'text-primary', bg: 'bg-primary/10' },
        { name: 'Reuniones Hoy', stat: meetingsToday.toString(), icon: Calendar, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
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
                        <h3 className="text-lg font-bold text-foreground">Pipeline de Alianzas (Prospectos)</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Datos en recolección</span>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={emptyData}>
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
                        <h3 className="text-lg font-bold text-foreground">Conversión WhatsApp/Email</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Datos en recolección</span>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={emptyData}>
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
                {recentActivity.length > 0 ? (
                    <ul className="space-y-6">
                        {recentActivity.map((activity) => (
                            <li key={activity.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">{activity.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{activity.subtitle}</p>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md self-start">{activity.time}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground text-sm py-4">No hay actividad reciente.</div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
