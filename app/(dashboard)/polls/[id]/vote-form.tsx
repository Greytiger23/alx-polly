"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitVote } from "@/app/lib/actions/poll-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sanitizeText } from "@/app/lib/utils/sanitize";

/**
 * Props for the VoteForm component.
 */
interface VoteFormProps {
  /** The unique identifier of the poll to vote on */
  pollId: string;
  /** Array of poll options that users can vote for */
  options: string[];
}

/**
 * Interactive voting form component that allows users to select and submit votes.
 * 
 * This component provides a radio button interface for poll options and handles
 * the complete voting workflow including validation, submission, and user feedback.
 * It prevents multiple submissions and provides real-time feedback through toasts.
 * 
 * @param pollId - The unique identifier of the poll
 * @param options - Array of poll options to display
 * 
 * @example
 * ```tsx
 * <VoteForm 
 *   pollId="poll-123" 
 *   options={["Option A", "Option B", "Option C"]} 
 * />
 * ```
 */
export function VoteForm({ pollId, options }: VoteFormProps) {
  // Track which option the user has selected (null = no selection)
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  // Prevent multiple simultaneous submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /**
   * Handles vote submission with validation and error handling.
   * 
   * This function validates the selection, submits the vote via server action,
   * provides user feedback through toasts, and refreshes the page to show results.
   */
  const handleSubmit = async () => {
    // Prevent submission if no option is selected
    if (selectedOption === null) return;

    setIsSubmitting(true);
    try {
      // Submit vote through server action
      const result = await submitVote(pollId, selectedOption);
      
      if (result.error) {
        // Display server-side validation errors
        toast.error(result.error);
      } else {
        // Show success message and refresh to display results
        toast.success("Vote submitted successfully!");
        router.refresh(); // Refresh to show results and hide vote form
      }
    } catch (error) {
      // Handle unexpected client-side errors
      toast.error("Failed to submit vote. Please try again.");
    } finally {
      // Re-enable the submit button regardless of outcome
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Radio button group for poll options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <label
            key={index}
            className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            {/* Radio input for option selection */}
            <input
              type="radio"
              name="poll-option"
              value={index}
              checked={selectedOption === index}
              onChange={() => setSelectedOption(index)}
              className="text-primary"
            />
            {/* Sanitized option text to prevent XSS */}
            <span>{sanitizeText(option)}</span>
          </label>
        ))}
      </div>
      {/* Submit button with loading state and validation */}
      <Button 
        onClick={handleSubmit} 
        disabled={selectedOption === null || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Vote"}
      </Button>
    </div>
  );
}