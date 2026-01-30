"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/layout/logo";

export default function OAuthCallbackPage() {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("No authentication token received.");
        return;
      }

      try {
        // Store token securely (e.g., localStorage for demo purposes)
        localStorage.setItem("auth_token", token);
        
        setStatus("success");
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(`/${lang}/dashboard`);
        }, 2000);
      } catch (error) {
        console.error("Callback error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    };

    handleCallback();
  }, [searchParams, lang, router]);

  return (
    <div className="grid place-content-center min-h-screen">
      <div className="bg-background/40 backdrop-blur-3xl border border-background/30 rounded-xl p-10 flex flex-col items-center gap-6 max-w-md text-center">
        <Logo />
        
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
              <p className="text-sm text-gray-600">Please wait while we complete your login.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full grid place-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-green-600">Login Successful!</h2>
              <p className="text-sm text-gray-600">You are now authenticated. Redirecting to dashboard...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full grid place-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-red-600">Authentication Failed</h2>
              <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
              <button 
                onClick={() => router.push(`/${lang}/login`)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
