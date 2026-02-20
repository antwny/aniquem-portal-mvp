import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Heart } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate network delay for effect
        setTimeout(() => {
            login(email);
            navigate('/');
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding & visual (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-900 opacity-90"></div>

                {/* Decoration Circles */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-black opacity-10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center text-primary-foreground text-center px-12">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500">
                        <img src="/logo.png" alt="Aniquem Logo" className="h-32 w-auto" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Portal de Gestión</h1>
                    <p className="text-lg text-primary-foreground/90 max-w-md leading-relaxed">
                        Sistema integral para la gestión de voluntarios, pacientes y eventos de Aniquem.
                        Juntos construyendo esperanza.
                    </p>
                    <div className="mt-12 flex space-x-2 text-sm opacity-70">
                        <span className="flex items-center"><Heart className="w-4 h-4 mr-1 fill-current" /> Compromiso</span>
                        <span>•</span>
                        <span>Excelencia</span>
                        <span>•</span>
                        <span>Empatía</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-background">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="lg:hidden text-center mb-10">
                        <img className="mx-auto h-20 w-auto" src="/logo.png" alt="Aniquem" />
                        <h2 className="mt-6 text-2xl font-extrabold text-foreground">Portal de Gestión Interna</h2>
                    </div>

                    <div className="text-left mb-8">
                        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Bienvenido</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Ingrese sus credenciales para acceder al sistema.
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="mt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                        Correo Corporativo
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="appearance-none block w-full px-3 py-3 border border-input rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm bg-background text-foreground transition-all"
                                            placeholder="usuario@aniquem.org"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                        Contraseña
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="appearance-none block w-full px-3 py-3 border border-input rounded-xl shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm bg-background text-foreground transition-all pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="h-4 w-4 text-primary focus:ring-primary border-input rounded cursor-pointer"
                                        />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground cursor-pointer">
                                            Recordarme
                                        </label>
                                    </div>

                                    <div className="text-sm">
                                        <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                                            ¿Olvidó su contraseña?
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <>
                                                <LogIn className="w-5 h-5 mr-2" />
                                                Iniciar Sesión
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-8 text-center text-xs text-muted-foreground">
                            <p>© 2024 Asociación de Ayuda al Niño Quemado. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
