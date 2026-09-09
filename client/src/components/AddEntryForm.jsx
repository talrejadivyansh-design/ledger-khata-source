import { useEffect, useState } from "react";
import { api } from "../api.js";
import { focusNextFieldOnEnter } from "../lib/formKeyboard.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function AddEntryForm({ initialEntry, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(
    initialEntry
      ? {
          entry_date: initialEntry.entry_date,
          bill_no: initialEntry.bill_no || "",
          company_id: initialEntry.company_id || "",
          debit: initialEntry.debit || "",
          credit: initialEntry.credit || "",
          note: initialEntry.note || "",
        }
      : { entry_date: today(), bill_no: "", company_id: "", debit: "", credit: "", note: "" }
  );
  const [companies, setCompanies] = useState([]);
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    api.listCompanies().then(setCompanies).catch(() => {});
  }, []);

  async function handleAddCompany() {
    if (!newCompanyName.trim()) return;
    setCompanyError("");
    try {
      const company = await api.createCompany(newCompanyName);
      setCompanies((cs) => [...cs, company].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, company_id: company.id }));
      setNewCompanyName("");
      setAddingCompany(false);
    } catch (err) {
      setCompanyError(err.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  function handleFormKeyDown(e) {
    if (e.key !== "Enter") return;
    if (e.target.name === "newCompanyName") {
      e.preventDefault();
      handleAddCompany();
      return;
    }
    focusNextFieldOnEnter(e);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
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
        <label className="col-span-2 text-xs text-slate-500">
          Company
          {addingCompany ? (
            <div className="mt-1 flex gap-1">
              <input
                autoFocus
                name="newCompanyName"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="New company name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCompany}
                className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingCompany(false);
                  setNewCompanyName("");
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.company_id}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingCompany(true);
                } else {
                  setForm({ ...form, company_id: e.target.value });
                }
              }}
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">+ Add new company...</option>
            </select>
          )}
          {companyError && <p className="mt-1 text-xs text-red-600">{companyError}</p>}
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
          {saving ? "Saving..." : initialEntry ? "Save changes" : "Add entry"}
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
