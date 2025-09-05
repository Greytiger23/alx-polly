'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and methods.
 * 
 * This context provides centralized authentication state management across
 * the application, including user data, session information, and auth actions.
 */
interface AuthContextType {
  /** Current Supabase session object containing tokens and user data */
  session: Session | null;
  /** Current authenticated user object with profile information */
  user: User | null;
  /** Function to sign out the current user */
  signOut: () => void;
  /** Loading state indicating if auth initialization is in progress */
  loading: boolean;
}

/**
 * React context for managing authentication state throughout the application.
 * 
 * Provides access to current user, session, loading state, and sign out functionality.
 * Should be consumed via the useAuth hook rather than directly.
 */
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication provider component that manages auth state for the entire application.
 * 
 * This component initializes the Supabase client, fetches the current user on mount,
 * and listens for authentication state changes. It provides auth context to all
 * child components and handles the loading state during initialization.
 * 
 * @param children - React components that need access to authentication context
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Memoize Supabase client to prevent unnecessary re-initializations
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    /**
     * Fetches the current user on component mount.
     * This handles cases where the user is already authenticated
     * when the app loads (e.g., returning user with valid session).
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      
      // Only update state if component is still mounted (prevents memory leaks)
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Session will be set by auth state listener
        setLoading(false);
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    getUser();

    // Listen for authentication state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Note: Don't set loading to false here, only after initial load
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Signs out the current user and clears the authentication state.
   * This will trigger the auth state change listener and update the context.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('AuthContext: user', user);
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context throughout the application.
 * 
 * This hook provides access to the current user, session, loading state,
 * and authentication methods. It must be used within components that are
 * wrapped by the AuthProvider.
 * 
 * @returns {AuthContextType} Object containing:
 *   - session: Current Supabase session with tokens and user data
 *   - user: Current authenticated user object
 *   - signOut: Function to sign out the current user
 *   - loading: Boolean indicating if auth initialization is in progress
 * 
 * @throws {Error} If used outside of AuthProvider context
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, loading, signOut } = useAuth();
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {user.email}</h1>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Ensure hook is used within AuthProvider context
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
