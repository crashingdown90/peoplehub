'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Download, Trash2, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DocumentVersion {
    id: string;
    version: number;
    uploadedBy: string;
    uploadedAt: string;
    changes: string;
}

interface Document {
    id: string;
    name: string;
    category: string;
    currentVersion: number;
    versions: DocumentVersion[];
    size: string;
}

const mockDocument: Document = {
    id: '1',
    name: 'Employee Handbook 2024.pdf',
    category: 'Policy',
    currentVersion: 3,
    size: '2.5 MB',
    versions: [
        {
            id: 'v3',
            version: 3,
            uploadedBy: 'Jane Doe (HR)',
            uploadedAt: '2024-01-15T10:30:00',
            changes: 'Added remote work policy section',
        },
        {
            id: 'v2',
            version: 2,
            uploadedBy: 'John Smith (HR)',
            uploadedAt: '2023-12-01T14:20:00',
            changes: 'Updated leave policy and benefits',
        },
        {
            id: 'v1',
            version: 1,
            uploadedBy: 'Sarah Johnson (HR)',
            uploadedAt: '2023-06-15T09:00:00',
            changes: 'Initial version',
        },
    ],
};

export default function DocumentVersionHistoryPage() {
    const [document] = useState<Document>(mockDocument);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVersions = document.versions.filter((version) =>
        version.changes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        version.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/documents">
                    <Button variant="ghost" size="sm" className="mb-4">
                        ← Back to Documents
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Version History</h1>
                <p className="text-muted-foreground">{document.name}</p>
            </div>

            {/* Document Info */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Document Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <Badge variant="secondary">{document.category}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Version</p>
                            <p className="font-semibold">v{document.currentVersion}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">File Size</p>
                            <p className="font-semibold">{document.size}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Versions</p>
                            <p className="font-semibold">{document.versions.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search versions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Version History */}
            <div className="space-y-4">
                {filteredVersions.map((version, index) => (
                    <Card key={version.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="font-semibold text-lg">
                                            Version {version.version}
                                        </h3>
                                        {version.version === document.currentVersion && (
                                            <Badge>Current</Badge>
                                        )}
                                        {index === 0 && version.version !== document.currentVersion && (
                                            <Badge variant="secondary">Latest</Badge>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            <span>{version.changes}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {new Date(version.uploadedAt).toLocaleString()} by{' '}
                                                {version.uploadedBy}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    {version.version !== document.currentVersion && (
                                        <Button variant="outline" size="sm">
                                            Restore
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload New Version
                </Button>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download All Versions
                </Button>
            </div>
        </div>
    );
}
