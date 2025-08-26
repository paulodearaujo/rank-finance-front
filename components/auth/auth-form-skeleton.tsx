export function AuthFormSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title section - matching exact heights */}
      <div className="text-center lg:text-left">
        <div className="h-9 w-48 mx-auto lg:mx-0 rounded bg-auth-skeleton-primary animate-pulse" />
        <div className="mt-2 h-5 w-72 mx-auto lg:mx-0 rounded bg-auth-skeleton-secondary animate-pulse" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        {/* Google button */}
        <div className="h-11 w-full rounded-md bg-auth-skeleton-secondary animate-pulse" />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-transparent">or</span>
          </div>
        </div>

        {/* Email field and button for sign-in, or Email/Password fields for sign-up */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-12 rounded bg-auth-skeleton-primary animate-pulse" />
            <div className="h-11 w-full rounded-md bg-auth-skeleton-secondary animate-pulse" />
          </div>
          <div className="h-11 w-full rounded-md bg-primary animate-pulse opacity-80" />
        </div>

        {/* Link */}
        <div className="h-4 w-48 mx-auto rounded bg-auth-skeleton-tertiary animate-pulse" />
      </div>
    </div>
  );
}

export function AuthFormSkeletonSignUp() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title section - matching exact heights */}
      <div className="text-center lg:text-left">
        <div className="h-9 w-48 mx-auto lg:mx-0 rounded bg-auth-skeleton-primary animate-pulse" />
        <div className="mt-2 h-5 w-72 mx-auto lg:mx-0 rounded bg-auth-skeleton-secondary animate-pulse" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        {/* Google button */}
        <div className="h-11 w-full rounded-md bg-auth-skeleton-secondary animate-pulse" />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-transparent">or</span>
          </div>
        </div>

        {/* Email and Password fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-12 rounded bg-auth-skeleton-primary animate-pulse" />
            <div className="h-11 w-full rounded-md bg-auth-skeleton-secondary animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-16 rounded bg-auth-skeleton-primary animate-pulse" />
            <div className="h-11 w-full rounded-md bg-auth-skeleton-secondary animate-pulse" />
          </div>
          {/* Submit button */}
          <div className="h-11 w-full rounded-md bg-primary animate-pulse opacity-80" />
        </div>

        {/* Sign in link */}
        <div className="h-4 w-48 mx-auto rounded bg-auth-skeleton-tertiary animate-pulse" />

        {/* Terms text */}
        <div className="h-3 w-full rounded bg-auth-skeleton-tertiary animate-pulse" />
      </div>
    </div>
  );
}
