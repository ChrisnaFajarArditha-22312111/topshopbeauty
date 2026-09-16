"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "@/features/auth/useAuth";

// Konstanta di luar komponen agar stabil — mencegah GoogleOAuthProvider initialize ulang tiap render
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1077875078939-3qqosa27636vubfers398fcj7825frli.apps.googleusercontent.com";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: "1rem",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
