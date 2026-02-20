import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
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

    const USERS_SHEETS_CSV_URL: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVRyUpYEdCDrSy-caeca47LZ3Op-oLADLrQe9QV1RzwkaBXuLClZEQRwREt8tQZyAfGOYvdK7c2_tA/pub?gid=450712134&single=true&output=csv'; // Pega aquí el link del CSV de la pestaña "Usuarios"

    const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
        if (!email || !password) return { success: false, message: 'Faltan credenciales' };

        if (!USERS_SHEETS_CSV_URL) {
            return { success: false, message: 'Sistema en mantenimiento: Falta configurar URL de validación.' };
        }

        try {
            const urlWithCacheBuster = USERS_SHEETS_CSV_URL.includes('?')
                ? `${USERS_SHEETS_CSV_URL}&t=${Date.now()}`
                : `${USERS_SHEETS_CSV_URL}?t=${Date.now()}`;

            const response = await fetch(urlWithCacheBuster, { cache: 'no-store' });
            const text = await response.text();

            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length <= 1) return { success: false, message: 'Base de datos de usuarios vacía.' };

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            const usersData = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                const obj: any = {};
                headers.forEach((h, i) => { obj[h] = values[i]; });
                return obj;
            });

            // Validación Real: Email y Password coinciden
            const validUser = usersData.find(u => u.email === email && u.password === password);

            if (validUser) {
                const userData: User = {
                    id: Date.now().toString(),
                    name: validUser.name || email.split('@')[0],
                    email: email,
                    avatar: `https://ui-avatars.com/api/?name=${validUser.name || email}&background=E30613&color=fff`
                };

                setUser(userData);
                localStorage.setItem('aniquem_user', JSON.stringify(userData));
                return { success: true };
            } else {
                return { success: false, message: 'Correo o contraseña incorrectos.' };
            }

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Error de red: No se pudo verificar la cuenta.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aniquem_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
