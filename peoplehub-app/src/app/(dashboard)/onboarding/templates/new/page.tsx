'use client';

import { useState } from 'react';
import { ListChecks, CheckCircle, Circle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ChecklistTask {
    id: string;
    title: string;
    description: string;
    daysFromStart: number;
}

export default function OnboardingTemplatesPage() {
    const [templateName, setTemplateName] = useState('');
    const [tasks, setTasks] = useState<ChecklistTask[]>([
        {
            id: '1',
            title: 'Submit Required Documents',
            description: 'Upload ID, tax documents, and bank information',
            daysFromStart: 0,
        },
        {
            id: '2',
            title: 'Complete Background Check',
            description: 'Provide information for verification',
            daysFromStart: 0,
        },
        {
            id: '3',
            title: 'Office Orientation',
            description: 'Tour of office and meet the team',
            daysFromStart: 1,
        },
    ]);

    const [newTask, setNewTask] = useState({ title: '', description: '', daysFromStart: 1 });

    const handleAddTask = () => {
        if (!newTask.title.trim()) return;

        setTasks([
            ...tasks,
            {
                id: Date.now().toString(),
                ...newTask,
            },
        ]);
        setNewTask({ title: '', description: '', daysFromStart: 1 });
    };

    const handleRemoveTask = (id: string) => {
        setTasks(tasks.filter((task) => task.id !== id));
    };

    const handleSave = () => {
        // Save template logic
        alert('Template saved successfully!');
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create Onboarding Template</h1>
                <p className="text-muted-foreground">
                    Build a checklist template for new employee onboarding
                </p>
            </div>

            {/* Template Name */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Template Information</CardTitle>
                    <CardDescription>Give your template a descriptive name</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name *</Label>
                        <Input
                            id="templateName"
                            placeholder="e.g., Software Engineer Onboarding"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Existing Tasks */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Checklist Tasks ({tasks.length})</CardTitle>
                    <CardDescription>Tasks will be assigned based on days from start date</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.id} className="border rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{task.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {task.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Due: Day {task.daysFromStart === 0 ? '1 (First Day)' : task.daysFromStart}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTask(task.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No tasks added yet. Add your first task below.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add New Task */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Add New Task</CardTitle>
                    <CardDescription>Create a task for this onboarding template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="taskTitle">Task Title *</Label>
                        <Input
                            id="taskTitle"
                            placeholder="e.g., Complete IT Setup"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taskDescription">Description</Label>
                        <Textarea
                            id="taskDescription"
                            placeholder="Provide details about this task..."
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="daysFromStart">Days from Start Date</Label>
                        <Input
                            id="daysFromStart"
                            type="number"
                            min="0"
                            max="90"
                            value={newTask.daysFromStart}
                            onChange={(e) =>
                                setNewTask({ ...newTask, daysFromStart: parseInt(e.target.value) || 0 })
                            }
                        />
                        <p className="text-sm text-muted-foreground">
                            Task will be due on this day (0 = first day)
                        </p>
                    </div>

                    <Button onClick={handleAddTask} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave} disabled={!templateName.trim() || tasks.length === 0}>
                    Save Template
                </Button>
            </div>
        </div>
    );
}
