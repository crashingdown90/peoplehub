'use client';

import { useState } from 'react';
import { MessageSquare, Star, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function ExitInterviewPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        reason: '',
        experience: '',
        management: '',
        growth: '',
        culture: '',
        recommendations: '',
        rating: 0,
    });

    const questions = [
        {
            id: 'reason',
            label: 'What is your primary reason for leaving?',
            placeholder: 'Please share your main reason for leaving the company...',
        },
        {
            id: 'experience',
            label: 'How would you describe your overall experience at the company?',
            placeholder: 'Share your thoughts about your time with us...',
        },
        {
            id: 'management',
            label: 'How would you rate the support from your manager and team?',
            placeholder: 'Tell us about your relationship with your manager and team...',
        },
        {
            id: 'growth',
            label: 'Did you feel you had opportunities for growth and development?',
            placeholder: 'Share your thoughts on career development opportunities...',
        },
        {
            id: 'culture',
            label: 'How would you describe the company culture?',
            placeholder: 'What did you think about our company culture and values?...',
        },
        {
            id: 'recommendations',
            label: 'What recommendations do you have for improving the workplace?',
            placeholder: 'Any suggestions for making this a better place to work...',
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit form logic
        router.push('/offboarding/workflow');
    };

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Exit Interview</h1>
                <p className="text-muted-foreground">
                    Your feedback helps us improve. All responses are confidential.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Satisfaction</CardTitle>
                        <CardDescription>
                            How would you rate your overall experience? (1-5 stars)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="transition-colors"
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= formData.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                {questions.map((question) => (
                    <Card key={question.id}>
                        <CardHeader>
                            <Label htmlFor={question.id} className="text-base font-semibold">
                                {question.label}
                            </Label>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id={question.id}
                                placeholder={question.placeholder}
                                value={formData[question.id as keyof typeof formData] as string}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        [question.id]: e.target.value,
                                    })
                                }
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                ))}

                {/* Confidentiality Notice */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-semibold text-blue-900 mb-1">Confidential Feedback</p>
                                <p className="text-sm text-blue-700">
                                    Your responses will be kept confidential and used only to improve our workplace.
                                    Thank you for your honest feedback.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Save Draft
                    </Button>
                    <Button type="submit">
                        <Send className="mr-2 h-4 w-4" />
                        Submit Interview
                    </Button>
                </div>
            </form>
        </div>
    );
}
