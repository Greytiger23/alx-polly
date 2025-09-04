'use server';

import { createClient } from '@/lib/supabase/server';

// Check if current user has admin privileges
export async function checkAdminAccess() {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { isAdmin: false, error: 'Not authenticated' };
  }
  
  // Check if user has admin role in user metadata or a separate admin table
  // For now, we'll check if the user email is in a predefined admin list
  // In production, this should be stored in the database
  const adminEmails = [
    'admin@alxpolly.com',
    // Add more admin emails as needed
  ];
  
  const isAdmin = adminEmails.includes(user.email || '');
  
  if (!isAdmin) {
    return { isAdmin: false, error: 'Insufficient privileges' };
  }
  
  return { isAdmin: true, error: null };
}

// Get all polls for admin view with proper authorization
export async function getAllPolls() {
  const adminCheck = await checkAdminAccess();
  
  if (!adminCheck.isAdmin) {
    return { polls: [], error: adminCheck.error };
  }
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return { polls: [], error: error.message };
  }
  
  return { polls: data || [], error: null };
}

// Admin delete poll with proper authorization
export async function adminDeletePoll(pollId: string) {
  const adminCheck = await checkAdminAccess();
  
  if (!adminCheck.isAdmin) {
    return { error: adminCheck.error };
  }
  
  const supabase = await createClient();
  
  // First delete all votes associated with the poll
  const { error: votesError } = await supabase
    .from('votes')
    .delete()
    .eq('poll_id', pollId);
  
  if (votesError) {
    return { error: `Failed to delete votes: ${votesError.message}` };
  }
  
  // Then delete the poll
  const { error: pollError } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId);
  
  if (pollError) {
    return { error: `Failed to delete poll: ${pollError.message}` };
  }
  
  return { error: null };
}