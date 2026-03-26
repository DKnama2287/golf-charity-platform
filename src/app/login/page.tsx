"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEFAULT_ADMIN_REDIRECT, DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/constants";

async function readApiResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as {
      message?: string;
      data?: {
        user?: {
          role?: "user" | "admin";
        };
      };
    };
  } catch {
    return {
      message: "Something went wrong. Please try again.",
    };
  }
}

function LoginContent() {
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get("role");
  const [roleRequested, setRoleRequested] = useState<"user" | "admin">(
    roleFromQuery === "admin" ? "admin" : "user",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, roleRequested }),
      });

      const result = await readApiResponse(response);
      setMessage(result.message ?? "Login completed.");

      if (response.ok) {
        const role = result.data?.user?.role ?? "user";
        window.location.href =
          role === "admin" ? DEFAULT_ADMIN_REDIRECT : DEFAULT_LOGIN_REDIRECT;
      }
    } catch {
      setMessage("Unable to login right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08111f,#132238)] px-6 py-12">
      <div className="w-full max-w-md rounded-[34px] border border-white/10 bg-white/95 p-8 text-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Login</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRoleRequested("user")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              roleRequested === "user"
                ? "bg-slate-950 text-white"
                : "text-slate-600"
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setRoleRequested("admin")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              roleRequested === "admin"
                ? "bg-slate-950 text-white"
                : "text-slate-600"
            }`}
          >
            Admin Login
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {roleRequested === "admin"
            ? "Use the admin email and password from your environment setup to access the admin dashboard."
            : "Login as a subscriber to manage scores, charity choices, and monthly draw participation."}
        </p>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder={roleRequested === "admin" ? "Admin email" : "Email"}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <input
            type="password"
            required
            placeholder={roleRequested === "admin" ? "Admin password" : "Password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        <p className="mt-6 text-sm text-slate-600">
          Need a subscriber account?{" "}
          <Link href="/signup" prefetch={false} className="font-semibold text-slate-950">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
