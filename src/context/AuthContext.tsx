import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage for persistent mock login
        const storedUser = localStorage.getItem('aniquem_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);


    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwRJ_VEcURoeHmbdJvE1NWtQpuk6U5hSs_vP6D7T7oOkO77IqBSAwkw_ZTVp11eOoEA/exec';

    const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
        if (!email || !password) return { success: false, message: 'Faltan credenciales' };

        try {
            // Validación en Servidor (Apps Script)
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    email,
                    password,
                    action: 'login',
                    apiKey: "ANIQUEM_SECRET_KEY_2026"
                })
            });

            const result = await response.json();

            if (result.status === "error") {
                return { success: false, message: result.message || 'Error de acceso' };
            }

            const userData: User = {
                id: result.id || Date.now().toString(),
                name: result.name || email.split('@')[0],
                email: email,
                role: result.role || 'user',
                avatar: `https://ui-avatars.com/api/?name=${result.name || result.id}&background=E30613&color=fff`
            };

            setUser(userData);
            localStorage.setItem('aniquem_user', JSON.stringify(userData));
            return { success: true };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'No se pudo conectar con el servidor de seguridad.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aniquem_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
