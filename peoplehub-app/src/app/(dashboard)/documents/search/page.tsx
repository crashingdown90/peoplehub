'use client';

import { useState } from 'react';
import { Tag, Search, Filter, Grid, List, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Document {
    id: string;
    name: string;
    category: string;
    tags: string[];
    size: string;
    uploadedAt: string;
}

const mockDocuments: Document[] = [
    {
        id: '1',
        name: 'Employee Handbook 2024.pdf',
        category: 'Policy',
        tags: ['handbook', 'policy', '2024'],
        size: '2.5 MB',
        uploadedAt: '2024-01-15',
    },
    {
        id: '2',
        name: 'Leave Request Form.docx',
        category: 'Form',
        tags: ['form', 'leave', 'hr'],
        size: '45 KB',
        uploadedAt: '2024-01-05',
    },
];

export default function DocumentSearchPage() {
    const [documents] = useState<Document[]>(mockDocuments);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const allTags = Array.from(new Set(documents.flatMap((d) => d.tags)));

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch =
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
        const matchesTags =
            selectedTags.length === 0 || selectedTags.some((tag) => doc.tags.includes(tag));
        return matchesSearch && matchesCategory && matchesTags;
    });

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Document Search</h1>
                    <p className="text-muted-foreground">
                        Find documents by name, category, or tags
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Policy">Policy</SelectItem>
                                <SelectItem value="Form">Form</SelectItem>
                                <SelectItem value="Report">Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filter by tags:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => toggleTag(tag)}
                                >
                                    <Tag className="mr-1 h-3 w-3" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredDocuments.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No documents found matching your criteria
                        </CardContent>
                    </Card>
                ) : (
                    filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2 line-clamp-2">{doc.name}</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{doc.category}</Badge>
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {doc.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={`/documents/${doc.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
