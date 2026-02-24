import React, { useState, useEffect } from 'react';
import { Search, Plus, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: string;
}

const Users: React.FC = () => {
    // Estas URLs deben ser las mismas que en AuthContext
    const USERS_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVRyUpYEdCDrSy-caeca47LZ3Op-oLADLrQe9QV1RzwkaBXuLClZEQRwREt8tQZyAfGOYvdK7c2_tA/pub?gid=450712134&single=true&output=csv';
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwRJ_VEcURoeHmbdJvE1NWtQpuk6U5hSs_vP6D7T7oOkO77IqBSAwkw_ZTVp11eOoEA/exec';

    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchUsers = async () => {
        if (!USERS_SHEETS_CSV_URL) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${USERS_SHEETS_CSV_URL}&t=${Date.now()}`);
            const text = await response.text();
            const rows = text.split('\n').filter(row => row.trim() !== '');

            if (rows.length > 1) {
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                const data = rows.slice(1).map((row, idx) => {
                    const values = row.split(',').map(v => v.trim());
                    const obj: any = { id: idx.toString() };
                    headers.forEach((h, i) => { obj[h] = values[i]; });
                    return obj as UserItem;
                });
                setUsers(data);
            }
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const action = isEditing ? 'UPDATE' : 'CREATE';

        // Estructura de columnas según Apps Script: email, password, name, role
        // Para UPDATE, el script busca por rows[i][0] (email en este caso)
        const payload = {
            action: action,
            sheet: 'Usuarios',
            id: formData.email, // Usamos el email como ID para la búsqueda en el script
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role
        };

        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            toast.success(isEditing ? 'Usuario actualizado' : 'Usuario registrado', {
                description: 'Los cambios se sincronizarán con la nube en breve.'
            });

            setIsModalOpen(false);
            if (isEditing) {
                setUsers(users.map(u => u.email === formData.email ? { ...u, ...formData } : u));
            } else {
                setUsers([...users, { id: Date.now().toString(), ...formData }]);
            }
            resetForm();
        } catch (error) {
            toast.error('Error en la operación');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (email: string) => {
        setIsLoading(true);
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'DELETE',
                    sheet: 'Usuarios',
                    id: email
                })
            });

            setUsers(users.filter(u => u.email !== email));
            toast.success('Usuario eliminado');
            setDeleteId(null);
        } catch (error) {
            toast.error('Error al eliminar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setIsEditing(false);
    };

    const openEditModal = (user: UserItem) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: user.password || '',
            role: user.role
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h2>
                        <p className="text-sm text-muted-foreground">Control de acceso al sistema</p>
                    </div>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <button
                        onClick={fetchUsers}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none justify-center border border-border bg-background text-foreground px-4 py-2 rounded-xl hover:bg-muted transition flex items-center shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none justify-center bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-red-700 transition flex items-center shadow-lg"
                    >
                        <Plus className="h-5 w-5 mr-1" />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="bg-card shadow-xl rounded-2xl overflow-hidden border border-border">
                <div className="p-4 border-b border-border flex gap-4 bg-muted/20">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="pl-9 w-full bg-background border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm py-2 border text-foreground placeholder:text-muted-foreground transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perfil</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredUsers.map((person) => (
                                <tr key={person.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full border border-border" src={`https://ui-avatars.com/api/?name=${person.name}&background=random&color=fff`} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-foreground">{person.name}</div>
                                                <div className="text-xs text-muted-foreground">ID: {person.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-muted-foreground">{person.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                      ${person.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                                'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
                                            {person.role === 'admin' ? 'Administrador' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => openEditModal(person)}
                                                className="text-primary hover:text-red-700 transition-all p-2 rounded-lg hover:bg-primary/10"
                                                title="Editar Usuario"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(person.email)}
                                                className="text-muted-foreground hover:text-red-600 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Eliminar Usuario"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && !isLoading && (
                        <div className="p-16 text-center bg-card">
                            <h3 className="text-lg font-medium text-foreground">No se encontraron usuarios</h3>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                            <h3 className="text-lg font-bold text-foreground">
                                {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full bg-background border-border rounded-xl p-3 border text-foreground"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    disabled={isEditing}
                                    className={`block w-full bg-background border-border rounded-xl p-3 border text-foreground ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">
                                    {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                                </label>
                                <input
                                    type="password"
                                    required={!isEditing}
                                    className="block w-full bg-background border-border rounded-xl p-3 border text-foreground"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Rol en el Sistema</label>
                                <select
                                    className="block w-full bg-background border-border rounded-xl p-3 border text-foreground"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">Usuario Estándar</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold p-3 rounded-xl shadow-lg hover:bg-red-700 transition-all active:scale-95">
                                    {isLoading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Cuenta')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeleteId(null)} />
                    <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar Usuario?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Esta acción eliminará la cuenta de <span className="font-bold text-foreground">{deleteId}</span> permanentemente del sistema.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-xl border border-border font-bold text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-500/20"
                            >
                                {isLoading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
