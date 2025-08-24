"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReset = () => {
    reset();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          We're sorry, but an unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" onClick={handleReset}>
            Try again
          </Button>
          <Button onClick={() => router.push('/')}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
