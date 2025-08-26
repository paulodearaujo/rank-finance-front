"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AuthHeroSection } from "@/components/auth/auth-hero-section";
import { LoadingSpinner } from "@/components/auth/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Wait for Clerk to be ready
  useEffect(() => {
    if (userLoaded) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100); // Small delay to prevent flash
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [userLoaded]);

  // Handle successful sign-in with smooth transition
  useEffect(() => {
    if (isSignedIn && userLoaded) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSignedIn, userLoaded, router]);

  return (
    <div
      className={cn(
        "relative flex min-h-screen transition-opacity duration-300",
        isTransitioning && "opacity-0",
      )}
    >
      {/* Left side - Hero section */}
      <AuthHeroSection />

      {/* Right side - Auth form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {isInitialLoad ? (
            <AuthFormSkeleton />
          ) : (
            <SignIn.Root>
              <Clerk.Loading>
                {(isGlobalLoading) => (
                  <div
                    className={cn(
                      "space-y-8 transition-all duration-500",
                      isGlobalLoading ? "opacity-50 pointer-events-none" : "opacity-100",
                    )}
                  >
                    <SignIn.Step name="start">
                      <div className="space-y-8 animate-fade-in">
                        {/* Title and subtitle - inside the step */}
                        <div className="text-center lg:text-left">
                          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Enter your email to sign in to your account
                          </p>
                        </div>

                        {/* Global form errors */}
                        <Clerk.GlobalError className="text-sm text-destructive" />

                        <div className="space-y-6">
                          {/* OAuth buttons */}
                          <div className="space-y-3">
                            <Clerk.Connection name="google" asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 w-full font-normal"
                                disabled={isGlobalLoading}
                              >
                                <Clerk.Loading scope="provider:google">
                                  {(isLoading) =>
                                    isLoading ? (
                                      <LoadingSpinner />
                                    ) : (
                                      <>
                                        <svg
                                          className="mr-2 h-5 w-5"
                                          viewBox="0 0 48 48"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
                                            fill="#4285F4"
                                          />
                                          <path
                                            d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
                                            fill="#34A853"
                                          />
                                          <path
                                            d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
                                            fill="#FBBC04"
                                          />
                                          <path
                                            d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
                                            fill="#EA4335"
                                          />
                                        </svg>
                                        Continue with Google
                                      </>
                                    )
                                  }
                                </Clerk.Loading>
                              </Button>
                            </Clerk.Connection>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                              </span>
                            </div>
                          </div>

                          {/* Email input */}
                          <Clerk.Field name="identifier" className="space-y-2">
                            <Clerk.Label asChild>
                              <Label className="text-sm font-medium">Email</Label>
                            </Clerk.Label>
                            <Clerk.Input type="email" required asChild>
                              <Input className="h-11" autoFocus placeholder="name@example.com" />
                            </Clerk.Input>
                            <Clerk.FieldError className="text-xs text-destructive" />
                          </Clerk.Field>

                          <SignIn.Action submit asChild>
                            <Button className="h-11 w-full" disabled={isGlobalLoading}>
                              <Clerk.Loading>
                                {(isLoading) => (isLoading ? <LoadingSpinner /> : "Continue")}
                              </Clerk.Loading>
                            </Button>
                          </SignIn.Action>

                          <p className="text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link
                              href="/sign-up"
                              className="font-medium text-primary hover:underline"
                            >
                              Sign up
                            </Link>
                          </p>
                        </div>
                      </div>
                    </SignIn.Step>

                    <SignIn.Step name="verifications">
                      <div className="space-y-8 animate-fade-in">
                        <SignIn.Strategy name="password">
                          <div className="space-y-8">
                            {/* Back navigation */}
                            <SignIn.Action navigate="start" asChild>
                              <button
                                type="button"
                                className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <IconArrowLeft className="mr-2 h-4 w-4" />
                                Back to sign in
                              </button>
                            </SignIn.Action>

                            {/* Title for password step */}
                            <div className="text-center lg:text-left">
                              <h2 className="text-3xl font-bold tracking-tight">
                                Enter your password
                              </h2>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Sign in to <SignIn.SafeIdentifier />
                              </p>
                            </div>

                            <div className="space-y-6">
                              <Clerk.Field name="password" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">Password</Label>
                                </Clerk.Label>
                                <Clerk.Input type="password" asChild>
                                  <Input
                                    className="h-11"
                                    autoFocus
                                    placeholder="Enter your password"
                                  />
                                </Clerk.Input>
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>

                              <div className="space-y-3">
                                <SignIn.Action submit asChild>
                                  <Button className="h-11 w-full" disabled={isGlobalLoading}>
                                    <Clerk.Loading>
                                      {(isLoading) => (isLoading ? <LoadingSpinner /> : "Sign in")}
                                    </Clerk.Loading>
                                  </Button>
                                </SignIn.Action>

                                <SignIn.Action navigate="choose-strategy" asChild>
                                  <Button variant="ghost" className="h-11 w-full">
                                    Use another method
                                  </Button>
                                </SignIn.Action>
                              </div>
                            </div>
                          </div>
                        </SignIn.Strategy>

                        <SignIn.Strategy name="email_code">
                          <div className="space-y-8">
                            {/* Back navigation */}
                            <SignIn.Action navigate="start" asChild>
                              <button
                                type="button"
                                className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <IconArrowLeft className="mr-2 h-4 w-4" />
                                Back to sign in
                              </button>
                            </SignIn.Action>

                            {/* Title for verification */}
                            <div className="text-center lg:text-left">
                              <h2 className="text-3xl font-bold tracking-tight">
                                Check your email
                              </h2>
                              <p className="mt-2 text-sm text-muted-foreground">
                                We sent a verification code to <SignIn.SafeIdentifier />
                              </p>
                            </div>

                            <div className="space-y-6">
                              <Clerk.Field name="code" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">Verification code</Label>
                                </Clerk.Label>
                                <Clerk.Input
                                  type="otp"
                                  autoSubmit
                                  className="flex justify-center gap-2"
                                  render={({ value, status }) => (
                                    <div
                                      data-status={status}
                                      className={cn(
                                        "relative flex h-14 w-14 items-center justify-center rounded-lg border border-input text-lg font-medium transition-all",
                                        status === "cursor" &&
                                          "ring-2 ring-ring ring-offset-2 ring-offset-background",
                                        status === "selected" &&
                                          "ring-1 ring-ring ring-offset-1 ring-offset-background",
                                      )}
                                    >
                                      {value}
                                    </div>
                                  )}
                                />
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>

                              <div className="space-y-3">
                                <SignIn.Action submit asChild>
                                  <Button className="h-11 w-full" disabled={isGlobalLoading}>
                                    <Clerk.Loading>
                                      {(isLoading) => (isLoading ? <LoadingSpinner /> : "Continue")}
                                    </Clerk.Loading>
                                  </Button>
                                </SignIn.Action>

                                <SignIn.Action resend asChild>
                                  <button
                                    type="button"
                                    className="text-sm text-muted-foreground transition-all hover:underline disabled:opacity-50 disabled:pointer-events-none flex justify-center w-full"
                                    disabled={isGlobalLoading}
                                  >
                                    Resend code
                                  </button>
                                </SignIn.Action>
                              </div>
                            </div>
                          </div>
                        </SignIn.Strategy>
                      </div>
                    </SignIn.Step>
                  </div>
                )}
              </Clerk.Loading>
            </SignIn.Root>
          )}
        </div>
      </div>
    </div>
  );
}
