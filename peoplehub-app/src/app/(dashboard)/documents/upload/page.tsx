'use client';

import { useState } from 'react';
import { Tag, Search, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DocumentUploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    const categories = ['Policy', 'Contract', 'Form', 'Report', 'Training', 'Other'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Upload logic here
        alert('Document uploaded successfully!');
    };

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
                <p className="text-muted-foreground">
                    Upload and organize documents for your team
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select File</CardTitle>
                        <CardDescription>Choose a document to upload</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                {selectedFile ? (
                                    <div>
                                        <p className="font-medium mb-2">{selectedFile.name}</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            Change File
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-muted-foreground mb-4">
                                            Drag and drop or click to browse
                                        </p>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                        />
                                        <label htmlFor="file-upload">
                                            <Button type="button" variant="outline" asChild>
                                                <span>Choose File</span>
                                            </Button>
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 10MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Document Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Document Details</CardTitle>
                        <CardDescription>Organize and categorize your document</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (optional)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    placeholder="Add a tag..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                <Button type="button" onClick={handleAddTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            <Tag className="mr-1 h-3 w-3" />
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!selectedFile || !category}>
                        Upload Document
                    </Button>
                </div>
            </form>
        </div>
    );
}
