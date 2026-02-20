import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Plus, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import useLocalStorage from '../hooks/useLocalStorage';

interface Volunteer {
    id: number;
    name: string;
    role: string;
    status: string;
    email: string;
    joinDate: string;
}

const initialVolunteers: Volunteer[] = [
    { id: 1, name: 'Maria Garcia', role: 'Psicóloga', status: 'Activo', email: 'maria.g@example.com', joinDate: '2023-01-15' },
    { id: 2, name: 'Juan Perez', role: 'Logística', status: 'Activo', email: 'juan.p@example.com', joinDate: '2023-03-20' },
    { id: 3, name: 'Ana Lopez', role: 'Enfermera', status: 'Inactivo', email: 'ana.l@example.com', joinDate: '2022-11-05' },
    { id: 4, name: 'Carlos Diaz', role: 'Conductor', status: 'Activo', email: 'carlos.d@example.com', joinDate: '2023-06-10' },
    { id: 5, name: 'Lucia Minguez', role: 'Trabajadora Social', status: 'De Vacaciones', email: 'lucia.m@example.com', joinDate: '2021-08-22' },
];

const Volunteers: React.FC = () => {
    const [volunteers, setVolunteers] = useLocalStorage<Volunteer[]>('aniquem-volunteers', initialVolunteers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newVolunteer, setNewVolunteer] = useState({ name: '', role: '', email: '', status: 'Activo' });

    const filteredVolunteers = volunteers.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddVolunteer = (e: React.FormEvent) => {
        e.preventDefault();
        const volunteer: Volunteer = {
            id: Date.now(),
            name: newVolunteer.name,
            role: newVolunteer.role,
            email: newVolunteer.email,
            status: newVolunteer.status,
            joinDate: new Date().toISOString().split('T')[0]
        };
        setVolunteers([...volunteers, volunteer]);
        setIsModalOpen(false);
        setNewVolunteer({ name: '', role: '', email: '', status: 'Activo' });
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(volunteers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Voluntarios");
        XLSX.writeFile(wb, "voluntarios_aniquem.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-foreground">Gestión de Voluntarios</h2>
                <div className="flex space-x-2">
                    <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition flex items-center shadow-sm"
                        onClick={handleExport}
                    >
                        <Download className="h-5 w-5 mr-1" />
                        Exportar
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition flex items-center shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-1" />
                        Nuevo Voluntario
                    </button>
                </div>
            </div>

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                {/* Filters */}
                <div className="p-4 border-b border-border flex gap-4 bg-muted/20">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o rol..."
                            className="pl-9 w-full bg-background border-input rounded-md focus:ring-ring focus:border-ring sm:text-sm py-2 border text-foreground placeholder:text-muted-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center px-3 py-2 border border-border rounded-md text-sm text-foreground bg-background hover:bg-muted transition-colors">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha Ingreso</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredVolunteers.map((person) => (
                                <tr key={person.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${person.name}&background=random`} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-foreground">{person.name}</div>
                                                <div className="text-sm text-muted-foreground">{person.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{person.role}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${person.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                person.status === 'Inactivo' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                            {person.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {person.joinDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredVolunteers.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground bg-card">
                            No se encontraron voluntarios con ese criterio.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Volunteer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                            <h3 className="text-lg font-medium text-foreground">Registrar Voluntario</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddVolunteer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={newVolunteer.name}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={newVolunteer.email}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Rol / Cargo</label>
                                <select
                                    className="mt-1 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={newVolunteer.role}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, role: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Psicóloga">Psicóloga</option>
                                    <option value="Enfermera">Enfermera</option>
                                    <option value="Trabajadora Social">Trabajadora Social</option>
                                    <option value="Logística">Logística</option>
                                    <option value="Conductor">Conductor</option>
                                    <option value="Voluntario General">Voluntario General</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Estado Inicial</label>
                                <select
                                    className="mt-1 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border text-foreground"
                                    value={newVolunteer.status}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, status: e.target.value })}
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                    <option value="De Vacaciones">De Vacaciones</option>
                                </select>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:text-sm transition-colors"
                                >
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Volunteers;
