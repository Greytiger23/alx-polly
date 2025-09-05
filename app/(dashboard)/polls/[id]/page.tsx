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

export default async function PollDetailPage({ params }: { params: { id: string } }) {
  const { poll, results, totalVotes, error } = await getPollWithResults(params.id);
  const { hasVoted, selectedOption } = await hasUserVoted(params.id);

  if (error || !poll) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{sanitizeText(poll.question)}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{totalVotes || 0} votes</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <SecureShare pollId={poll.id} pollTitle={sanitizeText(poll.question)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!hasVoted ? (
              <VoteForm pollId={poll.id} options={poll.options} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Results</h3>
                  <Badge variant="secondary">You voted</Badge>
                </div>
                <div className="space-y-3">
                  {results?.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${selectedOption === index ? 'font-semibold text-primary' : ''}`}>
                      {sanitizeText(result.option)}
                      {selectedOption === index && " (Your vote)"}
                    </span>
                        <span className="text-sm text-muted-foreground">
                          {result.votes} votes ({result.percentage}%)
                        </span>
                      </div>
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