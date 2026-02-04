import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { BookOpen, Box, Folder, LayoutGrid, Server, User, Users } from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as indexClients } from '@/routes/clients';
import { index as indexPolicies } from '@/routes/policies';
import { index as indexServers } from '@/routes/servers';
import { index as indexUsers } from '@/routes/users';
import { type NavItem, type SharedData } from '@/types';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { sidebarPermissions } = usePage<SharedData>().props;

    const mainNavItems = useMemo<NavItem[]>(() => {
        const items: NavItem[] = [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Activos',
                href: '/',
                icon: Box,
            },
        ];

        if (sidebarPermissions.canListClients) {
            items.push({
                title: 'Clientes',
                href: indexClients(),
                icon: Users,
            });
        }

        if (sidebarPermissions.canListServers) {
            items.push({
                title: 'Servidores',
                href: indexServers(),
                icon: Server,
            });
        }

        return items;
    }, [sidebarPermissions]);

    const footerNavItems = useMemo<NavItem[]>(() => {
        const items: NavItem[] = [];

        if (sidebarPermissions.canListUsers) {
            items.push({
                title: 'Usuarios',
                href: indexUsers(),
                icon: User,
            });
        }

        if (sidebarPermissions.canListPolicies) {
            items.push({
                title: 'Politicas',
                href: indexPolicies(),
                icon: Folder,
            });
        }

        items.push({
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        });

        return items;
    }, [sidebarPermissions]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
