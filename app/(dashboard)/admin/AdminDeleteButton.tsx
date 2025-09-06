'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminDeletePoll } from '@/app/lib/actions/admin-actions';
import { useRouter } from 'next/navigation';

/** Props for the AdminDeleteButton component */
interface AdminDeleteButtonProps {
  /** ID of the poll to delete */
  pollId: string;
}

/**
 * Admin Delete Button Component
 * 
 * A specialized delete button for administrators to remove any poll from the system.
 * Provides confirmation dialog, loading states, and error handling.
 * 
 * Features:
 * - Admin-only poll deletion (bypasses ownership checks)
 * - Double confirmation dialog for safety
 * - Loading state with disabled button during deletion
 * - Error handling with user feedback
 * - Automatic page refresh after successful deletion
 * 
 * Security:
 * - Uses adminDeletePoll action which includes admin privilege verification
 * - Requires explicit user confirmation before deletion
 * - Handles errors gracefully without exposing system details
 * 
 * @param pollId - The unique identifier of the poll to delete
 * @returns JSX element containing the delete button
 * 
 * @example
 * ```tsx
 * // Used in admin panel for poll management
 * <AdminDeleteButton pollId="poll-123" />
 * ```
 */
export default function AdminDeleteButton({ pollId }: AdminDeleteButtonProps) {
  // Track deletion state for loading indicator
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  /**
   * Handles the poll deletion process with confirmation and error handling
   * Shows confirmation dialog, manages loading state, and provides user feedback
   */
  const handleDelete = async () => {
    // Require explicit user confirmation before proceeding
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    // Set loading state to disable button and show progress
    setIsDeleting(true);
    
    try {
      // Call admin delete action with privilege verification
      const result = await adminDeletePoll(pollId);
      
      if (result.error) {
        // Show specific error message to admin
        alert(`Error deleting poll: ${result.error}`);
      } else {
        // Refresh the page to show updated poll list
        router.refresh();
      }
    } catch (error) {
      // Handle unexpected errors gracefully
      alert('An unexpected error occurred while deleting the poll.');
    } finally {
      // Always reset loading state
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}