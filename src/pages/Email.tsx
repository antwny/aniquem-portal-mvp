
import React, { useState, useRef } from 'react';
import { Search, Star, Send, Inbox, Trash2, X, Paperclip, Image as ImageIcon, MoreVertical, ArrowLeft, Reply, Forward, Calendar, RefreshCw } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { toast } from 'sonner';
import { EmailService } from '../services/EmailService';

interface Attachment {
    name: string;
    size: string;
    type: string;
}

interface Email {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    body?: string; // Full content
    date: string;
    starred: boolean;
    read: boolean;
    label?: string;
    deleted?: boolean;
    folder: 'inbox' | 'sent' | 'trash';
    attachments?: Attachment[];
}

const mockEmails: Email[] = [
    {
        id: 1,
        sender: "Voluntariado Aniquem",
        subject: "Horarios Octubre",
        preview: "Hola equipo, adjunto los horarios para el mes de octubre...",
        body: "Hola equipo,\n\nAdjunto los horarios para el mes de octubre. Por favor revisar sus turnos y confirmar asistencia antes del viernes.\n\nSaludos,\nCoordinación de Voluntariado",
        date: "10:30 AM",
        starred: true,
        read: false,
        label: "Importante",
        deleted: false,
        folder: 'inbox',
        attachments: [{ name: "Horarios_Oct.pdf", size: "1.2 MB", type: "pdf" }]
    },
    {
        id: 2,
        sender: "Recursos Humanos",
        subject: "Bienvenida nuevos miembros",
        preview: "Demos la bienvenida a los nuevos voluntarios de psicología...",
        body: "Estimados todos,\n\nDemos la bienvenida a los nuevos voluntarios de psicología que se unen a nosotros esta semana. Estamos muy emocionados de contar con su apoyo.\n\nAtentamente,\nRRHH",
        date: "Ayer",
        starred: false,
        read: true,
        deleted: false,
        folder: 'inbox'
    },
    {
        id: 3,
        sender: "Donaciones",
        subject: "Reporte Mensual",
        preview: "El reporte de donaciones de septiembre ya está disponible en el drive...",
        body: "Hola,\n\nEl reporte de donaciones de septiembre ya está disponible en el drive compartido. Tuvimos un incremento del 15% respecto al mes anterior.\n\nSaludos.",
        date: "2 Oct",
        starred: false,
        read: true,
        deleted: false,
        folder: 'inbox'
    },
    {
        id: 4,
        sender: "Soporte TI",
        subject: "Mantenimiento programado",
        preview: "El sistema estará en mantenimiento este sábado de 2am a 4am...",
        body: "El sistema estará en mantenimiento este sábado de 2am a 4am para realizar actualizaciones de seguridad. Disculpen las molestias.",
        date: "1 Oct",
        starred: false,
        read: true,
        label: "Sistema",
        deleted: false,
        folder: 'inbox'
    },
    {
        id: 5,
        sender: "Juan Perez",
        subject: "Consulta sobre paciente",
        preview: "Estimados, tengo una consulta sobre el paciente del caso 402...",
        body: "Estimados,\n\nTengo una consulta sobre el paciente del caso 402. Necesito verificar si ya se le programó la cita de seguimiento.\n\nGracias,\nJuan",
        date: "28 Sep",
        starred: true,
        read: true,
        deleted: false,
        folder: 'inbox'
    },
];

// URL del CSV de Google Sheets para Correos (puede ser la misma o una diferente)
const EMAIL_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxPXrwBZkE3qRWOOtgbCf4KviAqr8LBN1rup3t-2EOXCMJOHaKFRXf2QqAampTEUCS9O925vYDC2Tw/pub?output=csv';

const Email: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'inbox' | 'sent' | 'trash'>('inbox');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'starred'>('all');
    const [emails, setEmails] = useLocalStorage<Email[]>('aniquem-emails', mockEmails);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [newEmail, setNewEmail] = useState({ to: '', subject: '', message: '' });
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    const fetchEmailData = async () => {
        if (!EMAIL_SHEETS_CSV_URL) {
            toast.info('Sin URL', { description: 'Configura la URL del CSV en Email.tsx' });
            return;
        }

        setIsLoading(true);
        try {
            // Cache busting to ensure we get fresh data from Google Sheets
            const urlWithCacheBuster = EMAIL_SHEETS_CSV_URL.includes('?')
                ? `${EMAIL_SHEETS_CSV_URL}&t=${Date.now()}`
                : `${EMAIL_SHEETS_CSV_URL}?t=${Date.now()}`;

            const response = await fetch(urlWithCacheBuster, { cache: 'no-store' });
            const text = await response.text();

            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length <= 1) {
                toast.warning('Sin correos nuevos', { description: 'No se encontraron registros en el Sheets.' });
                return;
            }

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            // Expected headers: id, sender, subject, preview, body, date, starred, read, label, folder
            const newEmailsFromSheet: Email[] = rows.slice(1).map((row, index) => {
                const values = row.split(',').map(v => v.trim());
                const obj: any = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });

                const sender = obj.sender || obj.remitente || obj.from || 'Remitente Desconocido';
                const subject = obj.subject || obj.asunto || 'Sin Asunto';
                const date = obj.date || obj.fecha || 'Ahora';

                return {
                    id: parseInt(obj.id) || (2000000 + index), // IDs altos para evitar conflictos con mocks
                    sender,
                    subject,
                    preview: obj.preview || (obj.body || obj.contenido || obj.text ? (obj.body || obj.contenido || obj.text).substring(0, 50) + '...' : 'Sin contenido'),
                    body: obj.body || obj.contenido || obj.text || obj.preview || '',
                    date,
                    starred: (obj.starred || obj.destacado)?.toLowerCase() === 'true',
                    read: (obj.read || obj.leido)?.toLowerCase() === 'true',
                    label: obj.label || obj.etiqueta || 'Nuevo',
                    deleted: (obj.deleted || obj.eliminado)?.toLowerCase() === 'true' || false,
                    folder: (obj.folder || obj.carpeta || 'inbox') as 'inbox' | 'sent' | 'trash',
                    attachments: []
                };
            });

            // Logic: Merge with local data based on a combination of ID and unique fields
            setEmails(prev => {
                // Keep "Sent" emails and "Trash" (if they were deleted locally)
                const localOnly = prev.filter(e => e.folder === 'sent' || (e.folder === 'trash' && e.deleted));

                // For the Inbox, we use the Sheet as the Source of Truth
                // but we keep Mock emails if they haven't been "overridden" by the sheet
                const existingInbox = prev.filter(e => e.folder === 'inbox' || !e.folder);

                // Deduplicate: If an email with same Subject+Sender exists, prioritize the one from the Sheet
                const sheetKeys = new Set(newEmailsFromSheet.map(e => `${e.sender}-${e.subject}`.toLowerCase()));
                const filteredExisting = existingInbox.filter(e => !sheetKeys.has(`${e.sender}-${e.subject}`.toLowerCase()));

                return [...newEmailsFromSheet, ...filteredExisting, ...localOnly].sort((a, b) => b.id - a.id);
            });

            toast.success('Bandeja sincronizada', {
                description: `Se han cargado ${newEmailsFromSheet.length} mensajes desde Sheets.`
            });
        } catch (error) {
            console.error('Error fetching emails:', error);
            toast.error('Error de sincronización', { description: 'Verifica la conexión y que el Sheets sea público.' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStar = (id: number) => {
        setEmails(emails.map(email =>
            email.id === id ? { ...email, starred: !email.starred } : email
        ));
    };

    const handleDelete = (id: number) => {
        setEmails(emails.map(email =>
            email.id === id ? { ...email, deleted: true, folder: 'trash' } : email
        ));
        toast.error('Correo movido a la papelera');
        if (selectedEmail?.id === id) setSelectedEmail(null);
    };

    const handleRestore = (id: number) => {
        setEmails(emails.map(email =>
            email.id === id ? { ...email, deleted: false, folder: 'inbox' } : email
        ));
        toast.success('Correo restaurado');
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Construct Email Object for Local Storage (History)
        const sentParams: Email = {
            id: Date.now(),
            sender: "Yo", // In a real app, this would be the current user
            subject: newEmail.subject,
            preview: newEmail.message.substring(0, 50) + "...",
            body: newEmail.message,
            date: "Ahora",
            starred: false,
            read: true,
            deleted: false,
            folder: 'sent',
            attachments: attachments.map(file => ({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + " KB",
                type: file.name.split('.').pop() || 'file'
            }))
        };

        // 2. Try to send via EmailJS
        const templateParams = {
            to_email: newEmail.to,
            subject: newEmail.subject,
            message: newEmail.message,
            from_name: "Aniquem Portal User"
        };

        // We import dynamically or use the service we created
        // Assuming EmailService is imported at top of file, but since I can't easily add import with replace_file,
        // I will use a direct logic or assume user adds the import. 
        // Better: I will add the import in a separate `replace_file` call or assume I can rewrite the file header too.
        // For now, I'll stick to the logic flow.

        // Actually, to make this robust, I should have added the import. 
        // I will use `emailjs.send` directly here if I hadn't made the service, but since I made it...
        // Let's assume I'll add the import in a subsequent step or rewrite the file component start.

        // Wait, I can't easily add the import without potentially breaking the file if I don't know the exact lines.
        // `view_file` showed me the imports.

        // Let's use the service.
        const sentReal = await EmailService.sendEmail(templateParams);

        if (sentReal) {
            toast.success(`Correo enviado realmente a ${newEmail.to}`);
        } else {
            toast.info(`Correo simulado guardado en Enviados (Configura EmailJS para envío real)`);
        }

        const updatedEmails = [sentParams, ...emails];
        setEmails(updatedEmails);

        setIsComposeOpen(false);
        setNewEmail({ to: '', subject: '', message: '' });
        setAttachments([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const filteredEmails = emails.filter(email => {
        if (selectedTab === 'trash') return email.folder === 'trash' || email.deleted;
        if (selectedTab === 'sent') return email.folder === 'sent';

        // Base folder filtering
        const isInInbox = (email.folder === 'inbox' || !email.folder) && !email.deleted;
        if (!isInInbox) return false;

        // Status filtering
        if (filterStatus === 'unread') return !email.read;
        if (filterStatus === 'starred') return email.starred;
        return true;
    }).filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.id - a.id);

    const openEmail = (email: Email) => {
        if (!email.read) {
            setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
        }
        setSelectedEmail(email);
    };

    return (
        <div className="h-full flex flex-col bg-card rounded-lg shadow overflow-hidden relative border border-border">
            {/* Email Toolbar */}
            <div className="p-4 border-b border-border space-y-4 bg-muted/30">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 flex-1 mr-4">
                        <h2 className="text-xl font-semibold text-foreground">Correo Interno</h2>
                        <div className="relative rounded-md shadow-sm flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                className="block w-full bg-background border-input rounded-md pl-10 sm:text-sm py-2 border focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground"
                                placeholder="Buscar en el correo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchEmailData}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            title="Sincronizar con Google Sheets"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Sincronizar
                        </button>
                        <button
                            onClick={() => setIsComposeOpen(true)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center shadow-sm"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Redactar
                        </button>
                    </div>
                </div>

                {/* Filter Chips */}
                {!selectedEmail && selectedTab === 'inbox' && (
                    <div className="flex items-center space-x-2 pb-1">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background text-muted-foreground border border-border hover:bg-muted'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterStatus('unread')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === 'unread' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background text-muted-foreground border border-border hover:bg-muted'}`}
                        >
                            No leídos ({emails.filter(e => (e.folder === 'inbox' || !e.folder) && !e.read && !e.deleted).length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('starred')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === 'starred' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background text-muted-foreground border border-border hover:bg-muted'}`}
                        >
                            Destacados
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 bg-muted/10 border-r border-border flex flex-col py-4 hidden md:flex">
                    <button
                        onClick={() => { setSelectedTab('inbox'); setSelectedEmail(null); }}
                        className={`flex items-center px-6 py-2 text-sm font-medium text-left transition-colors ${selectedTab === 'inbox' ? 'bg-background text-primary border-l-4 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <Inbox className="h-4 w-4 mr-3" />
                        Recibidos
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                            {emails.filter(e => (e.folder === 'inbox' || !e.folder) && !e.read && !e.deleted).length}
                        </span>
                    </button>
                    <button
                        onClick={() => { setSelectedTab('sent'); setSelectedEmail(null); }}
                        className={`flex items-center px-6 py-2 text-sm font-medium text-left transition-colors ${selectedTab === 'sent' ? 'bg-background text-primary border-l-4 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <Send className="h-4 w-4 mr-3" />
                        Enviados
                        <span className="ml-auto bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">
                            {emails.filter(e => e.folder === 'sent').length}
                        </span>
                    </button>
                    <button
                        onClick={() => { setSelectedTab('trash'); setSelectedEmail(null); }}
                        className={`flex items-center px-6 py-2 text-sm font-medium text-left transition-colors ${selectedTab === 'trash' ? 'bg-background text-primary border-l-4 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <Trash2 className="h-4 w-4 mr-3" />
                        Papelera
                        <span className="ml-auto bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">
                            {emails.filter(e => e.folder === 'trash' || e.deleted).length}
                        </span>
                    </button>
                </div>

                {/* Email List or Detail View */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {selectedEmail ? (
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelectedEmail(null)}
                                        className="mr-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <h3 className="text-lg font-medium text-foreground">{selectedEmail.subject}</h3>
                                </div>
                                <div className="flex space-x-2">
                                    {selectedEmail.folder === 'trash' ? (
                                        <button
                                            onClick={() => handleRestore(selectedEmail.id)}
                                            className="p-2 text-muted-foreground hover:text-green-600 hover:bg-muted rounded-full"
                                            title="Restaurar"
                                        >
                                            <Inbox className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(selectedEmail.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-primary font-bold text-lg mr-3 ${selectedEmail.label === 'Automático' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-primary/10'}`}>
                                            {selectedEmail.label === 'Automático' || selectedEmail.sender === 'Sistema de Agenda' ? <Calendar className="h-6 w-6" /> : selectedEmail.sender[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{selectedEmail.sender}</div>
                                            <div className="text-sm text-muted-foreground">para mí</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{selectedEmail.date}</div>
                                </div>

                                <div className="prose prose-sm dark:prose-invert max-w-none mb-8 whitespace-pre-wrap text-foreground">
                                    {selectedEmail.body || selectedEmail.preview}
                                </div>

                                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                    <div className="border-t border-border pt-4 mt-8">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            {selectedEmail.attachments.length} Archivos adjuntos
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedEmail.attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center p-3 border border-border rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center mr-3 text-muted-foreground">
                                                        {file.type === 'pdf' ? '📄' : '📎'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{file.size}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-border bg-muted/10">
                                <div className="flex space-x-3">
                                    <button className="flex items-center px-4 py-2 border border-border rounded text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors">
                                        <Reply className="h-4 w-4 mr-2" />
                                        Responder
                                    </button>
                                    <button className="flex items-center px-4 py-2 border border-border rounded text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors">
                                        <Forward className="h-4 w-4 mr-2" />
                                        Reenviar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {filteredEmails.map((email) => (
                                <li
                                    key={email.id}
                                    onClick={() => openEmail(email)}
                                    className={`hover:bg-muted/50 cursor-pointer transition-colors ${!email.read ? 'bg-card' : 'bg-muted/10'}`}
                                >
                                    <div className="px-4 py-4 sm:px-6 flex items-center">
                                        <div className="min-w-0 flex-1 flex items-center">
                                            <div className="flex-shrink-0 mr-4">
                                                <button onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}>
                                                    <Star className={`h-5 w-5 ${email.starred ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} />
                                                </button>
                                            </div>
                                            <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                                <div className="flex items-center">
                                                    <p className={`text-sm truncate mr-2 ${!email.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'} flex items-center`}>
                                                        {(email.label === 'Automático' || email.sender === 'Sistema de Agenda') && <Calendar className="h-3 w-3 mr-1 text-blue-500" />}
                                                        {email.sender}
                                                    </p>
                                                    {email.label && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                                                            {email.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="hidden md:block">
                                                    <div className="flex items-center">
                                                        <p className={`text-sm truncate ${!email.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                            {email.subject}
                                                            <span className="text-muted-foreground/70 font-normal"> - {email.preview}</span>
                                                        </p>
                                                        {email.attachments && (
                                                            <Paperclip className="h-3 w-3 text-muted-foreground ml-2" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0 flex items-center space-x-4">
                                            <p className={`text-sm ${!email.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                                {email.date}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(email.id); }}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {filteredEmails.length === 0 && (
                                <li className="py-12 text-center text-muted-foreground">
                                    No se encontraron correos en esta carpeta.
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:fixed sm:bottom-0 sm:right-10 w-full sm:w-[600px] h-full sm:h-[600px] sm:max-h-[90vh] bg-card sm:rounded-t-lg shadow-2xl border border-border z-50 flex flex-col">
                    <div className="px-4 py-3 bg-primary rounded-t-lg flex justify-between items-center shrink-0">
                        <h3 className="text-base font-medium text-primary-foreground">Mensaje Nuevo</h3>
                        <div className="flex items-center space-x-2">
                            <button className="text-primary-foreground/80 hover:text-primary-foreground sm:hidden">
                                <span className="sr-only">Minimizar</span>
                                _
                            </button>
                            <button onClick={() => setIsComposeOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSend} className="flex-1 flex flex-col p-4 space-y-3 bg-card overflow-y-auto">
                        <div className="space-y-2">
                            <input
                                className="block w-full bg-background border-b border-border focus:border-ring focus:ring-0 text-sm py-2 px-0 text-foreground"
                                placeholder="Para"
                                required
                                value={newEmail.to}
                                onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                            />
                            <input
                                className="block w-full bg-background border-b border-border focus:border-ring focus:ring-0 text-sm py-2 px-0 text-foreground"
                                placeholder="Asunto"
                                required
                                value={newEmail.subject}
                                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                            />
                        </div>

                        {/* Rich Text Toolbar Simulation */}
                        <div className="flex items-center space-x-2 border-b border-border pb-2 mb-2">
                            <button type="button" className="p-1 hover:bg-muted rounded text-muted-foreground font-bold">B</button>
                            <button type="button" className="p-1 hover:bg-muted rounded text-muted-foreground italic">I</button>
                            <button type="button" className="p-1 hover:bg-muted rounded text-muted-foreground underline">U</button>
                            <div className="h-4 w-px bg-border mx-2"></div>
                            <button type="button" className="p-1 hover:bg-muted rounded text-muted-foreground" title="Adjuntar archivo" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                            <button type="button" className="p-1 hover:bg-muted rounded text-muted-foreground" title="Insertar imagen">
                                <ImageIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <textarea
                            className="flex-1 w-full bg-background border-0 focus:ring-0 text-sm p-2 resize-none text-foreground leading-relaxed"
                            placeholder="Escribe tu mensaje aquí..."
                            required
                            value={newEmail.message}
                            onChange={(e) => setNewEmail({ ...newEmail, message: e.target.value })}
                        />

                        {/* Attachments Preview inside Modal */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center text-xs bg-muted text-foreground px-2 py-1 rounded-md border border-border">
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <span className="ml-1 text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>
                                        <button type="button" onClick={() => removeAttachment(idx)} className="ml-2 text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 mt-auto border-t border-border">
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none transition-colors"
                            >
                                Enviar
                            </button>
                            <button type="button" onClick={() => setIsComposeOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Email;
