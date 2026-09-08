import { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function AddEntryForm({ onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ entry_date: today(), bill_no: "", debit: "", credit: "", note: "" });

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.entry_date}
            onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
            required
          />
        </label>
        <label className="text-xs text-slate-500">
          Bill No.
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.bill_no}
            onChange={(e) => setForm({ ...form, bill_no: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-500">
          Debit
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.debit}
            onChange={(e) => setForm({ ...form, debit: e.target.value, credit: "" })}
          />
        </label>
        <label className="text-xs text-slate-500">
          Credit
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.credit}
            onChange={(e) => setForm({ ...form, credit: e.target.value, debit: "" })}
          />
        </label>
      </div>
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="Note (optional)"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
      />
      <div className="flex gap-2">
        <button
          disabled={saving}
          className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
