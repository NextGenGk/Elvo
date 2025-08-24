"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { ErrorBoundary as ErrorBoundaryComponent } from "@/components/error-boundary";

export function ErrorBoundaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorBoundaryComponent}
      onError={(error) => {
        console.error("Error boundary caught an error:", error);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
