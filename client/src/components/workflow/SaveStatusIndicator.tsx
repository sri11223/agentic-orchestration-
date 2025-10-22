import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
}

export function SaveStatusIndicator({ status, lastSaved }: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Saving...',
          variant: 'secondary' as const,
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'saved':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Saved',
          variant: 'secondary' as const,
          className: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Save failed',
          variant: 'destructive' as const,
          className: 'text-red-600 bg-red-50 border-red-200'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) {
    // Show last saved time when idle
    if (lastSaved) {
      const timeAgo = getTimeAgo(lastSaved);
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last saved {timeAgo}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      <span className="text-xs">{config.text}</span>
    </Badge>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}