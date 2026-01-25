import React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface DocumentVersionBadgeProps {
    version: string;
    effectiveDate?: Date | string;
    isLatest?: boolean;
    className?: string;
}

export function DocumentVersionBadge({
    version,
    effectiveDate,
    isLatest = false,
    className,
}: DocumentVersionBadgeProps) {
    const formatDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(dateObj);
    };

    return (
        <div className={cn('flex items-center gap-2 flex-wrap', className)}>
            <Badge variant={isLatest ? 'default' : 'secondary'}>
                Versi {version}
            </Badge>
            {effectiveDate && (
                <span className="text-sm text-muted-foreground">
                    Berlaku sejak {formatDate(effectiveDate)}
                </span>
            )}
            {isLatest && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                    Terbaru
                </Badge>
            )}
        </div>
    );
}
