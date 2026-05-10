"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await authClient.signIn.email({
      email,
      password,
    });

    if (err) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 grid-bg">
      <div className="absolute inset-0 hex-bg opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-neon-blue">MTX</span> SHIELD
          </h1>
          <p className="text-muted font-mono text-sm">Sign in to your command center</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-surface p-8 space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-neon-red/10 border border-neon-red/30 px-4 py-3 text-sm font-mono text-neon-red">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-mono text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50 transition-colors"
              placeholder="admin@server.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-mono text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </Button>

          <p className="text-center text-sm font-mono text-muted">
            Don&apos;t have an account?{" "}
            <a href="/auth/sign-up" className="text-neon-blue hover:underline">
              Deploy
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
