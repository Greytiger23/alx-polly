"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Input validation and sanitization helper
function validateAndSanitizeInput(input: string, maxLength: number, fieldName: string) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty.` };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be ${maxLength} characters or less.` };
  }
  
  // Basic XSS prevention - remove potentially dangerous characters
  const sanitized = trimmed
    .replace(/[<>"'&]/g, '') // Remove basic HTML/script injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
  
  return { isValid: true, sanitized };
}

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const questionRaw = formData.get("question") as string;
  const optionsRaw = formData.getAll("options").filter(Boolean) as string[];

  // Validate question
  const questionValidation = validateAndSanitizeInput(questionRaw, 500, "Question");
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  const question = questionValidation.sanitized!;

  // Validate options
  if (optionsRaw.length < 2) {
    return { error: "Please provide at least two options." };
  }
  
  if (optionsRaw.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }

  const options: string[] = [];
  for (let i = 0; i < optionsRaw.length; i++) {
    const optionValidation = validateAndSanitizeInput(optionsRaw[i], 200, `Option ${i + 1}`);
    if (!optionValidation.isValid) {
      return { error: optionValidation.error };
    }
    options.push(optionValidation.sanitized!);
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate poll exists
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found." };
  }

  // Validate option index
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  // Check if user already voted (prevent duplicate voting)
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: "You have already voted on this poll." };
    }
  }

  // For anonymous users, we could check by IP or session, but for now we'll allow it
  // In production, consider implementing IP-based duplicate prevention

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  
  // Revalidate the poll page to show updated results
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

// GET POLL WITH RESULTS
export async function getPollWithResults(id: string) {
  const supabase = await createClient();
  
  // Get poll data
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (pollError || !poll) {
    return { poll: null, results: null, error: "Poll not found." };
  }

  // Get vote counts for each option
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", id);

  if (votesError) {
    return { poll: null, results: null, error: "Failed to fetch vote results." };
  }

  // Calculate results
  const totalVotes = votes.length;
  const optionCounts = new Array(poll.options.length).fill(0);
  
  votes.forEach((vote) => {
    if (vote.option_index >= 0 && vote.option_index < poll.options.length) {
      optionCounts[vote.option_index]++;
    }
  });

  const results = poll.options.map((option: string, index: number) => ({
    option,
    votes: optionCounts[index],
    percentage: totalVotes > 0 ? Math.round((optionCounts[index] / totalVotes) * 100) : 0,
  }));

  return { poll, results, totalVotes, error: null };
}

// CHECK IF USER HAS VOTED
export async function hasUserVoted(pollId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasVoted: false, error: null };
  }

  const { data: vote, error } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    return { hasVoted: false, error: error.message };
  }

  return { hasVoted: !!vote, selectedOption: vote?.option_index, error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "You must be logged in to delete a poll." };
  }
  
  // First check if the poll exists and belongs to the user
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();
  
  if (fetchError) {
    return { error: "Poll not found." };
  }
  
  if (poll.user_id !== user.id) {
    return { error: "You can only delete your own polls." };
  }
  
  // Delete associated votes first
  const { error: votesError } = await supabase
    .from("votes")
    .delete()
    .eq("poll_id", id);
  
  if (votesError) {
    return { error: `Failed to delete votes: ${votesError.message}` };
  }
  
  // Then delete the poll
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Double-check ownership
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const questionRaw = formData.get("question") as string;
  const optionsRaw = formData.getAll("options").filter(Boolean) as string[];

  // Validate question
  const questionValidation = validateAndSanitizeInput(questionRaw, 500, "Question");
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  const question = questionValidation.sanitized!;

  // Validate options
  if (optionsRaw.length < 2) {
    return { error: "Please provide at least two options." };
  }
  
  if (optionsRaw.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }

  const options: string[] = [];
  for (let i = 0; i < optionsRaw.length; i++) {
    const optionValidation = validateAndSanitizeInput(optionsRaw[i], 200, `Option ${i + 1}`);
    if (!optionValidation.isValid) {
      return { error: optionValidation.error };
    }
    options.push(optionValidation.sanitized!);
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
