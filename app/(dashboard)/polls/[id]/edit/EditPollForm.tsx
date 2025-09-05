'use client';

import { useState } from 'react';
import { updatePoll } from '@/app/lib/actions/poll-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EditPollForm({ poll }: { poll: any }) {
  const [question, setQuestion] = useState(poll.question);
  const [options, setOptions] = useState<string[]>(poll.options || []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation
  const validateForm = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Question is required.");
      return false;
    }
    if (trimmedQuestion.length > 500) {
      setError("Question must be 500 characters or less.");
      return false;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      setError("Please provide at least two options.");
      return false;
    }
    if (validOptions.length > 10) {
      setError("Maximum 10 options allowed.");
      return false;
    }

    for (let i = 0; i < validOptions.length; i++) {
      if (validOptions[i].trim().length > 200) {
        setError(`Option ${i + 1} must be 200 characters or less.`);
        return false;
      }
    }

    // Check for duplicates
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      setError("Duplicate options are not allowed.");
      return false;
    }

    return true;
  };

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOption = () => setOptions((opts) => [...opts, '']);
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    formData.set('question', question);
    formData.delete('options');
    options.forEach((opt) => formData.append('options', opt));
    
    try {
      const res = await updatePoll(poll.id, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/polls';
        }, 1200);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      action={handleSubmit}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Textarea
          name="question"
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your poll question..."
          maxLength={500}
          required
        />
        <div className="text-sm text-muted-foreground mt-1">
          {question.length}/500 characters
        </div>
      </div>
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              maxLength={200}
              required
            />
            <div className="text-sm text-muted-foreground">
              {opt.length}/200 characters
            </div>
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll updated! Redirecting...</div>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating Poll..." : "Update Poll"}
      </Button>
    </form>
  );
}