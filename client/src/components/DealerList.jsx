import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function DealerList() {
  const [dealers, setDealers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", opening_debit: "", opening_credit: "" });
  const [saving, setSaving] = useState(false);

  async function load(q = "") {
    setLoading(true);
    setError("");
    try {
      setDealers(await api.listDealers(q));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleAddDealer(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.createDealer(form);
      setForm({ name: "", phone: "", address: "", opening_debit: "", opening_credit: "" });
      setShowForm(false);
      load(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          placeholder="Search dealer by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowForm((s) => !s)}
          className="whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white shadow-sm active:bg-blue-800"
        >
          + Dealer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddDealer} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Dealer name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <p className="text-xs text-slate-500">
            If this dealer already owes/is owed money before you started using the app, enter it here as an
            opening balance.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Opening debit"
              value={form.opening_debit}
              onChange={(e) => setForm({ ...form, opening_debit: e.target.value, opening_credit: "" })}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Opening credit"
              value={form.opening_credit}
              onChange={(e) => setForm({ ...form, opening_credit: e.target.value, opening_debit: "" })}
            />
          </div>
          <button
            disabled={saving}
            className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save dealer"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : dealers.length === 0 ? (
        <p className="text-sm text-slate-500">No dealers yet. Add one to get started.</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {dealers.map((d) => (
            <li key={d.id}>
              <Link to={`/dealers/${d.id}`} className="flex items-center justify-between px-4 py-3 active:bg-slate-50">
                <div>
                  <p className="font-medium">{d.name}</p>
                  {d.phone && <p className="text-xs text-slate-500">{d.phone}</p>}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    (d.current_balance || 0) > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ₹{Math.abs(d.current_balance || 0).toLocaleString("en-IN")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
