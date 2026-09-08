import { useRef, useState } from "react";
import { api } from "../api.js";
import { scanLedgerImage } from "../lib/ocr.js";

export default function OcrScan({ dealerId, onImported, onCancel }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRows(null);
    setError("");
    setScanning(true);
    try {
      const result = await scanLedgerImage(file);
      if (result.rows.length === 0) {
        setError(
          "Couldn't confidently find any rows in this photo. Try a clearer, brighter, straight-on shot, or add entries manually."
        );
      }
      setRows(result.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  function updateRow(idx, field, value) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx) {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await api.bulkCreateEntries(
        dealerId,
        rows.map((r) => ({
          entry_date: r.entry_date,
          bill_no: r.bill_no,
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
        }))
      );
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium">Scan a ledger photo</p>
      <p className="text-xs text-slate-500">
        Upload a clear photo of a ledger page. We'll try to read the rows automatically — review and fix
        anything before saving, since handwriting recognition isn't perfect.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="block w-full text-sm"
      />
      {preview && <img src={preview} alt="Ledger preview" className="max-h-48 rounded-md border" />}
      {scanning && <p className="text-sm text-slate-500">Reading photo... this can take a moment.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows && rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Review extracted rows</p>
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-1 items-center">
                <input
                  type="date"
                  value={r.entry_date}
                  onChange={(e) => updateRow(idx, "entry_date", e.target.value)}
                  className="col-span-2 rounded border border-slate-300 px-1 py-1 text-xs"
                />
                <input
                  value={r.bill_no || ""}
                  onChange={(e) => updateRow(idx, "bill_no", e.target.value)}
                  placeholder="Bill#"
                  className="rounded border border-slate-300 px-1 py-1 text-xs"
                />
                <input
                  type="number"
                  value={r.debit || ""}
                  onChange={(e) => updateRow(idx, "debit", e.target.value)}
                  placeholder="Debit"
                  className="rounded border border-slate-300 px-1 py-1 text-xs"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={r.credit || ""}
                    onChange={(e) => updateRow(idx, "credit", e.target.value)}
                    placeholder="Credit"
                    className="w-full rounded border border-slate-300 px-1 py-1 text-xs"
                  />
                  <button onClick={() => removeRow(idx)} className="text-red-500 text-xs px-1">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            disabled={saving}
            onClick={handleSave}
            className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : `Save ${rows.length} entries`}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
      >
        Close
      </button>
    </div>
  );
}
