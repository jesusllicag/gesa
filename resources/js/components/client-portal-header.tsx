import { Link, router, usePage } from '@inertiajs/react';
import { LogOutIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button';
import { edit as profileEdit } from '@/actions/App/Http/Controllers/Client/ClientProfileController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/Client/ClientDashboardController';
import { logout } from '@/actions/App/Http/Controllers/Client/ClientAuthController';

interface ClientPortalHeaderProps {
    children?: PropsWithChildren['children'];
}

export function ClientPortalHeader({ children }: ClientPortalHeaderProps) {
    const { url } = usePage();
    const clientAuth = usePage().props.clientAuth as { client: { nombre: string } };

    const handleLogout = () => {
        router.post(logout.url());
    };

    const tabs = [
        { label: 'Dashboard', href: dashboardIndex.url(), active: url.startsWith('/client/dashboard') },
        { label: 'Perfil', href: profileEdit.url(), active: url.startsWith('/client/profile') },
    ];

    return (
        <header className="border-b">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-xl font-semibold">Portal de Clientes</h1>
                    <p className="text-muted-foreground text-sm">{clientAuth.client.nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                    {children}
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOutIcon className="mr-2 size-4" />
                        Cerrar Sesion
                    </Button>
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-4">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                tab.active
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
