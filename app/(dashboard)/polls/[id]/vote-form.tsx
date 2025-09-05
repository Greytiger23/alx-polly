"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitVote } from "@/app/lib/actions/poll-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sanitizeText } from "@/app/lib/utils/sanitize";

interface VoteFormProps {
  pollId: string;
  options: string[];
}

export function VoteForm({ pollId, options }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (selectedOption === null) return;

    setIsSubmitting(true);
    try {
      const result = await submitVote(pollId, selectedOption);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Vote submitted successfully!");
        router.refresh(); // Refresh to show results
      }
    } catch (error) {
      toast.error("Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {options.map((option, index) => (
          <label
            key={index}
            className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <input
              type="radio"
              name="poll-option"
              value={index}
              checked={selectedOption === index}
              onChange={() => setSelectedOption(index)}
              className="text-primary"
            />
            <span>{sanitizeText(option)}</span>
          </label>
        ))}
      </div>
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