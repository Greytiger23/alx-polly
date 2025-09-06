"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/lib/context/auth-context";

/**
 * Dashboard Layout Component
 * 
 * Provides the main layout structure for all authenticated dashboard pages.
 * Includes navigation header, user authentication checks, and footer.
 * 
 * Features:
 * - Authentication guard that redirects unauthenticated users to login
 * - Responsive navigation with poll management links
 * - User avatar dropdown with profile and logout options
 * - Loading state handling during authentication checks
 * - Consistent styling and layout for all dashboard pages
 * 
 * @param children - The page content to render within the layout
 * @returns JSX element containing the complete dashboard layout
 * 
 * @example
 * ```tsx
 * // This layout automatically wraps all pages in the (dashboard) route group
 * // Pages like /polls, /create, etc. will use this layout
 * ```
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Get authentication state and methods from context
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Handle user logout and redirect to login
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p>Loading user session...</p>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Main navigation header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* App logo/brand */}
          <Link href="/polls" className="text-xl font-bold text-slate-800">
            ALX Polly
          </Link>
          
          {/* Desktop navigation links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/polls" className="text-slate-600 hover:text-slate-900">
              My Polls
            </Link>
            <Link
              href="/create"
              className="text-slate-600 hover:text-slate-900"
            >
              Create Poll
            </Link>
          </nav>
          
          {/* User actions section */}
          <div className="flex items-center space-x-4">
            {/* Primary CTA button */}
            <Button asChild>
              <Link href="/create">Create Poll</Link>
            </Button>
            
            {/* User profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url ||
                        "/placeholder-user.jpg"
                      }
                      alt={user?.email || "User"}
                    />
                    <AvatarFallback>
                      {user?.email ? user.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      
      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ALX Polly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
