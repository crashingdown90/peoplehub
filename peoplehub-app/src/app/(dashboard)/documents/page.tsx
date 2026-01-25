'use client';

import { useState } from 'react';
import { FileText, Folder, Upload, Search, Filter, Download, Eye, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    type: 'contract' | 'policy' | 'form' | 'report' | 'other';
    size: string;
    uploadedAt: string;
    uploadedBy: string;
}

const mockDocuments: Document[] = [
    {
        id: '1',
        name: 'Employee Handbook 2024.pdf',
        category: 'Policies',
        type: 'policy',
        size: '2.5 MB',
        uploadedAt: '2024-01-15',
        uploadedBy: 'HR Department',
    },
    {
        id: '2',
        name: 'Employment Contract - John Doe.pdf',
        category: 'Contracts',
        type: 'contract',
        size: '1.2 MB',
        uploadedAt: '2024-01-10',
        uploadedBy: 'Legal Team',
    },
    {
        id: '3',
        name: 'Leave Request Form.docx',
        category: 'Forms',
        type: 'form',
        size: '45 KB',
        uploadedAt: '2024-01-05',
        uploadedBy: 'HR Department',
    },
    {
        id: '4',
        name: 'Q4 2023 Performance Report.xlsx',
        category: 'Reports',
        type: 'report',
        size: '890 KB',
        uploadedAt: '2023-12-28',
        uploadedBy: 'Management',
    },
];

export default function DocumentManagementPage() {
    const [documents] = useState<Document[]>(mockDocuments);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
        const matchesType = typeFilter === 'all' || doc.type === typeFilter;
        return matchesSearch && matchesCategory && matchesType;
    });

    const categories = ['Policies', 'Contracts', 'Forms', 'Reports', 'Training'];

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Document Management</h1>
                    <p className="text-muted-foreground">
                        Access and manage company documents
                    </p>
                </div>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Documents</p>
                                <p className="text-2xl font-bold">{documents.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Folder className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Categories</p>
                                <p className="text-2xl font-bold">{categories.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Upload className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Recent Uploads</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Download className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Downloads</p>
                                <p className="text-2xl font-bold">1.2K</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
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
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="contract">Contracts</SelectItem>
                                <SelectItem value="policy">Policies</SelectItem>
                                <SelectItem value="form">Forms</SelectItem>
                                <SelectItem value="report">Reports</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No documents found matching your filters.
                        </CardContent>
                    </Card>
                ) : (
                    filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Preview
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h3 className="font-semibold mb-2 line-clamp-2">{doc.name}</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{doc.category}</Badge>
                                        <Badge variant="secondary">{doc.type}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Size: {doc.size}</p>
                                        <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        <p>By: {doc.uploadedBy}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
