import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { toast } from 'sonner';
import { EmailService } from '../services/EmailService';

interface Event {
    id: number;
    day: number;
    month: number;
    year: number;
    title: string;
    time: string;
    location?: string;
    color: string;
    guestEmail?: string;
}

const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const [events, setEvents] = useLocalStorage<Event[]>('aniquem-events', [
        { id: 1, day: 5, month: new Date().getMonth(), year: new Date().getFullYear(), title: 'Reunión Staff', time: '10:00 AM', color: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        { id: 2, day: 12, month: new Date().getMonth(), year: new Date().getFullYear(), title: 'Campaña Salud', time: '08:00 AM', location: 'Sede Central', color: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' },
        { id: 3, day: 15, month: new Date().getMonth(), year: new Date().getFullYear(), title: 'Entrega Donaciones', time: '03:00 PM', color: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' },
    ]);

    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwRJ_VEcURoeHmbdJvE1NWtQpuk6U5hSs_vP6D7T7oOkO77IqBSAwkw_ZTVp11eOoEA/exec';
    const CALENDAR_SHEETS_CSV_URL: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVRyUpYEdCDrSy-caeca47LZ3Op-oLADLrQe9QV1RzwkaBXuLClZEQRwREt8tQZyAfGOYvdK7c2_tA/pub?gid=2018729699&single=true&output=csv'; // URL de la pestaña "Calendario" publicada como CSV

    const [isLoading, setIsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', day: '', time: '', location: '', color: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' });

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const [emails, setEmails] = useLocalStorage<any[]>('aniquem-emails', []);
    const [notifyParticipants, setNotifyParticipants] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const fetchCalendarData = async () => {
        if (!CALENDAR_SHEETS_CSV_URL) {
            toast.info('Configura la URL', { description: 'Publica la pestaña "Calendario" como CSV en Google Sheets.' });
            return;
        }

        setIsLoading(true);
        try {
            const urlWithCacheBuster = CALENDAR_SHEETS_CSV_URL.includes('?')
                ? `${CALENDAR_SHEETS_CSV_URL}&t=${Date.now()}`
                : `${CALENDAR_SHEETS_CSV_URL}?t=${Date.now()}`;

            const response = await fetch(urlWithCacheBuster, { cache: 'no-store' });
            const text = await response.text();

            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length <= 1) {
                toast.warning('Hoja vacía o sin datos válidos');
                return;
            }

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            const newEvents: Event[] = rows.slice(1).map((row) => {
                const values = row.split(',').map(v => v.trim());
                const obj: any = {};
                headers.forEach((header, i) => { obj[header] = values[i]; });

                return {
                    id: parseInt(obj.id) || Date.now(),
                    day: parseInt(obj.dia) || 1,
                    month: (parseInt(obj.mes) || 1) - 1,
                    year: parseInt(obj.año) || new Date().getFullYear(),
                    title: obj.titulo || 'Evento sin título',
                    time: obj.hora || '',
                    location: obj.ubicacion || '',
                    color: obj.tipo_color || 'bg-blue-200 text-blue-800',
                    guestEmail: obj.email_invitado || ''
                };
            });

            // Fusionar evitando duplicados por ID
            setEvents(prev => {
                const existingIds = new Set(prev.map(e => e.id));
                const filteredNew = newEvents.filter(e => !existingIds.has(e.id));
                return [...prev, ...filteredNew];
            });

            toast.success('Sincronización exitosa', { description: `Se han cargado ${newEvents.length} eventos.` });
        } catch (error) {
            console.error('Error fetching calendar:', error);
            toast.error('Error de red', { description: 'No se pudo conectar con Google Sheets.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.day) return;

        const event: Event = {
            id: Date.now(),
            day: parseInt(newEvent.day),
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
            title: newEvent.title,
            time: newEvent.time,
            location: newEvent.location,
            color: newEvent.color,
            guestEmail: guestEmail // Store the guest email
        };

        setEvents([...events, event]);

        // Sincronización con Google Sheets
        if (WEBHOOK_URL) {
            fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(event)
            }).then(() => {
                toast.info('Sincronizando...', { description: 'El evento se está guardando en Google Sheets.' });
            }).catch(err => {
                console.error('Calendar webhook error:', err);
            });
        }

        const newEmails = [...emails];

        // Automation: Send Email if requested (Internal)
        if (notifyParticipants) {
            newEmails.unshift({
                id: Date.now() + 1,
                sender: "Sistema de Agenda",
                subject: `Invitación: ${newEvent.title}`,
                preview: `Se ha programado el evento ${newEvent.title}...`,
                body: `Hola,\n\nSe le ha enviado esta notificación automática para confirmar su asistencia al evento:\n\nEvento: ${newEvent.title}\nFecha: ${newEvent.day} de ${monthName}\nHora: ${newEvent.time}\nLugar: ${newEvent.location || 'Por definir'}\n\nPor favor, agéndelo.\n\nSaludos,\nAniquem Portal`,
                date: "Ahora",
                starred: false,
                read: false,
                label: "Automático",
                deleted: false,
                folder: 'inbox',
            });
        }

        // Automation: Send Email to Guest (External Simulation + Real)
        if (guestEmail) {
            newEmails.unshift({
                id: Date.now() + 2,
                sender: "Yo", // Simulating sent by current user
                subject: `Invitación a Aliado: ${newEvent.title}`,
                preview: `Estimado aliado, le invitamos al evento ${newEvent.title}...`,
                body: `Estimado/a,\n\nNos complace invitarlo al siguiente evento:\n\nEvento: ${newEvent.title}\nFecha: ${newEvent.day} de ${monthName}\nHora: ${newEvent.time}\nLugar: ${newEvent.location || 'Por definir'}\n\nEsperamos contar con su presencia.\n\nAtentamente,\nEquipo Aniquem`,
                date: "Ahora",
                starred: false,
                read: true,
                deleted: false,
                folder: 'sent', // Goes to Sent folder
            });

            // Try real send
            EmailService.sendEmail({
                to_email: guestEmail,
                email_to: guestEmail,
                to_name: guestEmail,
                subject: `Invitación a Aliado: ${newEvent.title}`,
                message: `Estimado/a,\n\nNos complace invitarlo al siguiente evento:\n\nEvento: ${newEvent.title}\nFecha: ${newEvent.day} de ${monthName}\nHora: ${newEvent.time}\nLugar: ${newEvent.location || 'Por definir'}\n\nEsperamos contar con su presencia.\n\nAtentamente,\nEquipo Aniquem`,
                from_name: "Aniquem Events"
            }).then(sent => {
                if (sent) toast.success(`Invitación oficial enviada a ${guestEmail}`);
                else toast.success(`Invitación simulada a ${guestEmail}`);
            });

        } else if (notifyParticipants) {
            toast.success('Evento creado y notificaciones internas enviadas');
        } else {
            toast.success('Evento agregado al calendario');
        }

        setEmails(newEmails);

        setIsModalOpen(false);
        setNewEvent({ title: '', day: '', time: '', location: '', color: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' });
        setNotifyParticipants(false);
        setGuestEmail('');
    };

    const handleSendReminder = () => {
        if (!selectedEvent) return;

        const reminderEmail = {
            id: Date.now(),
            sender: "Sistema de Agenda",
            subject: `Recordatorio: ${selectedEvent.title}`,
            preview: `Recordatorio del evento ${selectedEvent.title} mañana...`,
            body: `Hola,\n\nEste es un recordatorio automático para el evento:\n\nEvento: ${selectedEvent.title}\nFecha: ${selectedEvent.day} de ${monthName}\nHora: ${selectedEvent.time}\n\nNo olvide asistir.\n\nSaludos,\nAniquem Portal`,
            date: "Ahora",
            starred: false,
            read: false,
            label: "Automático",
            deleted: false,
            folder: 'inbox',
        };

        setEmails([reminderEmail, ...emails]);
        toast.success(`Recordatorio enviado para "${selectedEvent.title}"`);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = () => {
        if (!selectedEvent) return;

        // Cancelation Logic: Notify Guest
        if (selectedEvent.guestEmail) {
            const cancellationEmailToGuest = {
                id: Date.now(),
                sender: "Yo",
                subject: `Cancelación: ${selectedEvent.title}`,
                preview: `Lamentamos informarle que el evento ${selectedEvent.title} ha sido cancelado...`,
                body: `Estimado/a,\n\nLamentamos informarle que el evento ${selectedEvent.title} programado para el ${selectedEvent.day} de ${monthName} ha sido cancelado.\n\nDisculpe las molestias.\n\nAtentamente,\nEquipo Aniquem`,
                date: "Ahora",
                starred: false,
                read: true,
                deleted: false,
                folder: 'sent',
            };

            // Real Cancellation Email
            EmailService.sendEmail({
                to_email: selectedEvent.guestEmail,
                email_to: selectedEvent.guestEmail,
                to_name: selectedEvent.guestEmail,
                subject: `CANCELACIÓN: ${selectedEvent.title}`,
                message: `Estimado/a,\n\nLamentamos informarle que el evento ${selectedEvent.title} programado para el ${selectedEvent.day} de ${monthName} ha sido cancelado.\n\nDisculpe las molestias.\n\nAtentamente,\nEquipo Aniquem`,
                from_name: "Aniquem Events"
            });
            // Also simulate a notification to the user (Inbox) confirming the cancelation was sent
            const cancellationConfirmation = {
                id: Date.now() + 1,
                sender: "Sistema de Agenda",
                subject: `Confirmación de Cancelación: ${selectedEvent.title}`,
                preview: `Se ha enviado la notificación de cancelación a ${selectedEvent.guestEmail}...`,
                body: `Hola,\n\nSe ha eliminado el evento "${selectedEvent.title}" y se ha enviado un correo de cancelación a ${selectedEvent.guestEmail}.\n\nSaludos,\nSistema`,
                date: "Ahora",
                starred: false,
                read: false,
                label: "Automático",
                deleted: false,
                folder: 'inbox',
            };
            setEmails([cancellationConfirmation, cancellationEmailToGuest, ...emails]);
            toast.success(`Evento eliminado y notificación enviada a ${selectedEvent.guestEmail}`);
        } else {
            setEvents(events.filter(e => e.id !== selectedEvent.id));
            toast.success('Evento eliminado');
        }

        // Ensure event is actually deleted from state in both cases
        setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
        setSelectedEvent(null);
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Create calendar grid array
    const calendarDays = Array.from({ length: 42 }, (_, i) => {
        const dayNumber = i - firstDay + 1;
        return (dayNumber > 0 && dayNumber <= daysInMonth) ? dayNumber : null;
    });

    // Sidebar: Upcoming Events Logic
    const upcomingEvents = [...events].filter(e => {
        const eventDate = new Date(e.year, e.month, e.day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }).sort((a, b) => {
        const dateA = new Date(a.year, a.month, a.day);
        const dateB = new Date(b.year, b.month, b.day);
        if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
        return a.time.localeCompare(b.time);
    }).slice(0, 6); // Just show next 6 events for clarity


    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground capitalize">Calendario de Actividades</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition flex items-center shadow-sm"
                >
                    <Plus className="h-5 w-5 mr-1" />
                    Nuevo Evento
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
                {/* Main Calendar Space */}
                <div className="flex-1 flex flex-col bg-card rounded-lg shadow overflow-hidden border border-border">
                    {/* Calendar Header */}
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <h2 className="text-lg font-bold text-foreground capitalize">{monthName}</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={fetchCalendarData}
                                disabled={isLoading}
                                className="p-2 hover:bg-muted rounded-full shadow-sm border border-input text-foreground transition-all"
                                title="Sincronizar con Google Sheets"
                            >
                                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full shadow-sm border border-input text-foreground">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full shadow-sm border border-input text-foreground">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                        {days.map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-border overflow-y-auto lg:overflow-visible">
                        {calendarDays.map((day, i) => {
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            const dayEvents = events.filter(e =>
                                e.day === day &&
                                e.month === currentDate.getMonth() &&
                                e.year === currentDate.getFullYear()
                            );

                            return (
                                <div key={i} className={`min-h-[100px] bg-card p-2 ${!day ? 'bg-muted/10' : ''} hover:bg-muted/20 transition-colors`}>
                                    {day && (
                                        <div className="h-full flex flex-col">
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                                                    {day}
                                                </span>
                                                {dayEvents.length > 0 && <span className="text-xs text-muted-foreground">{dayEvents.length} eventos</span>}
                                            </div>

                                            <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                                {dayEvents.map((event) => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                        className={`text-xs px-2 py-1 rounded border-l-2 ${event.color} border-current opacity-90 hover:opacity-100 cursor-pointer shadow-sm`}
                                                    >
                                                        <p className="font-semibold truncate">{event.title}</p>
                                                        {event.time && <p className="opacity-75 flex items-center scale-90 origin-left"><Clock className="h-3 w-3 mr-1" />{event.time}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Agenda Sidebar */}
                <div className="w-full lg:w-80 flex flex-col space-y-4">
                    <div className="bg-card rounded-lg shadow-sm border border-border p-4 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">Próximos Eventos</h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <Plus className="h-5 w-5 text-primary" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="group cursor-pointer p-3 rounded-xl border border-border bg-muted/5 hover:bg-muted/20 hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2 rounded-lg ${event.color.split(' ')[0]} bg-opacity-20`}>
                                                <CalendarIcon className={`h-4 w-4 ${event.color.split(' ')[1]}`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                                {new Date(event.year, event.month, event.day).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors underline-offset-4 decoration-primary/30 truncate">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center mt-1 text-xs text-muted-foreground space-x-3">
                                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{event.time}</span>
                                                {event.location && <span className="flex items-center truncate max-w-[100px]"><MapPin className="h-3 w-3 mr-1" />{event.location}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-muted/5 rounded-xl border border-dashed border-border mt-4">
                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <h4 className="text-sm font-medium text-muted-foreground">No hay eventos próximos</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 opacity-70">Empieza agendando tu primera reunión con un aliado.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-2 px-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agendar Nuevo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-medium text-foreground">Nuevo Evento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Título del Evento</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Ej. Reunión de Equipo"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Día</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                        value={newEvent.day}
                                        onChange={(e) => setNewEvent({ ...newEvent, day: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Hora</label>
                                    <input
                                        type="time"
                                        className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Ubicación (Opcional)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        className="focus:ring-ring focus:border-ring block w-full pl-10 sm:text-sm border-input rounded-md p-2 border bg-background text-foreground"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="Ej. Sala de Conferencias"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Tipo (Color)</label>
                                <div className="mt-2 flex space-x-2">
                                    {[
                                        { bg: 'bg-blue-200 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', label: 'General' },
                                        { bg: 'bg-red-200 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Importante' },
                                        { bg: 'bg-green-200 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: 'Externo' },
                                        { bg: 'bg-yellow-200 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Alerta' }
                                    ].map((style) => (
                                        <button
                                            key={style.bg}
                                            type="button"
                                            onClick={() => setNewEvent({ ...newEvent, color: `${style.bg} ${style.text}` })}
                                            className={`h-8 w-8 rounded-full ${style.bg} border-2 ${newEvent.color.includes(style.bg.split(' ')[0]) ? 'border-primary' : 'border-transparent'}`}
                                            title={style.label}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Invitar Aliado Externo (Email)</label>
                                <input
                                    type="email"
                                    className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    placeholder="aliado@ejemplo.com"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="notify"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                                    checked={notifyParticipants}
                                    onChange={(e) => setNotifyParticipants(e.target.checked)}
                                />
                                <label htmlFor="notify" className="ml-2 block text-sm text-foreground">
                                    Enviar notificación automática por correo
                                </label>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:text-sm transition-colors"
                                >
                                    Guardar Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-border">
                        <div className={`px-6 py-4 border-b border-border flex justify-between items-center ${selectedEvent.color.split(' ')[0]}`}>
                            <h3 className="text-lg font-bold text-foreground mix-blend-multiply dark:mix-blend-screen">{selectedEvent.title}</h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-foreground/70 hover:text-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center text-foreground">
                                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                                <span>{selectedEvent.day} de {monthName} - {selectedEvent.time}</span>
                            </div>
                            {selectedEvent.location && (
                                <div className="flex items-center text-foreground">
                                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}

                            <div className="pt-4 flex flex-col space-y-2">
                                <button
                                    onClick={handleSendReminder}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Enviar Recordatorio
                                </button>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                    Eliminar Evento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
