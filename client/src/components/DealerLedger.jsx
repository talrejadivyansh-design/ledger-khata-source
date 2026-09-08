import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import AddEntryForm from "./AddEntryForm.jsx";
import OcrScan from "./OcrScan.jsx";
import ReminderPanel from "./ReminderPanel.jsx";

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export default function DealerLedger() {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null | "form" | "scan"
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingDealer, setEditingDealer] = useState(false);
  const [dealerForm, setDealerForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [d, e] = await Promise.all([api.getDealer(dealerId), api.listEntries(dealerId)]);
      setDealer(d);
      setEntries(e);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [dealerId]);

  async function handleAddEntry(form) {
    setSaving(true);
    setError("");
    try {
      await api.createEntry(dealerId, form);
      setMode(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(form) {
    setSaving(true);
    setError("");
    try {
      await api.updateEntry(dealerId, editingEntry.id, form);
      setEditingEntry(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!confirm("Delete this entry?")) return;
    try {
      await api.deleteEntry(dealerId, entryId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditDealer() {
    setDealerForm({ name: dealer.name, phone: dealer.phone || "", address: dealer.address || "" });
    setEditingDealer(true);
  }

  async function handleSaveDealer(e) {
    e.preventDefault();
    if (!dealerForm.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateDealer(dealerId, dealerForm);
      setDealer(updated);
      setEditingDealer(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDealer() {
    if (!confirm(`Delete ${dealer.name} and all their entries?`)) return;
    try {
      await api.deleteDealer(dealerId);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  const currentBalance = entries.length ? entries[entries.length - 1].balance : 0;

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!dealer) return <p className="text-sm text-red-600">Dealer not found.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        {editingDealer ? (
          <form onSubmit={handleSaveDealer} className="space-y-2">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Dealer name *"
              value={dealerForm.name}
              onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })}
              required
              autoFocus
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Phone"
              value={dealerForm.phone}
              onChange={(e) => setDealerForm({ ...dealerForm, phone: e.target.value })}
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Address"
              value={dealerForm.address}
              onChange={(e) => setDealerForm({ ...dealerForm, address: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                disabled={saving}
                className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditingDealer(false)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold">{dealer.name}</h1>
                {dealer.phone && <p className="text-xs text-slate-500">{dealer.phone}</p>}
                {dealer.address && <p className="text-xs text-slate-500">{dealer.address}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                <button onClick={startEditDealer} className="text-blue-600">
                  Edit dealer
                </button>
                <button onClick={handleDeleteDealer} className="text-red-500">
                  Delete dealer
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm">
              Closing balance:{" "}
              <span className={`font-semibold ${currentBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{Math.abs(currentBalance).toLocaleString("en-IN")}{" "}
                {currentBalance > 0 ? "(owed)" : currentBalance < 0 ? "(advance)" : ""}
              </span>
            </p>
          </>
        )}
      </div>

      <ReminderPanel dealer={dealer} currentBalance={currentBalance} onUpdated={setDealer} />

      <div className="flex gap-2">
        <button
          onClick={() => {
            setEditingEntry(null);
            setMode(mode === "form" ? null : "form");
          }}
          className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white"
        >
          + Add entry
        </button>
        <button
          onClick={() => setMode(mode === "scan" ? null : "scan")}
          className="flex-1 rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-700"
        >
          📷 Scan photo
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {mode === "form" && !editingEntry && (
        <AddEntryForm onSubmit={handleAddEntry} onCancel={() => setMode(null)} saving={saving} />
      )}
      {editingEntry && (
        <AddEntryForm
          initialEntry={editingEntry}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditingEntry(null)}
          saving={saving}
        />
      )}
      {mode === "scan" && (
        <OcrScan
          dealerId={dealerId}
          onImported={() => {
            setMode(null);
            load();
          }}
          onCancel={() => setMode(null)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Bill No.</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  No entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.entry_date)}</td>
                  <td className="px-3 py-2">{e.bill_no || "-"}</td>
                  <td className="px-3 py-2">{e.company?.name || "-"}</td>
                  <td className="px-3 py-2 text-right">{e.debit ? e.debit.toLocaleString("en-IN") : "-"}</td>
                  <td className="px-3 py-2 text-right">{e.credit ? e.credit.toLocaleString("en-IN") : "-"}</td>
                  <td className="px-3 py-2 text-right font-medium">{e.balance.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setMode(null);
                        setEditingEntry(e);
                      }}
                      className="mr-2 text-xs text-blue-600"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteEntry(e.id)} className="text-xs text-red-500">
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
