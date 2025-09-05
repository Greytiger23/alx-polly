'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password using Supabase Auth.
 * 
 * This server action handles user login by validating credentials against Supabase's
 * authentication system. On successful login, Supabase automatically sets the session
 * cookies which are then used by middleware for route protection.
 * 
 * @param data - The login form data containing email and password
 * @param data.email - User's email address
 * @param data.password - User's password
 * @returns Promise resolving to either null (success) or error message
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'password123' });
 * if (result?.error) {
 *   console.error('Login failed:', result.error);
 * } else {
 *   // Login successful, user is now authenticated
 * }
 * ```
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt to sign in with provided credentials
  // Supabase handles password hashing and validation internally
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    // Return user-friendly error message for display in UI
    return { error: error.message };
  }

  // Success: session is automatically set by Supabase
  return { error: null };
}

/**
 * Registers a new user account with email, password, and display name.
 * 
 * This server action creates a new user account in Supabase Auth and stores
 * the user's display name in their metadata. Supabase may send a confirmation
 * email depending on the auth configuration.
 * 
 * @param data - The registration form data
 * @param data.name - User's display name (stored in user metadata)
 * @param data.email - User's email address (must be unique)
 * @param data.password - User's password (will be hashed by Supabase)
 * @returns Promise resolving to either null (success) or error message
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'securePassword123' 
 * });
 * if (result?.error) {
 *   console.error('Registration failed:', result.error);
 * } else {
 *   // Registration successful, user may need to verify email
 * }
 * ```
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Create new user account with email/password and store name in metadata
  // Supabase automatically hashes the password and may send confirmation email
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Stored in user.user_metadata.name
      },
    },
  });

  if (error) {
    // Return descriptive error (e.g., "User already registered", "Password too weak")
    return { error: error.message };
  }

  // Success: user created, session may be pending email confirmation
  return { error: null };
}

/**
 * Signs out the current user and clears their session.
 * 
 * This server action terminates the user's authentication session by calling
 * Supabase's signOut method, which clears session cookies and invalidates
 * the current session across all tabs/windows.
 * 
 * @returns Promise resolving to either null (success) or error message
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result?.error) {
 *   console.error('Logout failed:', result.error);
 * } else {
 *   // User successfully logged out, redirect to login page
 * }
 * ```
 */
export async function logout() {
  const supabase = await createClient();
  
  // Clear user session and remove auth cookies
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}

/**
 * Retrieves the currently authenticated user's information.
 * 
 * This server action fetches the current user's data from Supabase Auth,
 * including their ID, email, and metadata. Returns null if no user is
 * currently authenticated.
 * 
 * @returns Promise resolving to User object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Current user:', user.email, user.user_metadata.name);
 * } else {
 *   console.log('No user authenticated');
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Fetch current user from session, returns null if not authenticated
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current authentication session.
 * 
 * This server action gets the current session object which contains
 * the access token, refresh token, and user information. Used primarily
 * for session validation and token management.
 * 
 * @returns Promise resolving to Session object or null if no active session
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Session expires at:', session.expires_at);
 *   console.log('User ID:', session.user.id);
 * } else {
 *   console.log('No active session');
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Get current session with tokens and user data
  const { data } = await supabase.auth.getSession();
  return data.session;
}
