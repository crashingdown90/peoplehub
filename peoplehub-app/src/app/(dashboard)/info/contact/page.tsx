'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, AlertCircle } from 'lucide-react';

// Sample contact data - in production this would come from API
const CONTACT_DATA = {
    departments: [
        {
            id: 'hr',
            name: 'Human Resources (HR)',
            icon: 'users',
            contacts: [
                {
                    name: 'Siti Nurhaliza',
                    position: 'HR Manager',
                    email: 'siti.n@perusahaan.com',
                    phone: '+62 812-3456-7890',
                    ext: '101',
                    branch: 'Jakarta HQ',
                },
                {
                    name: 'Budi Santoso',
                    position: 'HR Staff',
                    email: 'budi.s@perusahaan.com',
                    phone: '+62 813-4567-8901',
                    ext: '102',
                    branch: 'Jakarta HQ',
                },
            ],
            workingHours: 'Senin - Jumat, 08:00 - 17:00',
            responsibilities: [
                'Registrasi karyawan baru',
                'Cuti dan izin',
                'Surat keterangan',
                'Peraturan perusahaan',
            ],
        },
        {
            id: 'finance',
            name: 'Finance & Payroll',
            icon: 'dollar-sign',
            contacts: [
                {
                    name: 'Ahmad Yani',
                    position: 'Finance Manager',
                    email: 'ahmad.y@perusahaan.com',
                    phone: '+62 814-5678-9012',
                    ext: '201',
                    branch: 'Jakarta HQ',
                },
                {
                    name: 'Dewi Lestari',
                    position: 'Payroll Staff',
                    email: 'dewi.l@perusahaan.com',
                    phone: '+62 815-6789-0123',
                    ext: '202',
                    branch: 'Jakarta HQ',
                },
            ],
            workingHours: 'Senin - Jumat, 08:00 - 17:00',
            responsibilities: [
                'Penggajian (payroll)',
                'Reimbursement',
                'Pinjaman / Cash advance',
                'Perubahan rekening bank',
            ],
        },
        {
            id: 'it',
            name: 'IT Support & Operations',
            icon: 'monitor',
            contacts: [
                {
                    name: 'Riko Prasetyo',
                    position: 'IT Manager',
                    email: 'riko.p@perusahaan.com',
                    phone: '+62 816-7890-1234',
                    ext: '301',
                    branch: 'Jakarta HQ',
                },
                {
                    name: 'Linda Wijaya',
                    position: 'IT Support',
                    email: 'linda.w@perusahaan.com',
                    phone: '+62 817-8901-2345',
                    ext: '302',
                    branch: 'Jakarta HQ',
                },
            ],
            workingHours: 'Senin - Jumat, 08:00 - 17:00 (On-call 24/7 untuk emergency)',
            responsibilities: [
                'Reset password',
                'Masalah teknis aplikasi',
                'Keamanan akun',
                'Akses sistem',
            ],
        },
    ],
    emergencyContacts: [
        {
            title: 'Masalah Payroll Critical',
            contact: 'Finance Manager',
            phone: '+62 814-5678-9012',
            availability: '24/7',
        },
        {
            title: 'Akun Terkunci / Hacked',
            contact: 'IT Manager',
            phone: '+62 816-7890-1234',
            availability: '24/7',
        },
        {
            title: 'Emergency HR',
            contact: 'HR Manager',
            phone: '+62 812-3456-7890',
            availability: 'Mon-Fri 08:00-20:00',
        },
    ],
    escalationFlow: [
        {
            level: '1',
            title: 'First Contact',
            description: 'Hubungi staff departemen terkait (HR/Finance/IT)',
            sla: 'Respon dalam 4 jam kerja',
        },
        {
            level: '2',
            title: 'Supervisor',
            description: 'Jika tidak terselesaikan, eskalasi ke Manager departemen',
            sla: 'Respon dalam 1 hari kerja',
        },
        {
            level: '3',
            title: 'Management',
            description: 'Untuk kasus critical, hubungi direktur terkait',
            sla: 'Respon dalam 2 jam untuk critical issue',
        },
    ],
};

export default function ContactPage() {
    const [activeTab, setActiveTab] = React.useState('hr');

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Kontak & Eskalasi</h1>
                <p className="text-muted-foreground mt-2">
                    Informasi kontak tim HR, Finance, dan IT untuk bantuan dan support
                </p>
            </div>

            {/* Department Contacts */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    {CONTACT_DATA.departments.map((dept) => (
                        <TabsTrigger key={dept.id} value={dept.id}>
                            {dept.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {CONTACT_DATA.departments.map((dept) => (
                    <TabsContent key={dept.id} value={dept.id} className="space-y-4 mt-6">
                        {/* Department Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{dept.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {dept.workingHours}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Tanggung Jawab:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {dept.responsibilities.map((resp, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{resp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contacts */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {dept.contacts.map((contact, idx) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                                        <CardDescription>{contact.position}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">Email</div>
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="text-sm hover:underline text-primary"
                                                >
                                                    {contact.email}
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">Telepon</div>
                                                <div className="text-sm">{contact.phone}</div>
                                                <div className="text-xs text-muted-foreground">Ext: {contact.ext}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">Lokasi</div>
                                                <div className="text-sm">{contact.branch}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Emergency Contacts */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle>Kontak Darurat</CardTitle>
                    </div>
                    <CardDescription>
                        Untuk masalah critical yang memerlukan penanganan segera (24/7)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {CONTACT_DATA.emergencyContacts.map((emergency, idx) => (
                            <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                    <div className="font-medium text-sm">{emergency.title}</div>
                                    <div className="text-sm text-muted-foreground">{emergency.contact}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-sm">{emergency.phone}</div>
                                    <Badge variant="outline" className="text-xs mt-1">
                                        {emergency.availability}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Escalation Flow */}
            <Card>
                <CardHeader>
                    <CardTitle>Alur Eskalasi Masalah</CardTitle>
                    <CardDescription>
                        Panduan eskalasi untuk masalah yang tidak terselesaikan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {CONTACT_DATA.escalationFlow.map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {step.level}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{step.title}</div>
                                    <div className="text-sm text-muted-foreground">{step.description}</div>
                                    <div className="text-xs text-primary mt-1">SLA: {step.sla}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Footer Note */}
            <div className="text-center text-sm text-muted-foreground">
                <p>
                    Untuk pertanyaan non-urgent, silakan buat{' '}
                    <a href="/support/tickets" className="text-primary hover:underline">
                        tiket support
                    </a>{' '}
                    melalui sistem
                </p>
            </div>
        </div>
    );
}
