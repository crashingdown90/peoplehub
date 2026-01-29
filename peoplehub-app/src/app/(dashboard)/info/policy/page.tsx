'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AcknowledgementButton, DocumentVersionBadge } from '@/components/ui';
import { Alert } from '@/components/ui/alert';
import { Download, Clock, AlertCircle } from 'lucide-react';
import { fetchWithCsrf } from "@/lib/api-client";

// Sample policy content - in production this would come from API/CMS
const POLICY_CONTENT = {
    version: '2.0',
    effectiveDate: new Date('2024-01-01'),
    lastUpdated: new Date(),
    sections: [
        {
            id: '1',
            title: '1. Jam Kerja & Kehadiran',
            content: `
**Jam Kerja Regular:**
- Senin - Jumat: 08:00 - 17:00 (dengan istirahat 12:00 - 13:00)
- Sabtu: Libur (kecuali ada pemberitahuan khusus)
- Minggu & Hari Libur Nasional: Libur

**Absensi:**
- Karyawan WAJIB melakukan absensi (clock in/out) menggunakan sistem PeopleHub
- Keterlambatan lebih dari 15 menit akan dikenakan sanksi sesuai peraturan
- Absensi menggunakan liveness detection untuk memastikan keabsahan identitas

**Toleransi Keterlambatan:**
- 1-3 kali/bulan: Teguran lisan
- 4-6 kali/bulan: Surat peringatan
- >6 kali/bulan: Pemotongan gaji sesuai kebijakan
      `.trim(),
        },
        {
            id: '2',
            title: '2. Cuti & Izin',
            content: `
**Jenis Cuti:**
- Cuti Tahunan: 12 hari/tahun
- Cuti Sakit: Unlimited (dengan surat dokter)
- Cuti Menikah: 3 hari
- Cuti Melahirkan: 3 bulan (karyawan perempuan)
- Cuti Ayah: 2 hari (karyawan laki-laki)

**Prosedur Pengajuan:**
- Cuti harus diajukan minimal H-3 sebelum tanggal pelaksanaan
- Pengajuan melalui sistem PeopleHub dengan approval atasan dan HRD
- Saldo cuti dapat dilihat di menu Cuti > Saldo Cuti
      `.trim(),
        },
        {
            id: '3',
            title: '3. Tata Tertib',
            content: `
**Kode Etik:**
- Berpakaian rapi dan sopan (business casual)
- Menjaga kebersihan dan ketertiban area kerja
- Dilarang merokok di area kantor (kecuali di area merokok yang ditentukan)
- Dilarang membawa senjata tajam atau benda berbahaya

**Penggunaan Aset Perusahaan:**
- Aset perusahaan (laptop, hp, kendaraan) hanya untuk keperluan pekerjaan
- Dilarang menggunakan untuk kepentingan pribadi tanpa izin
- Kehilangan/kerusakan karena kelalaian akan dikenakan ganti rugi
      `.trim(),
        },
        {
            id: '4',
            title: '4. Keamanan Data & IT',
            content: `
**Keamanan Akun:**
- Password harus diganti secara berkala (max 90 hari)
- Dilarang membagikan password atau akses ke pihak lain
- Gunakan 2FA jika tersedia untuk keamanan tambahan

**Penggunaan Data:**
- Data pribadi karyawan dan perusahaan bersifat RAHASIA
- Dilarang menyebarluaskan informasi internal tanpa izin
- Pelanggaran akan dikenakan sanksi tegas
      `.trim(),
        },
    ],
};

export default function CompanyPolicyPage() {
    const [acknowledged, setAcknowledged] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAcknowledge = async (_documentId: string, _version: string) => {
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // TODO: Replace with actual API call to record acknowledgement
        // await fetchWithCsrf('/api/documents/acknowledge', {
        //     method: 'POST',
        //     body: JSON.stringify({ documentId, version, acknowledgedAt: new Date().toISOString() })
        // });

        setAcknowledged(true);
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Peraturan Perusahaan</h1>
                <p className="text-muted-foreground mt-2">
                    Tata tertib, kebijakan, dan peraturan internal perusahaan
                </p>
            </div>

            {/* Version & Status */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <DocumentVersionBadge
                                version={POLICY_CONTENT.version}
                                effectiveDate={POLICY_CONTENT.effectiveDate}
                                isLatest
                            />
                            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Terakhir diperbarui: {POLICY_CONTENT.lastUpdated.toLocaleDateString('id-ID')}
                            </p>
                        </div>

                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>

                    {!acknowledged && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Status: Belum Dibaca</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Anda perlu membaca dan memahami peraturan perusahaan ini
                                </p>
                            </div>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Policy Content */}
            <div className="space-y-4">
                {POLICY_CONTENT.sections.map((section) => (
                    <Card key={section.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-sm">{section.content}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Acknowledgement Section */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Pernyataan Pemahaman</CardTitle>
                    <CardDescription>
                        Dengan menekan tombol di bawah, Anda menyatakan telah membaca, memahami, dan setuju untuk mematuhi seluruh peraturan yang tertera di atas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AcknowledgementButton
                        documentId="company-policy"
                        documentVersion={POLICY_CONTENT.version}
                        isAcknowledged={acknowledged}
                        onAcknowledge={handleAcknowledge}
                    />
                </CardContent>
            </Card>

            {/* Footer Note */}
            <div className="text-center text-xs text-muted-foreground">
                <p>
                    Untuk pertanyaan terkait peraturan perusahaan, hubungi tim HRD
                </p>
            </div>
        </div>
    );
}
