# ALX Polly: Modern Polling Application

![ALX Polly](https://img.shields.io/badge/ALX-Polly-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

A comprehensive, secure, and user-friendly polling application built with modern web technologies. ALX Polly enables users to create, share, and participate in polls with real-time results and advanced sharing capabilities.

## ✨ Features

### 🔐 Authentication & Security
- **Secure Authentication**: Email/password authentication with Supabase Auth
- **Session Management**: Persistent login sessions with automatic token refresh
- **Protected Routes**: Middleware-based route protection for authenticated areas
- **Input Sanitization**: XSS protection with comprehensive input sanitization
- **Admin Panel**: Role-based access control for administrative functions

### 📊 Poll Management
- **Create Polls**: Rich poll creation with multiple options (2-10 options)
- **Edit Polls**: Modify existing polls with ownership verification
- **Delete Polls**: Secure poll deletion with confirmation dialogs
- **Poll Settings**: Configure voting behavior and access controls
- **Real-time Results**: Live vote counting and result visualization

### 🗳️ Voting System
- **Secure Voting**: Duplicate vote prevention and validation
- **Anonymous Options**: Support for anonymous voting when enabled
- **Vote Tracking**: User vote history and status tracking
- **Result Visualization**: Progress bars and percentage displays

### 🎯 User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Clean interface using shadcn/ui components
- **QR Code Sharing**: Generate QR codes for easy poll sharing
- **Dashboard**: Personalized user dashboard for poll management
- **Real-time Updates**: Automatic page updates after actions

## 🛠️ Technology Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern React component library
- **[React Hook Form](https://react-hook-form.com/)** - Performant form handling

### Backend & Database
- **[Supabase](https://supabase.io/)** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database with real-time subscriptions
- **Row Level Security (RLS)** - Database-level security policies
- **Supabase Auth** - Authentication and user management

### Development & Deployment
- **Server Actions** - Next.js server-side form handling
- **Server Components** - React Server Components for optimal performance
- **Middleware** - Route protection and request handling
- **Environment Variables** - Secure configuration management

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- A **Supabase** account ([create one free](https://supabase.com))

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alx-polly
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Setup

#### Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: ALX Polly
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Wait for the project to be created (2-3 minutes)

#### Configure Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  votes JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS on polls table
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own polls" ON polls FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own polls" ON polls FOR DELETE USING (auth.uid() = created_by);

-- Enable RLS on votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Votes policies
CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000
```

**Where to find your Supabase keys:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**
4. For the service role key, copy the **service_role** key (keep this secret!)

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at **http://localhost:3000**

---

## 📖 Usage Guide

### Creating Your First Poll

1. **Sign Up/Login**: Navigate to `/login` and create an account
2. **Access Dashboard**: After login, you'll be redirected to your dashboard
3. **Create Poll**: Click "Create Poll" button
4. **Fill Details**:
   - Enter your poll question
   - Add 2-10 options
   - Click "Create Poll"
5. **Share**: Copy the poll link or use the QR code to share

### Voting on Polls

1. **Access Poll**: Use the shared link or QR code
2. **Cast Vote**: Select your preferred option
3. **View Results**: See real-time results after voting
4. **Share**: Share the poll with others

### Managing Your Polls

- **View All Polls**: Dashboard shows all your created polls
- **Edit Polls**: Click edit button to modify poll details
- **Delete Polls**: Use delete button with confirmation
- **View Analytics**: See vote counts and percentages

---

## 🧪 Development

### Project Structure

```
alx-polly/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── poll/              # Public poll pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Supabase client setup
│   ├── actions/          # Server Actions
│   └── utils.ts          # Utility functions
├── middleware.ts          # Next.js middleware for auth
└── package.json          # Dependencies and scripts
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:reset     # Reset database schema
npm run db:seed      # Seed database with sample data
```

### Code Style Guidelines

- **Components**: Use PascalCase for component files (`PollCard.tsx`)
- **Functions**: Use camelCase for utility functions (`createPoll.ts`)
- **Server Components**: Default for data fetching and display
- **Client Components**: Use `'use client'` only when needed for interactivity
- **Server Actions**: Handle form submissions and mutations
- **TypeScript**: Maintain strict type safety throughout

---

## 🔒 Security Features

This application implements several security best practices:

- **Authentication**: Supabase Auth with secure session management
- **Authorization**: Row Level Security (RLS) policies in database
- **Input Sanitization**: XSS protection with comprehensive validation
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Environment Variables**: Secure configuration management
- **Type Safety**: TypeScript for compile-time error prevention

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**: Import your GitHub repository to Vercel
2. **Configure Environment Variables**: Add all `.env.local` variables
3. **Deploy**: Vercel will automatically build and deploy
4. **Update Supabase**: Add your Vercel domain to Supabase Auth settings

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use `@netlify/plugin-nextjs`
- **Railway**: Direct deployment with environment variables
- **DigitalOcean App Platform**: Node.js application

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add TypeScript types for all new code
- Include comprehensive documentation
- Update README as needed
- Ensure all functionality works before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

If you encounter any issues or have questions:

1. **Check Documentation**: Review this README and inline code comments
2. **Search Issues**: Look through existing GitHub issues
3. **Create Issue**: Open a new issue with detailed description
4. **Community**: Join our community discussions

---

**Built with ❤️ for the ALX Software Engineering Program**
