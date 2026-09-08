import { Routes, Route, Link } from "react-router-dom";
import AuthGate from "./components/AuthGate.jsx";
import DealerList from "./components/DealerList.jsx";
import DealerLedger from "./components/DealerLedger.jsx";
import { supabase } from "./lib/supabaseClient.js";

export default function App() {
  return (
    <AuthGate>
      {(session) => (
        <div className="min-h-full bg-slate-50 text-slate-900">
          <header className="sticky top-0 z-10 bg-blue-700 text-white shadow">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
              <Link to="/" className="text-lg font-bold tracking-tight">
                Ledger Khata
              </Link>
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden sm:inline text-blue-100">{session.user.email}</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-md border border-blue-300 px-2 py-1 text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-4 pb-24">
            <Routes>
              <Route path="/" element={<DealerList />} />
              <Route path="/dealers/:dealerId" element={<DealerLedger />} />
            </Routes>
          </main>
        </div>
      )}
    </AuthGate>
  );
}
