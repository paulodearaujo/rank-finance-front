import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Welcome to Your App
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            A modern Next.js application with shadcn/ui components
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Your new project is ready with all shadcn/ui components installed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All UI components are available in the{" "}
              <code className="px-1 py-0.5 bg-muted rounded">components/ui</code> directory.
            </p>
            <div className="flex gap-2">
              <Button>Primary Action</Button>
              <Button variant="outline">Secondary</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
