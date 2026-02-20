import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl mb-2">404</h1>
                <h2 className="text-2xl font-bold text-foreground mb-4">Página no encontrada</h2>
                <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
                <div className="flex justify-center">
                    <Link
                        to="/"
                        className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 md:py-4 md:text-lg md:px-8 transition-colors"
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
