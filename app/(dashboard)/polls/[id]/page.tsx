import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import SecureShare from '../secure-share';
import { getPollWithResults, hasUserVoted } from '@/app/lib/actions/poll-actions';
import { VoteForm } from './vote-form';
import { notFound } from 'next/navigation';
import { sanitizeText } from '@/app/lib/utils/sanitize';

/**
 * Poll detail page component that displays either voting interface or results.
 * 
 * This server component handles the complete poll viewing experience:
 * - Fetches poll data and voting results from the database
 * - Checks if the current user has already voted
 * - Conditionally renders either the voting form or results view
 * - Provides poll management actions (edit, share)
 * 
 * The component automatically determines the user's voting status and shows
 * appropriate content: voting form for new voters, results for those who voted.
 * 
 * @param params - Route parameters containing the poll ID
 * @returns JSX element displaying poll details and voting interface/results
 */
export default async function PollDetailPage({ params }: { params: { id: string } }) {
  // Fetch poll data with calculated voting results
  const { poll, results, totalVotes, error } = await getPollWithResults(params.id);
  // Check if current user has already voted on this poll
  const { hasVoted, selectedOption } = await hasUserVoted(params.id);

  // Handle cases where poll doesn't exist or fetch failed
  if (error || !poll) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              {/* Poll title and metadata */}
              <div>
                <CardTitle>{sanitizeText(poll.question)}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{totalVotes || 0} votes</span>
                </div>
              </div>
              {/* Poll management actions */}
              <div className="flex gap-2">
                {/* Edit poll button */}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                {/* Share poll component */}
                <SecureShare pollId={poll.id} pollTitle={sanitizeText(poll.question)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Conditional rendering: voting form vs results */}
            {!hasVoted ? (
              /* Show voting form if user hasn't voted yet */
              <VoteForm pollId={poll.id} options={poll.options} />
            ) : (
              /* Show results if user has already voted */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Results</h3>
                  <Badge variant="secondary">You voted</Badge>
                </div>
                {/* Results visualization with progress bars */}
                <div className="space-y-3">
                  {results?.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        {/* Highlight user's selected option */}
                        <span className={`text-sm ${selectedOption === index ? 'font-semibold text-primary' : ''}`}>
                      {sanitizeText(result.option)}
                      {selectedOption === index && " (Your vote)"}
                    </span>
                        {/* Vote count and percentage */}
                        <span className="text-sm text-muted-foreground">
                          {result.votes} votes ({result.percentage}%)
                        </span>
                      </div>
                      {/* Visual progress bar for vote percentage */}
                      <Progress value={result.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}