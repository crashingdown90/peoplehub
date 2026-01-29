'use client';

import React from 'react';
import { Search, HelpCircle, MessageSquare, Phone, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FAQAccordion, type FAQItem } from '@/components/data/faq-accordion';
import Link from 'next/link';

// Sample FAQ data - in production, this would come from API
const SAMPLE_FAQS: FAQItem[] = [
    {
        id: '1',
        category: 'ATTENDANCE',
        question: 'Bagaimana cara melakukan absensi harian?',
        answer: 'Untuk melakukan absensi, buka halaman Absensi dari menu utama, pilih jenis kehadiran (WFO/WFH), ambil foto selfie untuk verifikasi liveness detection, lalu tekan tombol Clock In. Pastikan Anda mengizinkan akses kamera dan lokasi.'
    },
    {
        id: '2',
        category: 'ATTENDANCE',
        question: 'Apa yang harus dilakukan jika lupa absen?',
        answer: 'Jika Anda lupa absen, segera ajukan Koreksi Absensi melalui menu Absensi > Koreksi. Isi formulir dengan alasan yang jelas dan lampirkan bukti pendukung jika ada. Pengajuan akan diproses oleh atasan dan HRD.'
    },
    {
        id: '3',
        category: 'LEAVE',
        question: 'Bagaimana cara mengajukan cuti?',
        answer: 'Buka menu Cuti > Ajukan Cuti, pilih jenis cuti yang diinginkan, tentukan tanggal mulai dan selesai, isi alasan cuti, lalu submit. Sistem akan otomatis mengurangi saldo cuti Anda. Pengajuan akan melewati approval atasan dan HRD.'
    },
    {
        id: '4',
        category: 'LEAVE',
        question: 'Berapa sisa saldo cuti saya?',
        answer: 'Anda dapat melihat saldo cuti di halaman Cuti > Saldo Cuti. Saldo ditampilkan per jenis cuti (Tahunan, Sakit, dll) beserta riwayat penggunaan.'
    },
    {
        id: '5',
        category: 'PAYROLL',
        question: 'Kapan slip gaji diterbitkan?',
        answer: 'Slip gaji biasanya diterbitkan pada tanggal 25-28 setiap bulan. Anda akan menerima notifikasi saat slip gaji sudah tersedia. Buka menu Payslip untuk melihat dan mengunduh slip gaji Anda dalam format PDF.'
    },
    {
        id: '6',
        category: 'PAYROLL',
        question: 'Bagaimana cara mengunduh slip gaji?',
        answer: 'Buka menu Payslip, pilih periode yang diinginkan, lalu klik tombol Download PDF. Slip gaji dalam format PDF dapat disimpan atau dicetak.'
    },
    {
        id: '7',
        category: 'SECURITY',
        question: 'Bagaimana cara mengubah password?',
        answer: 'Buka menu Profil > Keamanan Akun, masukkan password lama, kemudian masukkan password baru dan konfirmasi. Password harus minimal 8 karakter dan mengandung kombinasi huruf, angka, dan simbol.'
    },
    {
        id: '8',
        category: 'SECURITY',
        question: 'Apa yang harus dilakukan jika lupa password?',
        answer: 'Di halaman login, klik "Lupa Password", masukkan email terdaftar, dan sistem akan mengirimkan link reset password ke email Anda. Link berlaku selama 1 jam.'
    },
];

const CATEGORIES = [
    { id: 'ALL', label: 'Semua', icon: HelpCircle },
    { id: 'ATTENDANCE', label: 'Absensi', icon: Clock },
    { id: 'LEAVE', label: 'Cuti', icon: MessageSquare },
    { id: 'PAYROLL', label: 'Payroll', icon: MessageSquare },
    { id: 'SECURITY', label: 'Keamanan', icon: MessageSquare },
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeCategory, setActiveCategory] = React.useState('ALL');

    const filteredFAQs = React.useMemo(() => {
        let faqs = SAMPLE_FAQS;

        // Filter by category
        if (activeCategory !== 'ALL') {
            faqs = faqs.filter(faq => faq.category === activeCategory);
        }

        // Filter by search query
        if (searchQuery) {
            faqs = faqs.filter(
                faq =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return faqs;
    }, [searchQuery, activeCategory]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">FAQ - Pertanyaan Umum</h1>
                <p className="text-muted-foreground mt-2">
                    Temukan jawaban untuk pertanyaan yang sering diajukan tentang PeopleHub HRIS
                </p>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari pertanyaan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Categories */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-5">
                    {CATEGORIES.map((category) => (
                        <TabsTrigger key={category.id} value={category.id}>
                            {category.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeCategory} className="mt-6">
                    {filteredFAQs.length > 0 ? (
                        <>
                            <div className="mb-4 text-sm text-muted-foreground">
                                Menampilkan {filteredFAQs.length} pertanyaan
                            </div>
                            <FAQAccordion items={filteredFAQs} searchQuery={searchQuery} />
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Tidak ada hasil ditemukan</h3>
                                <p className="text-muted-foreground mb-4">
                                    Coba kata kunci lain atau hubungi tim support
                                </p>
                                <Link href="/support/tickets">
                                    <Button>Buat Tiket Support</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Help CTA */}
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle>Tidak menemukan jawaban?</CardTitle>
                    <CardDescription>
                        Tim support kami siap membantu Anda
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Link href="/support/tickets">
                        <Button>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Buat Tiket
                        </Button>
                    </Link>
                    <Link href="/info/contact">
                        <Button variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Lihat Kontak
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Last Updated */}
            <div className="text-center text-sm text-muted-foreground">
                Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    );
}
