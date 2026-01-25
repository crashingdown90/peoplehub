'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    dueDate?: string;
}

interface OnboardingPhase {
    name: string;
    items: ChecklistItem[];
}

export default function OnboardingProgressPage() {
    const [phases] = useState<OnboardingPhase[]>([
        {
            name: 'Preboarding',
            items: [
                {
                    id: '1',
                    title: 'Submit Required Documents',
                    description: 'Upload ID, tax documents, and bank account information',
                    completed: true,
                },
                {
                    id: '2',
                    title: 'Sign Employment Contract',
                    description: 'Review and digitally sign your employment agreement',
                    completed: true,
                },
                {
                    id: '3',
                    title: 'Complete Background Check',
                    description: 'Provide information for background verification',
                    completed: true,
                },
            ],
        },
        {
            name: 'First Day',
            items: [
                {
                    id: '4',
                    title: 'Office Orientation',
                    description: 'Tour of office facilities and meet the team',
                    completed: true,
                    dueDate: '2024-01-22',
                },
                {
                    id: '5',
                    title: 'IT Setup',
                    description: 'Receive laptop, access credentials, and software setup',
                    completed: true,
                },
                {
                    id: '6',
                    title: 'HR Welcome Meeting',
                    description: 'Introduction to company policies and benefits',
                    completed: false,
                    dueDate: '2024-01-22',
                },
            ],
        },
        {
            name: 'First Week',
            items: [
                {
                    id: '7',
                    title: 'Team Introductions',
                    description: '1-on-1 meetings with team members',
                    completed: false,
                    dueDate: '2024-01-26',
                },
                {
                    id: '8',
                    title: 'Training Sessions',
                    description: 'Complete mandatory training modules',
                    completed: false,
                    dueDate: '2024-01-26',
                },
                {
                    id: '9',
                    title: 'Set Initial Goals',
                    description: 'Meet with manager to set 30/60/90 day goals',
                    completed: false,
                    dueDate: '2024-01-26',
                },
            ],
        },
        {
            name: 'First Month',
            items: [
                {
                    id: '10',
                    title: 'Complete Onboarding Survey',
                    description: 'Provide feedback on your onboarding experience',
                    completed: false,
                    dueDate: '2024-02-19',
                },
                {
                    id: '11',
                    title: '30-Day Check-in',
                    description: 'Review progress with manager',
                    completed: false,
                    dueDate: '2024-02-19',
                },
            ],
        },
    ]);

    const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
    const completedItems = phases.reduce(
        (acc, phase) => acc + phase.items.filter((item) => item.completed).length,
        0
    );
    const progressPercentage = (completedItems / totalItems) * 100;

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Onboarding Progress</h1>
                <p className="text-muted-foreground">Welcome! Complete these steps to get started</p>
            </div>

            {/* Overall Progress */}
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Overall Progress</CardTitle>
                            <CardDescription>
                                {completedItems} of {totalItems} tasks completed
                            </CardDescription>
                        </div>
                        <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                            {progressPercentage.toFixed(0)}%
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={progressPercentage} className="h-3" />
                </CardContent>
            </Card>

            {/* Phases */}
            <div className="space-y-6">
                {phases.map((phase, phaseIndex) => {
                    const phaseCompleted = phase.items.filter((item) => item.completed).length;
                    const phaseTotal = phase.items.length;
                    const phaseProgress = (phaseCompleted / phaseTotal) * 100;

                    return (
                        <Card key={phaseIndex}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{phase.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {phaseCompleted}/{phaseTotal}
                                        </span>
                                        {phaseProgress === 100 && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                    </div>
                                </div>
                                <Progress value={phaseProgress} className="h-2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {phase.items.map((item, itemIndex) => (
                                        <div key={item.id}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    {item.completed ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3
                                                                className={`font-medium ${item.completed
                                                                        ? 'text-muted-foreground line-through'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                {item.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {item.description}
                                                            </p>
                                                            {item.dueDate && !item.completed && (
                                                                <div className="flex items-center gap-2 mt-2 text-sm">
                                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">
                                                                        Due:{' '}
                                                                        {new Date(
                                                                            item.dueDate
                                                                        ).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!item.completed && (
                                                            <Button size="sm">Mark Complete</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {itemIndex < phase.items.length - 1 && (
                                                <Separator className="my-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Help Card */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        If you have questions about your onboarding, please contact:
                    </p>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Onboarding Coordinator:</strong> Sarah Johnson
                        </p>
                        <p>
                            <strong>Email:</strong> sarah.johnson@company.com
                        </p>
                        <p>
                            <strong>Phone:</strong> +62 21 1234 5678 (ext. 456)
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
