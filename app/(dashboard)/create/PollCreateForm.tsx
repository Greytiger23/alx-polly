"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Poll Creation Form Component
 * 
 * A comprehensive form for creating new polls with validation and user feedback.
 * Handles dynamic option management, client-side validation, and form submission.
 * 
 * Features:
 * - Dynamic option addition/removal (2-10 options)
 * - Real-time character counting for question and options
 * - Client-side validation with detailed error messages
 * - Duplicate option detection
 * - Loading states and success feedback
 * - Automatic redirect after successful creation
 * 
 * Validation Rules:
 * - Question: Required, max 500 characters
 * - Options: 2-10 options, max 200 characters each, no duplicates
 * 
 * @returns JSX element containing the poll creation form
 * 
 * @example
 * ```tsx
 * // Used in the /create page
 * <PollCreateForm />
 * ```
 */
export default function PollCreateForm() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
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

  const addOption = () => setOptions((opts) => [...opts, ""]);
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
    
    // Add question to formData since it's controlled by state
    formData.set('question', question);
    
    try {
      const res = await createPoll(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/polls";
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
      className="space-y-6 max-w-md mx-auto"
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
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Poll..." : "Create Poll"}
      </Button>
    </form>
  );
}