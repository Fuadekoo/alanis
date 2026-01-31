"use client";

import { authenticate } from "@/actions/common/auth";
import Logo from "@/components/layout/logo";
import { Button, Form, Input } from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { loginSchema } from "@/lib/zodSchema";
import { Eye, EyeOff, KeyRound, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

export default function OAuthLoginPage() {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackurl");
  
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthCallback = useCallback(async () => {
    if (isRedirecting) return; // Prevent multiple calls
    
    if (!callbackUrl) {
      // No callback URL provided, redirect to dashboard
      router.push(`/${lang}/dashboard`);
      return;
    }

    // Validate callback URL
    try {
      new URL(callbackUrl);
    } catch {
      setError("Invalid callback URL");
      setIsChecking(false);
      return;
    }

    setIsRedirecting(true);

    try {
      // 1. Generate Auth Code
      const codeResponse = await fetch("/api/oauth/generate-code", {
        method: "POST",
        credentials: "include",
      });

      if (!codeResponse.ok) {
        const errorData = await codeResponse.json().catch(() => ({}));
        throw new Error(errorData.error_description || "Failed to generate code");
      }

      const codeData = await codeResponse.json();
      const { code } = codeData;

      if (!code) {
        throw new Error("Invalid response from server (no code)");
      }

      // 2. Get User ID
      const userResponse = await fetch("/api/oauth/loginuserId", {
        method: "GET",
        credentials: "include",
      });

      if (!userResponse.ok) {
        // If we can't get the user ID using the dedicated endpoint, we might still proceed with just the code
        // or fail. Given user instructions, we should try to get it.
        console.error("Failed to fetch user ID");
        // We can either throw or continue. Let's throw for now as user explicitly requested adding userId.
        throw new Error("Failed to fetch user ID details"); 
      }

      const userData = await userResponse.json();
      const { userId } = userData;

      // Build callback URL with the code and userId
      const callback = new URL(callbackUrl);
      callback.searchParams.set("code", code);
      if (userId) {
        callback.searchParams.set("userId", userId);
      }
      
      // Remove token if it was somehow present
      callback.searchParams.delete("token");

      window.location.href = callback.toString();
    } catch (error) {
      console.error("OAuth callback error:", error);
      setError(error instanceof Error ? error.message : "Failed to process OAuth. Please try again.");
      setIsRedirecting(false);
      setIsChecking(false);
    }
  }, [callbackUrl, lang, router, isRedirecting]);

  const { onSubmit, validationErrors, register, isLoading } =
    useRegistration(authenticate, loginSchema, async (state) => {
      if (state.status) {
        // After successful login, generate token and redirect
        await handleOAuthCallback();
      }
    });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/oauth/check-auth", {
          credentials: "include", // Include cookies for authentication
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setIsChecking(false);
            // User is already logged in, generate code and redirect
            // Small delay to ensure state is set
            setTimeout(() => {
              handleOAuthCallback();
            }, 100);
          } else {
            setIsAuthenticated(false);
            setIsChecking(false);
          }
        } else {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isChecking || isRedirecting) {
    return (
      <div className="grid place-content-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {isRedirecting 
              ? (lang == "am" ? "ወደ ሌላ ስርዓት በመመለስ ላይ..." : lang == "or" ? "Sagantaa biraa deebi'aa..." : "Redirecting to external system...")
              : (lang == "am" ? "በመጫን ላይ..." : lang == "or" ? "Hordofaa..." : "Loading...")
            }
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && !error) {
    return (
      <div className="grid place-content-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {lang == "am" ? "ወደ ሌላ ስርዓት በመመለስ ላይ..." : lang == "or" ? "Sagantaa biraa deebi'aa..." : "Redirecting to external system..."}
          </p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  return (
    <div className="grid place-content-center min-h-screen">
      <Form
        onSubmit={onSubmit}
        validationErrors={validationErrors}
        className="bg-background/40 backdrop-blur-3xl border border-background/30 rounded-xl overflow-hidden grid md:grid-cols-2"
      >
        <div className="p-5 md:p-10 flex gap-5 flex-col bg-background/50">
          <div className="flex justify-center">
            <Logo />
          </div>
          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}
          {callbackUrl && !error && (
            <div className="text-center text-sm text-gray-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              {lang == "am" 
                ? "ወደ ሌላ ስርዓት ለመግባት እባክዎ ይግቡ" 
                : lang == "or" 
                ? "Sagantaa biraa seenuuf galchi" 
                : "Please login to access external system"}
            </div>
          )}
          {!callbackUrl && (
            <div className="text-center text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              {lang == "am" 
                ? "ምንም callback URL አልተሰጠም" 
                : lang == "or" 
                ? "Callback URL hin dhiyaatamne" 
                : "No callback URL provided"}
            </div>
          )}
          <div className="flex-1 flex flex-col gap-5 justify-center">
            <Input
              variant="faded"
              color="primary"
              placeholder={lang == "am" ? "መለያ ስም" : lang == "or" ? "Maqaa fayyadamaa" : "Username"}
              className="w-60"
              startContent={<User className="size-6" />}
              {...register("username")}
            />
            <Input
              variant="faded"
              color="primary"
              placeholder={lang == "am" ? "ሚስጥር ቁልፍ" : lang == "or" ? "Jecha icciitii" : "Password"}
              className="w-60"
              startContent={<KeyRound className="size-6" />}
              type={hidden ? "password" : "text"}
              endContent={
                <span onClick={() => setHidden((prev) => !prev)}>
                  {hidden ? (
                    <Eye className="size-6" />
                  ) : (
                    <EyeOff className="size-6" />
                  )}
                </span>
              }
              {...register("password")}
            />
            <Button type="submit" color="primary" isLoading={isLoading}>
              {lang == "am" ? "ይግቡ" : lang == "or" ? "Seenaa" : "Login"}
            </Button>
          </div>
        </div>
        <div className="max-md:hidden size-full grid place-content-center">
          <Link href={"/"}>
            <Image
              alt=""
              src={"/al-anis.png"}
              width={1000}
              height={1000}
              className="size-40"
            />
          </Link>
        </div>
      </Form>
    </div>
  );
}

