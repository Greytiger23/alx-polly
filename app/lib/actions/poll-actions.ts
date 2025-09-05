"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Validates and sanitizes user input to prevent XSS attacks and ensure data integrity.
 * 
 * This helper function performs multiple security checks:
 * - Validates input type and presence
 * - Trims whitespace and checks for empty strings
 * - Enforces maximum length limits
 * - Removes potentially dangerous HTML/JavaScript characters
 * 
 * @param input - The raw input string to validate
 * @param maxLength - Maximum allowed length for the input
 * @param fieldName - Name of the field for error messages
 * @returns Object with validation result and sanitized input or error message
 * 
 * @example
 * ```typescript
 * const result = validateAndSanitizeInput("<script>alert('xss')</script>", 100, "Question");
 * if (result.isValid) {
 *   console.log(result.sanitized); // "scriptalert('xss')/script"
 * }
 * ```
 */
function validateAndSanitizeInput(input: string, maxLength: number, fieldName: string) {
  // Check if input exists and is a string
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  
  const trimmed = input.trim();
  
  // Ensure input is not empty after trimming
  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty.` };
  }
  
  // Enforce maximum length to prevent database overflow
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

/**
 * Creates a new poll with the provided question and options.
 * 
 * This function handles the complete poll creation process:
 * - Validates and sanitizes all user inputs
 * - Ensures user authentication
 * - Checks for duplicate options
 * - Stores the poll in the database
 * - Revalidates the polls page cache
 * 
 * @param formData - FormData object containing:
 *   - question: The poll question (max 500 chars)
 *   - options: Array of poll options (2-10 options, max 200 chars each)
 * @returns Object with error message or null on success
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What is your favorite color?');
 * formData.append('options', 'Red');
 * formData.append('options', 'Blue');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   console.error('Failed to create poll:', result.error);
 * }
 * ```
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract raw form data
  const questionRaw = formData.get("question") as string;
  const optionsRaw = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize the poll question
  const questionValidation = validateAndSanitizeInput(questionRaw, 500, "Question");
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  const question = questionValidation.sanitized!;

  // Validate minimum and maximum number of options
  if (optionsRaw.length < 2) {
    return { error: "Please provide at least two options." };
  }
  
  if (optionsRaw.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }

  // Validate and sanitize each poll option
  const options: string[] = [];
  for (let i = 0; i < optionsRaw.length; i++) {
    const optionValidation = validateAndSanitizeInput(optionsRaw[i], 200, `Option ${i + 1}`);
    if (!optionValidation.isValid) {
      return { error: optionValidation.error };
    }
    options.push(optionValidation.sanitized!);
  }
  
  // Prevent duplicate options to ensure poll integrity
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Verify user authentication before creating poll
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

  // Insert the new poll into the database
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

  // Revalidate the polls page to show the new poll
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the currently authenticated user.
 * 
 * This function fetches polls belonging to the current user and orders them
 * by creation date (newest first). It's used primarily for the user's dashboard
 * to display their personal poll collection.
 * 
 * @returns Object containing:
 *   - polls: Array of user's polls (empty array if none found)
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls`);
 * }
 * ```
 */
export async function getUserPolls() {
  const supabase = await createClient();
  
  // Verify user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch user's polls ordered by creation date (newest first)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by its unique identifier.
 * 
 * This function fetches a single poll from the database using its ID.
 * It's used for displaying poll details, editing polls, and voting.
 * Note: This function doesn't check ownership - it can retrieve any poll by ID.
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Object containing:
 *   - poll: The poll data or null if not found
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollById('123e4567-e89b-12d3-a456-426614174000');
 * if (error || !poll) {
 *   console.error('Poll not found:', error);
 * } else {
 *   console.log('Poll question:', poll.question);
 * }
 * ```
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Fetch poll by ID (no ownership check - public access)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Submits a vote for a specific poll option.
 * 
 * This function handles the complete voting process:
 * - Validates that the poll exists
 * - Ensures the selected option is valid
 * - Prevents duplicate voting by authenticated users
 * - Records the vote in the database
 * - Revalidates the poll page to show updated results
 * 
 * @param pollId - The unique identifier of the poll to vote on
 * @param optionIndex - The zero-based index of the selected option
 * @returns Object with error message or null on success
 * 
 * @example
 * ```typescript
 * // Vote for the first option (index 0) in a poll
 * const result = await submitVote('poll-123', 0);
 * if (result.error) {
 *   console.error('Vote failed:', result.error);
 * } else {
 *   console.log('Vote submitted successfully!');
 * }
 * ```
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Get current user (may be null for anonymous voting)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate that the poll exists and get its options
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found." };
  }

  // Validate that the selected option index is within bounds
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  // Prevent duplicate voting for authenticated users
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

  // Insert the vote into the database
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null, // null for anonymous votes
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  
  // Revalidate the poll page to show updated results immediately
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

/**
 * Retrieves a poll along with its voting results and statistics.
 * 
 * This function fetches both the poll data and calculates voting statistics
 * including vote counts and percentages for each option. It's used for
 * displaying poll results on the poll detail page.
 * 
 * @param id - The unique identifier of the poll
 * @returns Object containing:
 *   - poll: The poll data
 *   - results: Array of options with vote counts and percentages
 *   - totalVotes: Total number of votes cast
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { poll, results, totalVotes, error } = await getPollWithResults('poll-123');
 * if (error || !poll) {
 *   console.error('Failed to fetch poll results:', error);
 * } else {
 *   console.log(`Poll "${poll.question}" has ${totalVotes} total votes`);
 *   results.forEach(result => {
 *     console.log(`${result.option}: ${result.votes} votes (${result.percentage}%)`);
 *   });
 * }
 * ```
 */
export async function getPollWithResults(id: string) {
  const supabase = await createClient();
  
  // Fetch the poll data first
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (pollError || !poll) {
    return { poll: null, results: null, error: "Poll not found." };
  }

  // Fetch all votes for this poll to calculate results
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", id);

  if (votesError) {
    return { poll: null, results: null, error: "Failed to fetch vote results." };
  }

  // Calculate voting statistics
  const totalVotes = votes.length;
  const optionCounts = new Array(poll.options.length).fill(0);
  
  // Count votes for each option (with bounds checking)
  votes.forEach((vote) => {
    if (vote.option_index >= 0 && vote.option_index < poll.options.length) {
      optionCounts[vote.option_index]++;
    }
  });

  // Create results array with vote counts and percentages
  const results = poll.options.map((option: string, index: number) => ({
    option,
    votes: optionCounts[index],
    percentage: totalVotes > 0 ? Math.round((optionCounts[index] / totalVotes) * 100) : 0,
  }));

  return { poll, results, totalVotes, error: null };
}

/**
 * Checks if the current authenticated user has already voted on a specific poll.
 * 
 * This function is used to determine whether to show voting options or results
 * to the user. It prevents duplicate voting by tracking user participation.
 * 
 * @param pollId - The unique identifier of the poll to check
 * @returns Object containing:
 *   - hasVoted: Boolean indicating if user has voted
 *   - selectedOption: Index of the option the user voted for (if applicable)
 *   - error: Error message or null on success
 * 
 * @example
 * ```typescript
 * const { hasVoted, selectedOption, error } = await hasUserVoted('poll-123');
 * if (error) {
 *   console.error('Failed to check vote status:', error);
 * } else if (hasVoted) {
 *   console.log(`User already voted for option ${selectedOption}`);
 * } else {
 *   console.log('User can vote on this poll');
 * }
 * ```
 */
export async function hasUserVoted(pollId: string) {
  const supabase = await createClient();
  
  // Get current user - anonymous users are considered as not voted
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasVoted: false, error: null };
  }

  // Check if user has a vote record for this poll
  const { data: vote, error } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  // Handle "not found" error as normal case (user hasn't voted)
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    return { hasVoted: false, error: error.message };
  }

  return { hasVoted: !!vote, selectedOption: vote?.option_index, error: null };
}

/**
 * Deletes a poll and all associated votes.
 * 
 * This function performs a cascading delete operation:
 * 1. Verifies user authentication and ownership
 * 2. Deletes all votes associated with the poll
 * 3. Deletes the poll itself
 * 4. Revalidates the polls page cache
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Object with error message or null on success
 * 
 * @example
 * ```typescript
 * const result = await deletePoll('poll-123');
 * if (result.error) {
 *   console.error('Failed to delete poll:', result.error);
 * } else {
 *   console.log('Poll deleted successfully');
 * }
 * ```
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Verify user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "You must be logged in to delete a poll." };
  }
  
  // Verify poll exists and user owns it
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
  
  // Delete all votes associated with this poll first (cascading delete)
  const { error: votesError } = await supabase
    .from("votes")
    .delete()
    .eq("poll_id", id);
  
  if (votesError) {
    return { error: `Failed to delete votes: ${votesError.message}` };
  }
  
  // Delete the poll itself with ownership double-check
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Double-check ownership for security
  
  if (error) {
    return { error: error.message };
  }
  
  // Refresh the polls page to reflect the deletion
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with new question and options.
 * 
 * This function allows poll owners to modify their polls while maintaining
 * data integrity and security. It validates all inputs, checks ownership,
 * and updates the poll with sanitized data.
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - Form data containing updated poll information
 * @returns Object with error message or null on success
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'Updated Poll Question?');
 * formData.append('options', 'Updated Option 1');
 * formData.append('options', 'Updated Option 2');
 * 
 * const result = await updatePoll('poll-123', formData);
 * if (result.error) {
 *   console.error('Failed to update poll:', result.error);
 * } else {
 *   console.log('Poll updated successfully');
 * }
 * ```
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Extract raw form data
  const questionRaw = formData.get("question") as string;
  const optionsRaw = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize the poll question
  const questionValidation = validateAndSanitizeInput(questionRaw, 500, "Question");
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  const question = questionValidation.sanitized!;

  // Validate minimum and maximum number of options
  if (optionsRaw.length < 2) {
    return { error: "Please provide at least two options." };
  }
  
  if (optionsRaw.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }

  // Validate and sanitize each poll option
  const options: string[] = [];
  for (let i = 0; i < optionsRaw.length; i++) {
    const optionValidation = validateAndSanitizeInput(optionsRaw[i], 200, `Option ${i + 1}`);
    if (!optionValidation.isValid) {
      return { error: optionValidation.error };
    }
    options.push(optionValidation.sanitized!);
  }
  
  // Prevent duplicate options to ensure poll integrity
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Verify user authentication before updating poll
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

  // Update the poll with ownership verification
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id); // Ensures only poll owner can update

  if (error) {
    return { error: error.message };
  }

  // Revalidate the polls page to show updated poll
  revalidatePath("/polls");
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}
