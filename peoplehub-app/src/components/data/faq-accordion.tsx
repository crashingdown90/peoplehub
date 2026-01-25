import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
    searchQuery?: string;
    className?: string;
}

export function FAQAccordion({ items, searchQuery = '', className }: FAQAccordionProps) {
    const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(id)) {
            newOpenItems.delete(id);
        } else {
            newOpenItems.add(id);
        }
        setOpenItems(newOpenItems);
    };

    const highlightText = (text: string, query: string) => {
        if (!query) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className={cn('space-y-2', className)}>
            {items.map((item) => {
                const isOpen = openItems.has(item.id);

                return (
                    <Card key={item.id} className="overflow-hidden">
                        <button
                            onClick={() => toggleItem(item.id)}
                            className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-muted/50 transition-colors"
                        >
                            <span className="font-medium flex-1 pr-4">
                                {highlightText(item.question, searchQuery)}
                            </span>
                            <ChevronDown
                                className={cn(
                                    'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                                    isOpen && 'transform rotate-180'
                                )}
                            />
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground border-t">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {highlightText(item.answer, searchQuery)}
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
