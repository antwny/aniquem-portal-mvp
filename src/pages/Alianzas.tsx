import React, { useState } from 'react';
import {
    Search,
    MoreHorizontal,
    MessageCircle,
    Mail,
    Handshake,
    ArrowRight,
    Building2,
    FileText,
    RefreshCw,
    Calendar,
    History,
    Plus,
    X,
    User,
    Check,
    Phone,
    ExternalLink,
    AlertTriangle,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import useLocalStorage from '../hooks/useLocalStorage';

interface Alianza {
    id: number;
    empresa: string;
    ruc: string;
    contacto: string;
    canal: 'whatsapp' | 'email';
    estado: 'Nuevo' | 'Contactado' | 'En Negociación' | 'Cerrado' | 'Descartado';
    primer_contacto: string;
    asunto: string;
    contacto_email?: string;
    contacto_telefono?: string;
    documento_url?: string;
    eliminado?: boolean;
    ultima_actualizacion?: string;
}


const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVRyUpYEdCDrSy-caeca47LZ3Op-oLADLrQe9QV1RzwkaBXuLClZEQRwREt8tQZyAfGOYvdK7c2_tA/pub?output=csv';

const Alianzas: React.FC = () => {
    const [alianzas, setAlianzas] = useLocalStorage<Alianza[]>('aniquem-alianzas', []);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlianza, setSelectedAlianza] = useState<Alianza | null>(null);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        empresa: '',
        ruc: '',
        contacto: '',
        contacto_email: '',
        contacto_telefono: '',
        documento_url: '',
        canal: 'email' as 'whatsapp' | 'email',
        asunto: '',
        estado: 'Nuevo' as Alianza['estado']
    });
    const [isEditing, setIsEditing] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwRJ_VEcURoeHmbdJvE1NWtQpuk6U5hSs_vP6D7T7oOkO77IqBSAwkw_ZTVp11eOoEA/exec'; // URL de Make o Google Apps Script

    // Auto-fetch data on mount
    React.useEffect(() => {
        fetchSheetData(true);
    }, []);

    const handleCreateAlianza = async (e: React.FormEvent) => {
        e.preventDefault();

        const newAlianza: Alianza = {
            id: Date.now(),
            empresa: formData.empresa,
            ruc: formData.ruc,
            contacto: formData.contacto,
            canal: formData.canal,
            estado: 'Nuevo',
            primer_contacto: new Date().toISOString().split('T')[0],
            asunto: formData.asunto,
            contacto_email: formData.contacto_email,
            contacto_telefono: formData.contacto_telefono,
            documento_url: formData.documento_url,
            eliminado: false,
            ultima_actualizacion: new Date().toISOString()
        };

        setAlianzas(prev => [newAlianza, ...prev]);
        setIsNewModalOpen(false);
        resetForm();

        syncWithWebhook(newAlianza, 'CREATE');
    };

    const handleUpdateAlianza = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlianza) return;

        const updatedAlianza: Alianza = {
            ...selectedAlianza,
            empresa: formData.empresa,
            ruc: formData.ruc,
            contacto: formData.contacto,
            canal: formData.canal,
            estado: formData.estado,
            asunto: formData.asunto,
            contacto_email: formData.contacto_email,
            contacto_telefono: formData.contacto_telefono,
            documento_url: formData.documento_url,
            ultima_actualizacion: new Date().toISOString()
        };

        setAlianzas(prev => prev.map(a => a.id === updatedAlianza.id ? updatedAlianza : a));
        setSelectedAlianza(updatedAlianza);
        setIsNewModalOpen(false);
        setIsEditing(false);

        syncWithWebhook(updatedAlianza, 'UPDATE');
    };

    const handleDeleteAlianza = async (id: number) => {
        const allianceToDelete = alianzas.find(a => a.id === id);
        if (!allianceToDelete) return;

        const deletedAlianza: Alianza = {
            ...allianceToDelete,
            eliminado: true,
            ultima_actualizacion: new Date().toISOString()
        };

        setAlianzas(prev => prev.map(a => a.id === id ? deletedAlianza : a));
        setSelectedAlianza(null);
        setDeleteId(null);

        syncWithWebhook(deletedAlianza, 'DELETE');
    };

    const syncWithWebhook = async (data: Alianza, action: 'CREATE' | 'UPDATE' | 'DELETE') => {
        if (!WEBHOOK_URL) return;

        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ ...data, action, sheet: 'Alianzas' })
            });
            toast.info('Sincronizando', { description: `Operación ${action} enviada a la nube.` });
        } catch (error) {
            console.error('Webhook error:', error);
            toast.error('Error de sincronización', { description: 'La copia en la nube pudo haber fallado.' });
        }
    };

    const resetForm = () => {
        setFormData({
            empresa: '',
            ruc: '',
            contacto: '',
            contacto_email: '',
            contacto_telefono: '',
            documento_url: '',
            canal: 'email',
            asunto: '',
            estado: 'Nuevo'
        });
        setIsEditing(false);
    };

    const parseCSV = (text: string): string[][] => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if (char === '\n' || char === '\r') {
                    if (char === '\r' && nextChar === '\n') i++;
                    currentRow.push(currentField.trim());
                    if (currentRow.join('').length > 0) rows.push(currentRow);
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
        }
        if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.join('').length > 0) rows.push(currentRow);
        }
        return rows;
    };

    const openEditModal = (alianza: Alianza) => {
        setFormData({
            empresa: alianza.empresa,
            ruc: alianza.ruc,
            contacto: alianza.contacto,
            contacto_email: alianza.contacto_email || '',
            contacto_telefono: alianza.contacto_telefono || '',
            documento_url: alianza.documento_url || '',
            canal: alianza.canal,
            asunto: alianza.asunto,
            estado: alianza.estado
        });
        setIsEditing(true);
        setIsNewModalOpen(true);
    };

    const fetchSheetData = async (silent = false) => {
        if (!SHEETS_CSV_URL) {
            toast.info('Modo simulación', { description: 'Configura una URL de Google Sheets para leer datos reales.' });
            return;
        }

        setIsLoading(true);
        try {
            const urlWithCacheBuster = SHEETS_CSV_URL.includes('?')
                ? `${SHEETS_CSV_URL}&t=${Date.now()}`
                : `${SHEETS_CSV_URL}?t=${Date.now()}`;

            const response = await fetch(urlWithCacheBuster, { cache: 'no-store' });
            const text = await response.text();

            // Parsing robusto de CSV
            const allRows = parseCSV(text);
            if (allRows.length <= 1) {
                toast.warning('Hoja vacía', { description: 'No se encontraron registros en el archivo.' });
                return;
            }

            const headers = allRows[0].map((h: string) => h.trim().toLowerCase());

            const newAlianzas: Alianza[] = allRows.slice(1).map((values: string[], index: number) => {
                const obj: any = {};
                headers.forEach((header: string, i: number) => {
                    obj[header] = values[i];
                });

                return {
                    id: parseInt(obj.id) || (Date.now() - index), // Fallback ID descendente
                    empresa: obj.empresa || 'Empresa Desconocida',
                    ruc: obj.ruc || '00000000000',
                    contacto: obj.contacto || 'Sin Contacto',
                    canal: (obj.canal?.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'email') as 'whatsapp' | 'email',
                    estado: (obj.estado || 'Nuevo') as Alianza['estado'],
                    primer_contacto: obj.primer_contacto || obj.fecha || new Date().toISOString().split('T')[0],
                    asunto: obj.asunto || 'Sin Asunto',
                    contacto_email: obj.contacto_email || '',
                    contacto_telefono: obj.contacto_telefono || '',
                    documento_url: obj.documento_url || '',
                    eliminado: obj.eliminado === 'TRUE' || obj.eliminado === 'true',
                    ultima_actualizacion: obj.ultima_actualizacion || new Date().toISOString()
                };
            });

            // Fusionar: La Nube manda. Solo mantenemos locales que son muy nuevos (buffer de 15 min de Google)
            setAlianzas(prev => {
                const now = Date.now();
                const fifteenMinutes = 15 * 60 * 1000;
                const cloudIds = new Set(newAlianzas.map(a => a.id));

                // Mantener locales solo si no están en la nube Y son recientes (evitar desaparición por delay de publicación)
                const recentlyCreatedLocal = prev.filter(local => {
                    if (cloudIds.has(local.id)) return false;
                    // Los IDs locales son timestamps (Date.now())
                    return (now - local.id) < fifteenMinutes;
                });

                return [...newAlianzas, ...recentlyCreatedLocal].sort((a, b) => b.id - a.id);
            });

            if (!silent) {
                toast.success('Sincronización exitosa', {
                    description: `Se han procesado ${newAlianzas.length} registros.`
                });
            }
        } catch (error) {
            console.error('Error fetching sheet:', error);
            toast.error('Error de sincronización', { description: 'No se pudo conectar con la fuente de datos.' });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (estado: Alianza['estado']) => {
        switch (estado) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Contactado': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'En Negociación': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'Cerrado': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'Descartado': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredAlianzas = alianzas.filter(a =>
        !a.eliminado && (
            a.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.ruc.includes(searchTerm)
        )
    ).sort((a, b) => b.id - a.id);

    // Stats Logic
    const stats = {
        total: filteredAlianzas.length,
        nuevos: filteredAlianzas.filter(a => a.estado === 'Nuevo').length,
        negociacion: filteredAlianzas.filter(a => a.estado === 'En Negociación').length,
        cerrados: filteredAlianzas.filter(a => a.estado === 'Cerrado').length,
    };

    return (
        <div className="space-y-6 relative h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Gestión de Alianzas</h2>
                    <p className="text-muted-foreground mt-1">Control de convenios y prospectos empresariales.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all duration-300 active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Alianza
                </button>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Alianzas', value: stats.total, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Nuevas/Prospectos', value: stats.nuevos, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                    { label: 'En Negociación', value: stats.negociacion, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
                    { label: 'Convenios Cerrados', value: stats.cerrados, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</span>
                            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar empresa o RUC..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchSheetData(false)}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa / RUC</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canal</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primer Contacto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAlianzas.map((alianza) => (
                                <tr
                                    key={alianza.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedAlianza(alianza)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
                                                <Building2 className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground text-sm">{alianza.empresa}</div>
                                                <div className="text-xs text-muted-foreground">{alianza.ruc}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground">{alianza.contacto}</td>
                                    <td className="px-6 py-4">
                                        {alianza.canal === 'whatsapp' ? (
                                            <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-xs font-medium">
                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                WhatsApp
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-xs font-medium">
                                                <Mail className="w-3 h-3 mr-1" />
                                                Email
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{alianza.primer_contacto}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${getStatusColor(alianza.estado)}`}>
                                            {alianza.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedAlianza && (
                <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedAlianza(null)} />
                    <div className="absolute inset-y-0 right-0 max-w-full flex pointer-events-none">
                        <div className="w-screen max-w-md pointer-events-auto transition-transform duration-500 ease-in-out">
                            <div className="h-full flex flex-col bg-card shadow-2xl border-l border-border">
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-foreground">Detalle de Alianza</h3>
                                    <button
                                        onClick={() => setSelectedAlianza(null)}
                                        className="p-2 hover:bg-muted rounded-full text-muted-foreground"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                            <Building2 className="w-8 h-8 text-primary" />
                                        </div>
                                        <h4 className="text-xl font-bold text-foreground">{selectedAlianza.empresa}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">RUC: {selectedAlianza.ruc}</p>
                                        <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedAlianza.estado)}`}>
                                            {selectedAlianza.estado}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-2xl">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Contacto Principal</p>
                                            <p className="text-sm font-semibold text-foreground mt-1">{selectedAlianza.contacto}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Primer Contacto</p>
                                            <p className="text-sm font-semibold text-foreground mt-1 flex items-center">
                                                <Calendar className="w-3 h-3 mr-2 text-primary" />
                                                {selectedAlianza.primer_contacto}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Datos de Contacto</p>
                                            <div className="mt-2 space-y-2">
                                                {selectedAlianza.contacto_email && (
                                                    <a href={`mailto:${selectedAlianza.contacto_email}`} className="flex items-center text-sm font-medium text-blue-600 hover:underline">
                                                        <Mail className="w-3 h-3 mr-2" />
                                                        {selectedAlianza.contacto_email}
                                                    </a>
                                                )}
                                                {selectedAlianza.contacto_telefono && (
                                                    <a href={`tel:${selectedAlianza.contacto_telefono}`} className="flex items-center text-sm font-medium text-green-600 hover:underline">
                                                        <Phone className="w-3 h-3 mr-2" />
                                                        {selectedAlianza.contacto_telefono}
                                                    </a>
                                                )}
                                                {!selectedAlianza.contacto_email && !selectedAlianza.contacto_telefono && (
                                                    <p className="text-xs text-muted-foreground italic">Sin datos adicionales de contacto.</p>
                                                )}
                                            </div>
                                        </div>
                                        {selectedAlianza.documento_url && (
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Documentos / Convenio</p>
                                                <a
                                                    href={selectedAlianza.documento_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3 mr-2" />
                                                    Ver Documento en Drive
                                                </a>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Motivo / Asunto</p>
                                            <p className="text-sm text-foreground mt-1 italic">"{selectedAlianza.asunto}"</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-sm font-bold text-foreground flex items-center">
                                            <History className="w-4 h-4 mr-2 text-primary" />
                                            Historial de Actividad
                                        </h5>
                                        <div className="space-y-4 pl-3 border-l border-border ml-2">
                                            <div className="relative">
                                                <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-background" />
                                                <p className="text-xs text-muted-foreground">Hoy, 10:30 AM</p>
                                                <p className="text-sm text-foreground">El sistema registró automáticamente un mensaje de WhatsApp.</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-muted-foreground/30 border-4 border-background" />
                                                <p className="text-xs text-muted-foreground">Ayer</p>
                                                <p className="text-sm text-foreground">Se envió respuesta automática con link de calendario.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-border bg-muted/50 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => openEditModal(selectedAlianza)}
                                        className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-background transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(selectedAlianza.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* New Alliance Modal */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsNewModalOpen(false)}
                    />
                    <div className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 bg-gradient-to-r from-primary to-red-600">
                            <div className="flex justify-between items-center text-white">
                                <div className="flex items-center">
                                    <div className="p-2 bg-white/10 rounded-lg mr-3">
                                        <Handshake className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-widest">{isEditing ? 'Editar Alianza' : 'Nueva Alianza'}</h3>
                                </div>
                                <button
                                    onClick={() => { setIsNewModalOpen(false); setIsEditing(false); }}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={isEditing ? handleUpdateAlianza : handleCreateAlianza} className="p-6 space-y-4 bg-card overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <div className="group relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Empresa</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="Nombre de la empresa"
                                            value={formData.empresa}
                                            onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group relative">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">RUC</label>
                                        <input
                                            required
                                            maxLength={11}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="20123456789"
                                            value={formData.ruc}
                                            onChange={e => setFormData({ ...formData, ruc: e.target.value.replace(/\D/g, '') })}
                                        />
                                    </div>
                                    <div className="group relative">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Canal</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            value={formData.canal}
                                            onChange={e => setFormData({ ...formData, canal: e.target.value as 'whatsapp' | 'email' })}
                                        >
                                            <option value="email">Email</option>
                                            <option value="whatsapp">WhatsApp</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group relative">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Email de Contacto</label>
                                        <input
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="ejemplo@empresa.com"
                                            value={formData.contacto_email}
                                            onChange={e => setFormData({ ...formData, contacto_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="group relative">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Teléfono / Celular</label>
                                        <input
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="999 999 999"
                                            value={formData.contacto_telefono}
                                            onChange={e => setFormData({ ...formData, contacto_telefono: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Link de Documento / Convenio</label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="https://drive.google.com/..."
                                            value={formData.documento_url}
                                            onChange={e => setFormData({ ...formData, documento_url: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Contacto</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            placeholder="Nombre del contacto"
                                            value={formData.contacto}
                                            onChange={e => setFormData({ ...formData, contacto: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="group relative">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Estado</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground"
                                            value={formData.estado}
                                            onChange={e => setFormData({ ...formData, estado: e.target.value as Alianza['estado'] })}
                                        >
                                            <option value="Nuevo">Nuevo</option>
                                            <option value="Contactado">Contactado</option>
                                            <option value="En Negociación">En Negociación</option>
                                            <option value="Cerrado">Cerrado</option>
                                            <option value="Descartado">Descartado</option>
                                        </select>
                                    </div>
                                )}

                                <div className="group relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground transition-all group-focus-within:text-primary mb-1 block">Asunto / Motivo</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-foreground resize-none"
                                        placeholder="Descripción breve de la alianza..."
                                        value={formData.asunto}
                                        onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center mt-6 active:scale-95"
                            >
                                <Check className="w-5 h-5 mr-2" />
                                {isEditing ? 'Guardar Cambios' : 'Registrar Alianza'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteId(null)} />
                    <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground tracking-tighter mb-2">¿Estás seguro?</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                            Esta acción realizará una <span className="font-bold text-foreground underline decoration-red-500">eliminación lógica</span>.
                            El registro ya no será visible en el portal pero permanecerá en el respaldo.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-6 py-3.5 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteAlianza(deleteId)}
                                className="px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Alianzas;
