/**
 * Core application type definitions for the ALX Polly polling system.
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and better developer experience.
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * Represents a registered user in the system.
 * 
 * Users can create polls, vote on polls, and manage their account.
 * The image field is optional for profile pictures.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Display name of the user */
  name: string;
  /** Email address used for authentication */
  email: string;
  /** Optional profile image URL */
  image?: string;
  /** Timestamp when the user account was created */
  createdAt: Date;
  /** Timestamp when the user account was last updated */
  updatedAt: Date;
}

// ============================================================================
// Poll Types
// ============================================================================

/**
 * Represents a single option within a poll.
 * 
 * Each option has text content and tracks the number of votes it has received.
 */
export interface PollOption {
  /** Unique identifier for the poll option */
  id: string;
  /** The text content of the option */
  text: string;
  /** Number of votes this option has received */
  votes: number;
}

/**
 * Represents a complete poll with all its metadata and options.
 * 
 * Polls are the core entity of the application, containing questions,
 * multiple choice options, and various settings for voting behavior.
 */
export interface Poll {
  /** Unique identifier for the poll */
  id: string;
  /** The main question or title of the poll */
  title: string;
  /** Optional detailed description of the poll */
  description?: string;
  /** Array of voting options available for this poll */
  options: PollOption[];
  /** ID of the user who created this poll */
  createdBy: string;
  /** Timestamp when the poll was created */
  createdAt: Date;
  /** Timestamp when the poll was last updated */
  updatedAt: Date;
  /** Optional end date after which voting is disabled */
  endDate?: Date;
  /** Configuration settings for poll behavior */
  settings: PollSettings;
}

/**
 * Configuration settings that control poll voting behavior.
 * 
 * These settings determine how users can interact with the poll
 * and what restrictions apply to voting.
 */
export interface PollSettings {
  /** Whether users can vote for multiple options */
  allowMultipleVotes: boolean;
  /** Whether users must be logged in to vote */
  requireAuthentication: boolean;
}

// ============================================================================
// Vote Types
// ============================================================================

/**
 * Represents a single vote cast by a user on a poll option.
 * 
 * Votes track which user voted for which option and when.
 * The userId is optional to support anonymous voting when enabled.
 */
export interface Vote {
  /** Unique identifier for the vote */
  id: string;
  /** ID of the poll this vote belongs to */
  pollId: string;
  /** ID of the option that was voted for */
  optionId: string;
  /** ID of the user who cast the vote (null for anonymous votes) */
  userId?: string;
  /** Timestamp when the vote was cast */
  createdAt: Date;
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Form data structure for creating new polls.
 * 
 * This interface defines the expected shape of data when users
 * submit the poll creation form.
 */
export interface CreatePollFormData {
  /** The main question or title of the poll */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Array of option texts for voting */
  options: string[];
  /** Poll behavior configuration */
  settings: PollSettings;
  /** Optional end date in string format */
  endDate?: string;
}

/**
 * Form data structure for user login.
 * 
 * Contains the credentials required for user authentication.
 */
export interface LoginFormData {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Form data structure for user registration.
 * 
 * Contains all information needed to create a new user account.
 */
export interface RegisterFormData {
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's chosen password */
  password: string;
}