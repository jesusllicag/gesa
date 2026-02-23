import { Link, router, usePage } from '@inertiajs/react';
import { LogOutIcon, MenuIcon, XIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { logout } from '@/actions/App/Http/Controllers/Client/ClientAuthController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/Client/ClientDashboardController';
import { edit as profileEdit } from '@/actions/App/Http/Controllers/Client/ClientProfileController';
import { Button } from '@/components/ui/button';

interface ClientPortalHeaderProps {
    children?: PropsWithChildren['children'];
}

export function ClientPortalHeader({ children }: ClientPortalHeaderProps) {
    const { url } = usePage();
    const clientAuth = usePage().props.clientAuth as { client: { nombre: string } };
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

                {/* Desktop: acciones */}
                <div className="hidden items-center gap-3 sm:flex">
                    {children}
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOutIcon className="mr-2 size-4" />
                        Cerrar Sesion
                    </Button>
                </div>

                {/* Mobile: boton hamburguesa */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Menu"
                >
                    {isMenuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
                </Button>
            </div>

            {/* Desktop: tabs de navegacion */}
            <div className="mx-auto hidden max-w-7xl px-4 sm:block sm:px-6 lg:px-8">
                <nav className="flex gap-4">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                tab.active
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Mobile: menu desplegable */}
            {isMenuOpen && (
                <div className="border-t sm:hidden">
                    <div className="mx-auto max-w-7xl px-4 py-3">
                        <nav className="mb-3 flex flex-col gap-1">
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        tab.active
                                            ? 'bg-accent text-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex flex-col gap-2 border-t pt-3">
                            {children && <div onClick={() => setIsMenuOpen(false)}>{children}</div>}
                            <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                                <LogOutIcon className="mr-2 size-4" />
                                Cerrar Sesion
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
