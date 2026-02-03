import { Link } from '@inertiajs/react';
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
import { type NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
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
    {
        title: 'Clientes',
        href: indexClients(),
        icon: Users,
    },
    {
        title: 'Servidores',
        href: indexServers(),
        icon: Server,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Usuarios',
        href: indexUsers(),
        icon: User,
    },
    {
        title: 'Politicas',
        href: indexPolicies(),
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
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
