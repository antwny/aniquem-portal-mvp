import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Plus, X, ShieldCheck, RefreshCw } from 'lucide-react';
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
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Usamos text/plain para evitar preflight de CORS
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'signup',
                    ...newUser
                })
            });

            toast.success('Usuario registrado', { description: 'Los cambios se verán reflejados en breve.' });
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'user' });

            // Simular actualización local inmediata
            const localNew: UserItem = { id: Date.now().toString(), ...newUser };
            setUsers([...users, localNew]);

        } catch (error) {
            toast.error('Error al registrar usuario');
        } finally {
            setIsLoading(false);
        }
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
                {/* Filters */}
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
                    <button className="flex items-center px-4 py-2 border border-border rounded-xl text-sm text-foreground bg-background hover:bg-muted transition-all">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        Filtros
                    </button>
                </div>

                {/* Table */}
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
                                        <button className="text-muted-foreground hover:text-foreground transition-all p-2 rounded-lg hover:bg-muted">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && !isLoading && (
                        <div className="p-16 text-center bg-card">
                            <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No se encontraron usuarios</h3>
                            <p className="text-muted-foreground">Prueba con otro término de búsqueda o sincroniza con el Excel.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Registrar Nuevo Usuario</h3>
                                <p className="text-xs text-muted-foreground">Se guardará en la pestaña "Usuarios"</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-full transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Antwny Lopez"
                                    className="block w-full bg-background border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm p-3 border text-foreground transition-all"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="usuario@aniquem.org"
                                    className="block w-full bg-background border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm p-3 border text-foreground transition-all"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Contraseña Temporal</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full bg-background border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm p-3 border text-foreground transition-all"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Rol en el Sistema</label>
                                <select
                                    className="block w-full bg-background border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm p-3 border text-foreground transition-all"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">Usuario Estándar</option>
                                    <option value="admin">Administrador (Acceso Total)</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-4 py-3 bg-primary text-base font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
