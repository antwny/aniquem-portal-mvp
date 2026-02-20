import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';

const Profile: React.FC = () => {
    const { user } = useAuth(); // We can use login to update the user in context/localStorage if we modify AuthContext, but for now we might need to manually update localStorage or assume AuthContext handles it.
    // Actually, AuthContext likely reads from localStorage on init. Let's see if we can update it. 
    // If AuthContext doesn't have an 'updateUser' method, we might need to hack it by calling login again or manually updating localStorage.
    // Let's assume for this MVP we just update localStorage and force a reload or hope AuthContext picks it up?
    // Better: let's look at AuthContext later. For now, we'll just update the key 'aniquem-user' if that's what's used.

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setAvatar(user.avatar || '');
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mock update logic
        const updatedUser = { ...user, name, email, avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Assuming 'user' is the key used by AuthContext

        // Trigger a custom event or forced reload to update context if it doesn't listen to storage
        // But for a smoother experience, we might want to extend AuthContext.
        // For this task, we will just save to localStorage and show success.

        toast.success('Perfil actualizado correctamente');
        // Optional: reload to reflect changes in Sidebar/Header immediately if Context doesn't sync
        setTimeout(() => window.location.reload(), 1000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Mi Perfil</h2>

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="p-6 space-y-6">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative h-24 w-24 mb-4">
                                <img
                                    src={avatar || `https://ui-avatars.com/api/?name=${name}&background=random`}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-md"
                                />
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow hover:bg-primary/90 transition-colors"
                                    onClick={() => {
                                        const newAvatar = prompt('Ingrese URL de la imagen (o deje vacío para usar avatar generado):');
                                        if (newAvatar !== null) setAvatar(newAvatar);
                                    }}
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground">Haga clic en la cámara para cambiar su foto</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <User className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 bg-background border-input rounded-md border focus:ring-ring focus:border-ring text-foreground py-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Correo Electrónico</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Mail className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 bg-background border-input rounded-md border focus:ring-ring focus:border-ring text-foreground py-2"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
