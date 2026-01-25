'use client';

import React from 'react';
import { HelpCircle, MessageSquare, Phone, FileText, BookOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Sample popular FAQs
const POPULAR_FAQS = [
    { question: 'Bagaimana cara absen harian?', link: '/help/faq#attendance' },
    { question: 'Cara mengajukan cuti', link: '/help/faq#leave' },
    { question: 'Download slip gaji', link: '/help/faq#payroll' },
    { question: 'Lupa password', link: '/help/faq#security' },
];

export default function HelpPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Pusat Bantuan</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Temukan jawaban untuk pertanyaan Anda atau hubungi tim support kami
                </p>
            </div>

            {/* Search */}
            <Card className="max-w-2xl mx-auto">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Input
                            placeholder="Cari bantuan..."
                            className="text-center"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/help/faq?q=${encodeURIComponent(e.currentTarget.value)}`;
                                }
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Tekan Enter untuk mencari
                    </p>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                <Link href="/help/faq">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                <HelpCircle className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>FAQ</CardTitle>
                            <CardDescription>
                                Pertanyaan yang sering diajukan beserta jawabannya
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/support/tickets">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Buat Tiket</CardTitle>
                            <CardDescription>
                                Ajukan pertanyaan atau laporkan masalah ke tim support
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/info/contact">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                <Phone className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Kontak</CardTitle>
                            <CardDescription>
                                Informasi kontak tim HR, Finance, dan IT
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Popular FAQs */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold mb-4">Pertanyaan Populer</h2>
                <Card>
                    <CardContent className="pt-6 space-y-3">
                        {POPULAR_FAQS.map((faq, idx) => (
                            <Link key={idx} href={faq.link}>
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{faq.question}</span>
                                </div>
                            </Link>
                        ))}
                        <div className="pt-2">
                            <Link href="/help/faq">
                                <Button variant="link" className="w-full">
                                    Lihat semua FAQ →
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Documentation & Policies */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold mb-4">Dokumentasi & Kebijakan</h2>
                <div className="grid md:grid-cols-2 gap-3">
                    <Link href="/info/policy">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="font-medium">Peraturan Perusahaan</div>
                                    <div className="text-xs text-muted-foreground">
                                        Tata tertib & kebijakan internal
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/info/privacy">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="font-medium">Privacy Policy</div>
                                    <div className="text-xs text-muted-foreground">
                                        Kebijakan privasi & perlindungan data
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/info/terms">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="font-medium">Terms of Service</div>
                                    <div className="text-xs text-muted-foreground">
                                        Syarat & ketentuan penggunaan
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/info/contact">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="font-medium">Kontak & Eskalasi</div>
                                    <div className="text-xs text-muted-foreground">
                                        Informasi kontak darurat & eskalasi
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* SLA Info */}
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Service Level Agreement (SLA)</CardTitle>
                    <CardDescription>
                        Waktu respon target untuk kategori tiket
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">Critical</Badge>
                                <span className="text-sm">Masalah payroll, akses terkunci</span>
                            </div>
                            <span className="text-sm font-medium">{'< 4 jam'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="default">High</Badge>
                                <span className="text-sm">Fitur tidak berfungsi</span>
                            </div>
                            <span className="text-sm font-medium">{'< 1 hari'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Medium</Badge>
                                <span className="text-sm">Pertanyaan umum</span>
                            </div>
                            <span className="text-sm font-medium">{'< 2 hari'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">Low</Badge>
                                <span className="text-sm">Feature request</span>
                            </div>
                            <span className="text-sm font-medium">{'< 1 minggu'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
