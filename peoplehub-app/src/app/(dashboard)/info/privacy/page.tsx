'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentVersionBadge } from '@/components/ui';
import { Clock, Download, Shield } from 'lucide-react';

const PRIVACY_POLICY = {
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    sections: [
        {
            title: '1. Pengumpulan Data',
            content: `Kami mengumpulkan data pribadi yang diperlukan untuk menjalankan fungsi HRIS, termasuk namun tidak terbatas pada:
- Informasi identitas (nama, NIK, tanggal lahir, alamat)
- Informasi kontak (email, nomor telepon)
- Data keuangan (nomor rekening, NPWP)
- Data absensi (foto selfie, lokasi GPS)
- Riwayat pekerjaan dan kinerja`,
        },
        {
            title: '2. Penggunaan Data',
            content: `Data pribadi yang dikumpulkan digunakan untuk:
- Administrasi kepegawaian dan penggajian
- Manajemen kinerja dan pengembangan karir
- Kepatuhan terhadap peraturan perundangan
- Keamanan dan verifikasi identitas
- Komunikasi internal perusahaan`,
        },
        {
            title: '3. Perlindungan Data',
            content: `Kami berkomitmen melindungi data pribadi Anda dengan:
- Enkripsi data saat transmisi dan penyimpanan
- Kontrol akses berbasis role dan permission
- Audit log untuk semua aktivitas sensitif
- Backup rutin dengan enkripsi
- Training keamanan data untuk semua karyawan`,
        },
        {
            title: '4. Hak Pengguna',
            content: `Anda memiliki hak untuk:
- Mengakses dan melihat data pribadi Anda
- Meminta koreksi data yang tidak akurat
- Meminta penghapusan data (sesuai ketentuan hukum)
- Menarik persetujuan penggunaan data
- Mengajukan keluhan terkait perlindungan data`,
        },
        {
            title: '5. Pembagian Data',
            content: `Data pribadi Anda tidak akan dibagikan kepada pihak ketiga tanpa persetujuan, kecuali:
- Diwajibkan oleh hukum (pajak, BPJS, dll)
- Untuk keperluan audit eksternal
- Dengan vendor terpilih untuk layanan tertentu (dengan perjanjian kerahasiaan)`,
        },
        {
            title: '6. Retensi Data',
            content: `Data pribadi akan disimpan selama:
- Masa kerja aktif karyawan
- 5 tahun setelah berakhirnya hubungan kerja (sesuai UU Ketenagakerjaan)
- Lebih lama jika diperlukan untuk kepatuhan hukum`,
        },
        {
            title: '7. Kontak',
            content: `Untuk pertanyaan terkait privasi dan perlindungan data, hubungi:
- Data Protection Officer (DPO)
- Email: privacy@perusahaan.com
- Telp: (021) 1234-5678`,
        },
    ],
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container max-w-4xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">
                    Kebijakan Privasi & Perlindungan Data PeopleHub HRIS
                </p>
            </div>

            {/* Version Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <DocumentVersionBadge
                            version={PRIVACY_POLICY.version}
                            effectiveDate={PRIVACY_POLICY.effectiveDate}
                            isLatest
                        />
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Introduction */}
            <Card>
                <CardHeader>
                    <CardTitle>Pendahuluan</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>
                        Kami menghargai kepercayaan Anda dan berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda.
                        Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi
                        informasi pribadi Anda dalam sistem PeopleHub HRIS.
                    </p>
                    <p>
                        Dokumen ini sesuai dengan peraturan perlindungan data yang berlaku, termasuk UU Perlindungan Data Pribadi (PDP)
                        dan regulasi internasional yang relevan.
                    </p>
                </CardContent>
            </Card>

            {/* Policy Sections */}
            {PRIVACY_POLICY.sections.map((section, idx) => (
                <Card key={idx}>
                    <CardHeader>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap">{section.content}</div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Last Updated */}
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                    Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </span>
            </div>
        </div>
    );
}
