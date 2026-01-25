'use client';

import { useState } from 'react';
import { Package, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Asset {
    id: string;
    name: string;
    category: 'laptop' | 'phone' | 'card' | 'equipment' | 'other';
    serialNumber: string;
    assignedDate: string;
    status: 'assigned' | 'returned' | 'pending_return';
    returnDate?: string;
    condition?: string;
}

const mockAssets: Asset[] = [
    {
        id: '1',
        name: 'MacBook Pro 14"',
        category: 'laptop',
        serialNumber: 'MBP-001234',
        assignedDate: '2023-06-15',
        status: 'returned',
        returnDate: '2024-01-18',
        condition: 'Good',
    },
    {
        id: '2',
        name: 'iPhone 13',
        category: 'phone',
        serialNumber: 'IPH-567890',
        assignedDate: '2023-06-15',
        status: 'returned',
        returnDate: '2024-01-18',
        condition: 'Excellent',
    },
    {
        id: '3',
        name: 'Access Card',
        category: 'card',
        serialNumber: 'AC-123456',
        assignedDate: '2023-06-15',
        status: 'pending_return',
    },
    {
        id: '4',
        name: 'External Monitor',
        category: 'equipment',
        serialNumber: 'MON-789012',
        assignedDate: '2023-08-01',
        status: 'pending_return',
    },
];

export default function AssetReturnTrackingPage() {
    const [assets] = useState<Asset[]>(mockAssets);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredAssets = assets.filter((asset) => {
        const matchesSearch =
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusConfig = {
        assigned: { label: 'Assigned', icon: Package, color: 'bg-blue-100 text-blue-800' },
        returned: { label: 'Returned', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
        pending_return: { label: 'Pending Return', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' },
    };

    const stats = {
        total: assets.length,
        returned: assets.filter((a) => a.status === 'returned').length,
        pending: assets.filter((a) => a.status === 'pending_return').length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Asset Return Tracking</h1>
                <p className="text-muted-foreground">
                    Track company assets assigned to departing employee
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Returned</p>
                        <p className="text-2xl font-bold text-green-600">{stats.returned}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Pending Return</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets by name or serial number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Assets List */}
            <div className="space-y-4">
                {filteredAssets.map((asset) => {
                    const StatusIcon = statusConfig[asset.status].icon;
                    return (
                        <Card key={asset.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-semibold text-lg">{asset.name}</h3>
                                            <Badge className={statusConfig[asset.status].color}>
                                                <StatusIcon className="mr-1 h-3 w-3" />
                                                {statusConfig[asset.status].label}
                                            </Badge>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Serial Number</p>
                                                <p className="font-mono">{asset.serialNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Category</p>
                                                <p className="capitalize">{asset.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Assigned Date</p>
                                                <p>{new Date(asset.assignedDate).toLocaleDateString()}</p>
                                            </div>
                                            {asset.returnDate && (
                                                <div>
                                                    <p className="text-muted-foreground">Return Date</p>
                                                    <p>{new Date(asset.returnDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {asset.condition && (
                                                <div>
                                                    <p className="text-muted-foreground">Condition</p>
                                                    <p>{asset.condition}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {asset.status === 'pending_return' && (
                                        <Button size="sm">Mark as Returned</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Summary */}
            {stats.pending === 0 && (
                <Card className="mt-6 bg-green-50 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-900">All Assets Returned</p>
                                <p className="text-sm text-green-700">
                                    All company assets have been successfully returned.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
