'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminDeletePoll } from '@/app/lib/actions/admin-actions';
import { useRouter } from 'next/navigation';

interface AdminDeleteButtonProps {
  pollId: string;
}

export default function AdminDeleteButton({ pollId }: AdminDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await adminDeletePoll(pollId);
      
      if (result.error) {
        alert(`Error deleting poll: ${result.error}`);
      } else {
        // Refresh the page to show updated poll list
        router.refresh();
      }
    } catch (error) {
      alert('An unexpected error occurred while deleting the poll.');
    } finally {
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