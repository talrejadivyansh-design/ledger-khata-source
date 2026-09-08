import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Account created. If email confirmation is required, check your inbox, then sign in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (session === undefined) {
    return <p className="p-4 text-sm text-slate-500">Loading...</p>;
  }

  if (!session) {
    return (
      <div className="mx-auto mt-10 max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">Ledger Khata</h1>
          <p className="text-sm text-slate-500">Sign in to access your ledger.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
          <button
            disabled={busy}
            className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setInfo("");
          }}
          className="w-full text-center text-xs text-blue-700"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    );
  }

  return children(session);
}
