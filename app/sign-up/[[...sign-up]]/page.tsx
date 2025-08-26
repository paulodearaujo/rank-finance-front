"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthFormSkeletonSignUp } from "@/components/auth/auth-form-skeleton";
import { AuthHeroSection } from "@/components/auth/auth-hero-section";
import { LoadingSpinner } from "@/components/auth/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Immediate load to prevent preload warnings
    setIsLoading(false);
  }, []);

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - Hero section (no skeleton needed) */}
      <AuthHeroSection />

      {/* Right side - Auth form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Skeleton */}
          {isLoading ? (
            <AuthFormSkeletonSignUp />
          ) : (
            <div className="animate-fade-in">
              <SignUp.Root>
                <Clerk.Loading>
                  {(isGlobalLoading) => (
                    <>
                      <SignUp.Step name="start">
                        <div className="space-y-8">
                          {/* Title for sign up step */}
                          <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight">
                              Create your account
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Start to analyze the competition
                            </p>
                          </div>

                          <div className="space-y-6">
                            {/* Global form errors */}
                            <Clerk.GlobalError className="text-sm text-destructive" />

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
                                            className="mr-3 h-5 w-5"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                          >
                                            <title>Google</title>
                                            <path
                                              fill="#4285F4"
                                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                              fill="#34A853"
                                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                              fill="#FBBC05"
                                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                              fill="#EA4335"
                                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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
                                <span className="bg-background px-2 text-muted-foreground">or</span>
                              </div>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4">
                              <Clerk.Field name="emailAddress" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">Email</Label>
                                </Clerk.Label>
                                <Clerk.Input type="email" asChild>
                                  <Input
                                    className="h-11"
                                    placeholder="name@company.com"
                                    autoFocus
                                  />
                                </Clerk.Input>
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>

                              <Clerk.Field name="password" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">Password</Label>
                                </Clerk.Label>
                                <Clerk.Input type="password" asChild>
                                  <Input className="h-11" placeholder="Create a strong password" />
                                </Clerk.Input>
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>

                              <SignUp.Action submit asChild>
                                <Button className="h-11 w-full" disabled={isGlobalLoading}>
                                  <Clerk.Loading>
                                    {(isLoading) => (isLoading ? <LoadingSpinner /> : "Continue")}
                                  </Clerk.Loading>
                                </Button>
                              </SignUp.Action>
                            </div>

                            <p className="text-center text-sm text-muted-foreground">
                              Already have an account?{" "}
                              <Link
                                href="/sign-in"
                                className="font-medium text-primary hover:underline"
                              >
                                Sign in
                              </Link>
                            </p>
                          </div>
                        </div>
                      </SignUp.Step>

                      <SignUp.Step name="verifications">
                        <SignUp.Strategy name="email_code">
                          <div className="space-y-8">
                            {/* Back navigation */}
                            <SignUp.Action navigate="start" asChild>
                              <button
                                type="button"
                                className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <IconArrowLeft className="mr-2 h-4 w-4" />
                                Back to sign up
                              </button>
                            </SignUp.Action>

                            {/* Title for verification step */}
                            <div className="text-center lg:text-left">
                              <h2 className="text-3xl font-bold tracking-tight">
                                Verify your email
                              </h2>
                              <p className="mt-2 text-sm text-muted-foreground">
                                We sent a verification code to your email
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
                                        status === "selected" && "border-ring",
                                      )}
                                    >
                                      {value}
                                    </div>
                                  )}
                                />
                                <Clerk.FieldError className="text-center text-xs text-destructive" />
                              </Clerk.Field>

                              <div className="space-y-3">
                                <SignUp.Action submit asChild>
                                  <Button className="h-11 w-full" disabled={isGlobalLoading}>
                                    <Clerk.Loading>
                                      {(isLoading) =>
                                        isLoading ? <LoadingSpinner /> : "Verify email"
                                      }
                                    </Clerk.Loading>
                                  </Button>
                                </SignUp.Action>

                                <SignUp.Action
                                  resend
                                  asChild
                                  fallback={({ resendableAfter }: { resendableAfter: string }) => (
                                    <button
                                      type="button"
                                      disabled
                                      className="text-sm text-muted-foreground opacity-50 cursor-not-allowed flex justify-center w-full"
                                    >
                                      Resend code in {resendableAfter}
                                    </button>
                                  )}
                                >
                                  <button
                                    type="button"
                                    className="text-sm text-muted-foreground transition-all hover:underline flex justify-center w-full"
                                  >
                                    Resend code
                                  </button>
                                </SignUp.Action>
                              </div>
                            </div>
                          </div>
                        </SignUp.Strategy>
                      </SignUp.Step>

                      <SignUp.Step name="continue">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold">Complete your profile</h3>
                            <p className="text-sm text-muted-foreground">
                              Help us personalize your experience
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Clerk.Field name="firstName" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">First name</Label>
                                </Clerk.Label>
                                <Clerk.Input asChild>
                                  <Input className="h-11" placeholder="John" />
                                </Clerk.Input>
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>

                              <Clerk.Field name="lastName" className="space-y-2">
                                <Clerk.Label asChild>
                                  <Label className="text-sm font-medium">Last name</Label>
                                </Clerk.Label>
                                <Clerk.Input asChild>
                                  <Input className="h-11" placeholder="Doe" />
                                </Clerk.Input>
                                <Clerk.FieldError className="text-xs text-destructive" />
                              </Clerk.Field>
                            </div>

                            <SignUp.Action submit asChild>
                              <Button className="h-11 w-full" disabled={isGlobalLoading}>
                                <Clerk.Loading>
                                  {(isLoading) =>
                                    isLoading ? <LoadingSpinner /> : "Complete sign up"
                                  }
                                </Clerk.Loading>
                              </Button>
                            </SignUp.Action>
                          </div>
                        </div>
                      </SignUp.Step>
                    </>
                  )}
                </Clerk.Loading>
              </SignUp.Root>
            </div>
          )}
        </div>
      </div>

      {/* Mobile logo */}
      <div className="absolute left-8 top-8 lg:hidden">
        <h1 className="text-2xl font-semibold">Rank Tracker</h1>
      </div>
    </div>
  );
}
