"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReset = () => {
    reset();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Oops!</h1>
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            We're sorry, but an unexpected error occurred. Please try again or return to the homepage.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button onClick={handleReset} variant="outline">
            Try again
          </Button>
          <Button onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
