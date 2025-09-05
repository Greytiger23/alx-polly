'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Checks if the current authenticated user has administrative privileges.
 * 
 * This function serves as a security gate for admin-only operations.
 * Currently uses a hardcoded email list for simplicity, but in production
 * should be replaced with a proper role-based access control system.
 * 
 * @returns Object containing:
 *   - isAdmin: Boolean indicating if user has admin privileges
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { isAdmin, error } = await checkAdminAccess();
 * if (error) {
 *   console.error('Access check failed:', error);
 * } else if (isAdmin) {
 *   console.log('User has admin privileges');
 * } else {
 *   console.log('User does not have admin privileges');
 * }
 * ```
 */
export async function checkAdminAccess() {
  const supabase = await createClient();
  
  // Get current user session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { isAdmin: false, error: 'Not authenticated' };
  }
  
  // TODO: Replace with database-driven role system in production
  // Currently using hardcoded admin email list for simplicity
  const adminEmails = [
    'admin@alxpolly.com',
    // Add more admin emails as needed
  ];
  
  // Check if user's email is in the admin list
  const isAdmin = adminEmails.includes(user.email || '');
  
  if (!isAdmin) {
    return { isAdmin: false, error: 'Insufficient privileges' };
  }
  
  return { isAdmin: true, error: null };
}

/**
 * Retrieves all polls in the system for administrative oversight.
 * 
 * This function provides administrators with a comprehensive view of all polls
 * created by users, ordered by creation date (newest first). It includes
 * proper authorization checks to ensure only admins can access this data.
 * 
 * @returns Object containing:
 *   - polls: Array of all poll objects or empty array on error
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getAllPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls in the system`);
 *   polls.forEach(poll => console.log(`Poll: ${poll.title}`));
 * }
 * ```
 */
export async function getAllPolls() {
  // Verify admin privileges before proceeding
  const adminCheck = await checkAdminAccess();
  
  if (!adminCheck.isAdmin) {
    return { polls: [], error: adminCheck.error };
  }
  
  const supabase = await createClient();
  
  // Fetch all polls ordered by creation date (newest first)
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return { polls: [], error: error.message };
  }
  
  return { polls: data || [], error: null };
}

/**
 * Deletes a poll and all associated votes with administrative privileges.
 * 
 * This function allows administrators to remove any poll from the system,
 * regardless of ownership. It performs a cascading delete to maintain
 * database integrity by removing votes before deleting the poll.
 * 
 * @param pollId - The unique identifier of the poll to delete
 * @returns Object with error message or null on success
 * 
 * @example
 * ```typescript
 * const result = await adminDeletePoll('poll-123');
 * if (result.error) {
 *   console.error('Admin deletion failed:', result.error);
 * } else {
 *   console.log('Poll successfully deleted by admin');
 * }
 * ```
 */
export async function adminDeletePoll(pollId: string) {
  // Verify admin privileges before allowing deletion
  const adminCheck = await checkAdminAccess();
  
  if (!adminCheck.isAdmin) {
    return { error: adminCheck.error };
  }
  
  const supabase = await createClient();
  
  // Delete all votes associated with the poll first (cascading delete)
  const { error: votesError } = await supabase
    .from('votes')
    .delete()
    .eq('poll_id', pollId);
  
  if (votesError) {
    return { error: `Failed to delete votes: ${votesError.message}` };
  }
  
  // Delete the poll itself after votes are removed
  const { error: pollError } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId);
  
  if (pollError) {
    return { error: `Failed to delete poll: ${pollError.message}` };
  }
  
  return { error: null };
}