'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentVersionBadge } from '@/components/ui';
import { Clock, Download, FileText } from 'lucide-react';

const TERMS_OF_SERVICE = {
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    sections: [
        {
            title: '1. Penerimaan Syarat',
            content: `Dengan mengakses dan menggunakan aplikasi PeopleHub HRIS, Anda setuju untuk terikat dengan syarat dan ketentuan yang tercantum dalam dokumen ini. Jika Anda tidak setuju dengan syarat dan ketentuan ini, harap tidak menggunakan aplikasi.`,
        },
        {
            title: '2. Akun Pengguna',
            content: `- Setiap karyawan akan diberikan satu akun pengguna unik
- Anda bertanggung jawab menjaga kerahasiaan password dan keamanan akun
- Dilarang membagikan credential akun kepada pihak lain
- Perusahaan berhak menonaktifkan akun yang mencurigakan atau melanggar ketentuan
- Aktivitas pada akun Anda adalah tanggung jawab Anda`,
        },
        {
            title: '3. Penggunaan yang Diizinkan',
            content: `Aplikasi PeopleHub HRIS hanya boleh digunakan untuk:
- Keperluan pekerjaan dan administrasi kepegawaian
- Akses data yang sesuai dengan role dan permission Anda
- Komunikasi resmi internal perusahaan

Penggunaan di luar konteks ini dianggap pelanggaran.`,
        },
        {
            title: '4. Larangan',
            content: `Pengguna DILARANG:
- Mengakses data yang bukan haknya
- Melakukan hacking, phishing, atau serangan cyber
- Menyebarkan malware atau virus
- Menggunakan aplikasi untuk tujuan ilegal
- Memanipulasi data atau melakukan fraud
- Melakukan reverse engineering pada sistem`,
        },
        {
            title: '5. Ketersediaan Layanan',
            content: `- Kami berusaha menjaga ketersediaan sistem 24/7
- Maintenance terjadwal akan diberitahukan terlebih dahulu
- Kami tidak bertanggung jawab atas downtime di luar kendali (force majeure)
- Backup data dilakukan secara rutin, namun kami tidak menjamin 100% recovery`,
        },
        {
            title: '6. Hak Kekayaan Intelektual',
            content: `Semua konten, desain, logo, dan kode dalam aplikasi PeopleHub HRIS adalah milik perusahaan atau pihak yang memberikan lisensi. Pengguna tidak memiliki hak untuk:
- Menyalin atau mendistribusikan konten aplikasi
- Menggunakan logo atau brand tanpa izin
- Mengklaim kepemilikan atas sistem atau bagiannya`,
        },
        {
            title: '7. Batasan Tanggung Jawab',
            content: `Perusahaan tidak bertanggung jawab atas:
- Kerugian akibat kesalahan input data oleh pengguna
- Kerugian akibat kelalaian pengguna dalam menjaga keamanan akun
- Kerugian tidak langsung atau konsekuensial
- Kehilangan data akibat force majeure`,
        },
        {
            title: '8. Perubahan Ketentuan',
            content: `Perusahaan berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diberitahukan melalui sistem dan/atau email. Penggunaan aplikasi setelah perubahan dianggap sebagai penerimaan terhadap ketentuan baru.`,
        },
        {
            title: '9. Sanksi Pelanggaran',
            content: `Pelanggaran terhadap syarat dan ketentuan dapat mengakibatkan:
- Penonaktifan akun sementara atau permanen
- Tindakan disipliner sesuai peraturan perusahaan
- Tuntutan hukum jika terdapat kerugian material`,
        },
        {
            title: '10. Hukum yang Berlaku',
            content: `Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah atau jalur hukum yang berlaku di Indonesia.`,
        },
    ],
};

export default function TermsOfServicePage() {
    return (
        <div className="container max-w-4xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-muted-foreground">
                    Syarat & Ketentuan Penggunaan PeopleHub HRIS
                </p>
            </div>

            {/* Version Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <DocumentVersionBadge
                            version={TERMS_OF_SERVICE.version}
                            effectiveDate={TERMS_OF_SERVICE.effectiveDate}
                            isLatest
                        />
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Terms Sections */}
            {TERMS_OF_SERVICE.sections.map((section, idx) => (
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

            {/* Acknowledgement */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <p className="text-sm text-center">
                        Dengan menggunakan aplikasi PeopleHub HRIS, Anda menyatakan telah membaca, memahami,
                        dan menyetujui seluruh syarat dan ketentuan yang berlaku.
                    </p>
                </CardContent>
            </Card>

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
