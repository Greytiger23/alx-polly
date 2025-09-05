"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Share2, Twitter, Facebook, Mail } from "lucide-react";
import { toast } from "sonner";

interface SecureShareProps {
  pollId: string;
  pollTitle: string;
}

// Utility function to sanitize text for URLs and prevent XSS
function sanitizeForUrl(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags, scripts, and dangerous characters
  const sanitized = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  
  return sanitized;
}

// Utility function to validate and sanitize poll ID
function validatePollId(pollId: string): boolean {
  if (!pollId || typeof pollId !== 'string') {
    return false;
  }
  
  // Check if poll ID matches expected format (UUID or similar)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(pollId) || /^[a-zA-Z0-9_-]+$/.test(pollId);
}

export default function SecureShare({
  pollId,
  pollTitle,
}: SecureShareProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isValidPoll, setIsValidPoll] = useState(false);

  useEffect(() => {
    // Validate poll ID first
    if (!validatePollId(pollId)) {
      console.error('Invalid poll ID provided');
      setIsValidPoll(false);
      return;
    }
    
    setIsValidPoll(true);
    
    // Generate the share URL with validated poll ID
    const baseUrl = window.location.origin;
    const pollUrl = `${baseUrl}/polls/${encodeURIComponent(pollId)}`;
    setShareUrl(pollUrl);
  }, [pollId]);

  const copyToClipboard = async () => {
    if (!isValidPoll || !shareUrl) {
      toast.error("Invalid poll data");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareOnTwitter = () => {
    if (!isValidPoll || !shareUrl) {
      toast.error("Invalid poll data");
      return;
    }
    
    const sanitizedTitle = sanitizeForUrl(pollTitle);
    const text = encodeURIComponent(`Check out this poll: ${sanitizedTitle}`);
    const url = encodeURIComponent(shareUrl);
    
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareOnFacebook = () => {
    if (!isValidPoll || !shareUrl) {
      toast.error("Invalid poll data");
      return;
    }
    
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareViaEmail = () => {
    if (!isValidPoll || !shareUrl) {
      toast.error("Invalid poll data");
      return;
    }
    
    const sanitizedTitle = sanitizeForUrl(pollTitle);
    const subject = encodeURIComponent(`Poll: ${sanitizedTitle}`);
    const body = encodeURIComponent(
      `Hi! I'd like to share this poll with you: ${shareUrl}`
    );
    
    window.open(
      `mailto:?subject=${subject}&body=${body}`,
      "_self"
    );
  };

  // Don't render if poll data is invalid
  if (!isValidPoll) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Share2 className="h-5 w-5" />
            Share Unavailable
          </CardTitle>
          <CardDescription>
            Unable to generate sharing options for this poll.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share This Poll
        </CardTitle>
        <CardDescription>
          Share your poll with others to gather votes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Shareable Link
          </label>
          <div className="flex space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm"
              placeholder="Generating link..."
            />
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Social Sharing Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Share on social media
          </label>
          <div className="flex space-x-2">
            <Button
              onClick={shareOnTwitter}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              onClick={shareOnFacebook}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}