import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SidebarPermissions {
    canListActivos: boolean;
    canListClients: boolean;
    canListServers: boolean;
    canListSolicitudes: boolean;
    canListPolicies: boolean;
    canListUsers: boolean;
}

export interface UserPermissions {
    canCreateUsers: boolean;
    canUpdateUsers: boolean;
    canDeleteUsers: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    sidebarPermissions: SidebarPermissions;
    userPermissions: UserPermissions;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
