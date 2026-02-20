import React, { useEffect, useState } from 'react';
import { Users, Calendar, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { Handshake, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react';

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
    const [unreadEmails, setUnreadEmails] = useState(0);

    useEffect(() => {
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

        // Simulate Smart Capture Notification after 3 seconds
        const timer = setTimeout(() => {
            toast.success('¡Nueva Captura Automática!', {
                description: 'El sistema detectó un mensaje de WhatsApp de "Alicorp" y ha creado un nuevo prospecto.',
                icon: <MessageCircle className="h-5 w-5 text-green-500" />,
                duration: 5000,
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const stats = [
        { name: 'Prospectos Nuevos', stat: '8', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { name: 'Mensajes Sin Leer', stat: unreadEmails.toString(), icon: Mail, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        { name: 'Alianzas en Proceso', stat: '14', icon: Handshake, color: 'text-primary', bg: 'bg-primary/10' },
        { name: 'Reuniones Hoy', stat: '4', icon: Calendar, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
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
                        <select className="text-xs border-none bg-muted/50 rounded-md px-2 py-1 text-muted-foreground focus:ring-0">
                            <option>Últimos 6 meses</option>
                            <option>Este año</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
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

            {/* Integration Tips & Calendly */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-card shadow-sm hover:shadow-md rounded-2xl p-6 border border-border border-l-4 border-l-primary transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Guía de Integración Funcional</h3>
                    </div>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>Para que este portal sea 100% automático sin backend:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Publica tu Google Sheets como CSV y pega la URL en `Alianzas.tsx`.</li>
                            <li>Usa <strong>Make.com</strong> para conectar tu correo de alianzas con la hoja de Sheets.</li>
                            <li>Los contactos nuevos aparecerán aquí automáticamente.</li>
                        </ul>
                        <div className="pt-2">
                            <button className="text-primary font-bold hover:underline flex items-center">
                                Ver documentación de configuración <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-primary shadow-lg rounded-2xl p-6 text-primary-foreground flex flex-col justify-between">
                    <div>
                        <Calendar className="h-8 w-8 mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Agendar Reunión</h3>
                        <p className="text-sm opacity-90 mb-6">Usa Calendly para coordinar alianzas sin correos de ida y vuelta.</p>
                    </div>
                    <button
                        onClick={() => window.open('https://calendly.com', '_blank')}
                        className="w-full py-3 bg-background text-primary rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md"
                    >
                        Abrir Calendly
                    </button>
                </div>
            </div>

            {/* Recent Activity / Content */}
            <div className="bg-card shadow-sm hover:shadow-md rounded-2xl p-6 border border-border transition-shadow duration-300">
                <h3 className="text-lg font-bold text-foreground mb-6">Actividad Reciente</h3>
                <ul className="space-y-6">
                    <li className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Reunión de planificación - Alianzas</h4>
                                <p className="text-sm text-muted-foreground mt-1">Programada vía Calendly para mañana a las 10:00 AM</p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md self-start">hace 1h</span>
                        </div>
                    </li>
                    <li className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Nueva empresa registrada automáticamente</h4>
                                <p className="text-sm text-muted-foreground mt-1">Alicorp S.A.A. ha sido añadida vía captura de WhatsApp Business.</p>
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
