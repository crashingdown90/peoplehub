'use client';

import { useState } from 'react';
import { Share2, Copy, Mail, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const shareUrl = url || window.location.href;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url: shareUrl,
                });

                toast({
                    title: 'Shared successfully',
                    description: 'Content has been shared',
                });
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);

            toast({
                title: 'Link copied',
                description: 'Link has been copied to clipboard',
            });

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying:', error);
        }
    };

    const handleEmailShare = () => {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
        window.location.href = mailtoLink;
    };

    const handleWhatsAppShare = () => {
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        window.open(whatsappLink, '_blank');
    };

    // Check if native share is supported
    const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    if (supportsNativeShare) {
        return (
            <Button onClick={handleNativeShare} variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                        <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy Link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmailShare}>
                    <Mail className="mr-2 h-4 w-4" />
                    Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsAppShare}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
