import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Poll } from '@/app/lib/types';
import { sanitizeText } from '@/app/lib/utils/sanitize';

interface PollCardProps {
  poll: {
    id: string;
    title: string;
    description?: string;
    options: any[];
    votes?: number;
    createdAt: string | Date;
  };
}

export function PollCard({ poll }: PollCardProps) {
  const totalVotes = poll.votes || poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  const formattedDate = typeof poll.createdAt === 'string' 
    ? new Date(poll.createdAt).toLocaleDateString() 
    : poll.createdAt.toLocaleDateString();

  return (
    <Link href={`/polls/${poll.id}`} className="group block h-full">
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="group-hover:text-blue-600 transition-colors">{sanitizeText(poll.title)}</CardTitle>
          {poll.description && <CardDescription>{sanitizeText(poll.description)}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">
            <p>{poll.options.length} options</p>
            <p>{totalVotes} total votes</p>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-slate-400">
          Created on {formattedDate}
        </CardFooter>
      </Card>
    </Link>
  );
}