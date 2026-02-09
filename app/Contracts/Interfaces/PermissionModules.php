<?php

namespace App\Contracts\Interfaces;

interface PermissionModules
{
    public const MODULE_USERS = 'users';

    public const MODULE_SERVERS = 'servers';

    public const MODULE_CLIENTS = 'clients';

    public const MODULE_ACTIVOS = 'activos';

    public const MODULES = [
        self::MODULE_USERS => 'Usuarios',
        self::MODULE_SERVERS => 'Servidores',
        self::MODULE_CLIENTS => 'Clientes',
        self::MODULE_ACTIVOS => 'Activos',
    ];
}
