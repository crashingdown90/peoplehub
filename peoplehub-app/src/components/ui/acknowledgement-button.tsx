import React from 'react';
import { Button } from './button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcknowledgementButtonProps {
    documentId: string;
    documentVersion: string;
    isAcknowledged?: boolean;
    onAcknowledge: (documentId: string, version: string) => Promise<void>;
    className?: string;
    disabled?: boolean;
}

export function AcknowledgementButton({
    documentId,
    documentVersion,
    isAcknowledged = false,
    onAcknowledge,
    className,
    disabled = false,
}: AcknowledgementButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [acknowledged, setAcknowledged] = React.useState(isAcknowledged);

    const handleClick = async () => {
        if (acknowledged || disabled) return;

        setIsLoading(true);
        try {
            await onAcknowledge(documentId, documentVersion);
            setAcknowledged(true);
        } catch (error) {
            console.error('Failed to acknowledge document:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (acknowledged) {
        return (
            <Button
                variant="outline"
                disabled
                className={cn('gap-2', className)}
            >
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sudah Dibaca & Dipahami
            </Button>
        );
    }

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={cn('gap-2', className)}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Saya Memahami
        </Button>
    );
}
