import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import * as React from 'react';

import { ButtonProps, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
    return (
        <nav
            role="navigation"
            aria-label="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        />
    );
}
Pagination.displayName = 'Pagination';

function PaginationContent({
    className,
    ...props
}: React.ComponentProps<'ul'>) {
    return (
        <ul
            className={cn('flex flex-row items-center gap-1', className)}
            {...props}
        />
    );
}
PaginationContent.displayName = 'PaginationContent';

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li className={cn('', className)} {...props} />;
}
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
    isActive?: boolean;
    disabled?: boolean;
    size?: ButtonProps['size'];
} & React.ComponentProps<typeof Link>;

function PaginationLink({
    className,
    isActive,
    disabled,
    size = 'icon',
    ...props
}: PaginationLinkProps) {
    if (disabled) {
        return (
            <span
                aria-disabled="true"
                className={cn(
                    buttonVariants({
                        variant: 'ghost',
                        size,
                    }),
                    'pointer-events-none opacity-50',
                    className
                )}
            >
                {props.children}
            </span>
        );
    }

    return (
        <Link
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                buttonVariants({
                    variant: isActive ? 'outline' : 'ghost',
                    size,
                }),
                className
            )}
            {...props}
        />
    );
}
PaginationLink.displayName = 'PaginationLink';

function PaginationPrevious({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink
            aria-label="Ir a la página anterior"
            size="default"
            disabled={disabled}
            className={cn('gap-1 pl-2.5', className)}
            {...props}
        >
            <ChevronLeftIcon className="size-4" />
            <span>Anterior</span>
        </PaginationLink>
    );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink
            aria-label="Ir a la página siguiente"
            size="default"
            disabled={disabled}
            className={cn('gap-1 pr-2.5', className)}
            {...props}
        >
            <span>Siguiente</span>
            <ChevronRightIcon className="size-4" />
        </PaginationLink>
    );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex h-9 w-9 items-center justify-center',
                className
            )}
            {...props}
        >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Más páginas</span>
        </span>
    );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
};
