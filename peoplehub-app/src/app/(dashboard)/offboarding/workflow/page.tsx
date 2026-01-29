'use client';

import { useState } from 'react';
import { User, MapPin, Briefcase, Calendar, FileText, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OffboardingTask {
    id: string;
    title: string;
    description: string;
    responsible: 'employee' | 'manager' | 'hr' | 'it';
    completed: boolean;
}

interface OffboardingChecklist {
    category: string;
    tasks: OffboardingTask[];
}

export default function OffboardingWorkflowPage() {
    const [checklists] = useState<OffboardingChecklist[]>([
        {
            category: 'Employee Tasks',
            tasks: [
                {
                    id: '1',
                    title: 'Complete Exit Interview',
                    description: 'Schedule and complete exit interview with HR',
                    responsible: 'employee',
                    completed: true,
                },
                {
                    id: '2',
                    title: 'Return Company Assets',
                    description: 'Return laptop, access cards, and other company property',
                    responsible: 'employee',
                    completed: true,
                },
                {
                    id: '3',
                    title: 'Complete Knowledge Transfer',
                    description: 'Document ongoing work and transfer knowledge to team',
                    responsible: 'employee',
                    completed: false,
                },
            ],
        },
        {
            category: 'Manager Tasks',
            tasks: [
                {
                    id: '4',
                    title: 'Conduct Exit Meeting',
                    description: 'Final meeting to discuss handover and feedback',
                    responsible: 'manager',
                    completed: true,
                },
                {
                    id: '5',
                    title: 'Verify Asset Return',
                    description: 'Confirm all company assets have been returned',
                    responsible: 'manager',
                    completed: false,
                },
            ],
        },
        {
            category: 'HR Tasks',
            tasks: [
                {
                    id: '6',
                    title: 'Process Final Payroll',
                    description: 'Calculate and process final salary payment',
                    responsible: 'hr',
                    completed: false,
                },
                {
                    id: '7',
                    title: 'Generate Employment Certificate',
                    description: 'Create work certificate for employee records',
                    responsible: 'hr',
                    completed: false,
                },
            ],
        },
        {
            category: 'IT Tasks',
            tasks: [
                {
                    id: '8',
                    title: 'Revoke System Access',
                    description: 'Disable all system accounts and access permissions',
                    responsible: 'it',
                    completed: false,
                },
                {
                    id: '9',
                    title: 'Backup Employee Data',
                    description: 'Archive employee files and emails',
                    responsible: 'it',
                    completed: false,
                },
            ],
        },
    ]);

    const totalTasks = checklists.reduce((acc, cat) => acc + cat.tasks.length, 0);
    const completedTasks = checklists.reduce(
        (acc, cat) => acc + cat.tasks.filter((t) => t.completed).length,
        0
    );
    const progress = (completedTasks / totalTasks) * 100;

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Offboarding Workflow</h1>
                <p className="text-muted-foreground">
                    Employee: John Doe • Last Day: January 31, 2024
                </p>
            </div>

            {/* Progress Overview */}
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Offboarding Progress</CardTitle>
                            <CardDescription>
                                {completedTasks} of {totalTasks} tasks completed
                            </CardDescription>
                        </div>
                        <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                            {progress.toFixed(0)}%
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="h-3" />
                </CardContent>
            </Card>

            {/* Checklists */}
            <div className="space-y-6">
                {checklists.map((checklist, idx) => {
                    const categoryCompleted = checklist.tasks.filter((t) => t.completed).length;
                    const categoryProgress = (categoryCompleted / checklist.tasks.length) * 100;

                    return (
                        <Card key={idx}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{checklist.category}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {categoryCompleted}/{checklist.tasks.length}
                                        </span>
                                        {categoryProgress === 100 && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                    </div>
                                </div>
                                <Progress value={categoryProgress} className="h-2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {checklist.tasks.map((task, taskIdx) => (
                                        <div key={task.id}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.completed}
                                                        readOnly
                                                        className="h-5 w-5"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h3
                                                        className={`font-medium ${task.completed
                                                                ? 'text-muted-foreground line-through'
                                                                : ''
                                                            }`}
                                                    >
                                                        {task.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {task.description}
                                                    </p>
                                                    <Badge variant="outline" className="mt-2 text-xs">
                                                        {task.responsible.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                {!task.completed && (
                                                    <Button size="sm" variant="outline">
                                                        Mark Complete
                                                    </Button>
                                                )}
                                            </div>
                                            {taskIdx < checklist.tasks.length - 1 && (
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

            {/* Final Actions */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Final Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Once all tasks are completed, the offboarding process can be finalized.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline">Send Reminder</Button>
                        <Button disabled={progress < 100}>Complete Offboarding</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
