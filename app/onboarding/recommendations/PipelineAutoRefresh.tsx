'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_POLL_ATTEMPTS = 60;

export function PipelineAutoRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const statusText = useMemo(() => {
    const elapsedSeconds = pollCount * 3;
    if (elapsedSeconds >= 60) {
      // TODO: replace with real support email if different
      return 'This is taking longer than expected. Try refreshing, or email us at hello@twentyfour.com.';
    }
    if (elapsedSeconds >= 45) {
      return 'Almost there...';
    }
    if (elapsedSeconds >= 30) {
      return 'Personalizing your plan...';
    }
    if (elapsedSeconds >= 20) {
      return 'Building your recommendations...';
    }
    if (elapsedSeconds >= 10) {
      return 'Running strategic analysis...';
    }
    return 'Analyzing your business...';
  }, [pollCount]);

  useEffect(() => {
    if (!enabled) return;
    setPollCount(0);
    setError(null);
    const timer = window.setInterval(() => {
      setPollCount((prev) => {
        if (prev >= MAX_POLL_ATTEMPTS) {
          window.clearInterval(timer);
          // TODO: replace with real support email if different
          setError('Your plan is taking longer than expected. Please refresh the page or email hello@twentyfour.com.');
          return prev;
        }
        return prev + 1;
      });
      router.refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [enabled, router]);

  return (
    <p className="text-muted-foreground">
      {error || statusText}
    </p>
  );
}
