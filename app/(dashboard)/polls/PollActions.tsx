"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";
import { sanitizeText } from "@/app/lib/utils/sanitize";

/** Poll data structure for the component */
interface Poll {
  /** Unique identifier for the poll */
  id: string;
  /** The poll question text */
  question: string;
  /** Array of poll options */
  options: any[];
  /** ID of the user who created the poll */
  user_id: string;
}

/** Props for the PollActions component */
interface PollActionsProps {
  /** Poll data to display and manage */
  poll: Poll;
}

/**
 * Poll Actions Component
 * 
 * Displays a poll card with navigation and management actions.
 * Shows poll information and provides edit/delete actions for poll owners.
 * 
 * Features:
 * - Clickable poll card that navigates to poll details
 * - Sanitized poll question display
 * - Option count indicator
 * - Owner-only edit and delete actions
 * - Confirmation dialog for deletion
 * - Responsive hover effects
 * 
 * Security:
 * - Only shows edit/delete buttons to poll owners
 * - Confirms deletion before executing
 * - Sanitizes poll question text for XSS protection
 * 
 * @param poll - Poll data object containing id, question, options, and user_id
 * @returns JSX element containing the poll card with actions
 * 
 * @example
 * ```tsx
 * <PollActions poll={{
 *   id: "123",
 *   question: "What's your favorite color?",
 *   options: [{}, {}],
 *   user_id: "user123"
 * }} />
 * ```
 */
export default function PollActions({ poll }: PollActionsProps) {
  // Get current user for ownership verification
  const { user } = useAuth();
  
  /**
   * Handles poll deletion with user confirmation
   * Confirms action with user before proceeding with deletion
   */
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      window.location.reload(); // Refresh to update the poll list
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      {/* Clickable poll card that navigates to poll details */}
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              {/* Poll question with hover effect */}
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {sanitizeText(poll.question)}
              </h2>
              {/* Option count indicator */}
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Owner-only management actions */}
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          {/* Edit poll button */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          {/* Delete poll button with confirmation */}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
