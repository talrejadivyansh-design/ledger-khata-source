import { useEffect, useState } from "react";
import { api } from "../api.js";

function formatDateTime(iso) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReminderPanel({ dealer, currentBalance, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(dealer.reminder_enabled);
  const [firstDays, setFirstDays] = useState(dealer.first_reminder_days);
  const [resendDays, setResendDays] = useState(dealer.resend_interval_days);
  const [saving, setSaving] = useState(false);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    if (open) api.listReminderCalls(dealer.id).then(setCalls).catch(() => {});
  }, [open, dealer.id]);

  async function handleSaveSettings() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateReminderSettings(dealer.id, {
        reminder_enabled: enabled,
        first_reminder_days: firstDays,
        resend_interval_days: resendDays,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCallNow() {
    setCalling(true);
    setError("");
    setInfo("");
    try {
      await api.callDealerNow(dealer.id);
      setInfo("Call triggered.");
      setCalls(await api.listReminderCalls(dealer.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>📞 Payment reminder calls</span>
        <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Automatic reminder calls enabled for this dealer
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              First call after (days unpaid)
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={firstDays}
                onChange={(e) => setFirstDays(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              Resend every (days, if still unpaid)
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={resendDays}
                onChange={(e) => setResendDays(e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">Last reminder sent: {formatDateTime(dealer.last_reminder_sent_at)}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
          <div className="flex gap-2">
            <button
              disabled={saving}
              onClick={handleSaveSettings}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
            <button
              disabled={calling || currentBalance <= 0}
              onClick={handleCallNow}
              title={currentBalance <= 0 ? "No outstanding balance" : "Call now"}
              className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {calling ? "Calling..." : "Call now"}
            </button>
          </div>

          {calls.length > 0 && (
            <div className="space-y-1 border-t border-slate-100 pt-2">
              <p className="text-xs font-medium text-slate-500">Recent calls</p>
              {calls.map((c) => (
                <div key={c.id} className="flex justify-between text-xs text-slate-500">
                  <span>{formatDateTime(c.called_at)}</span>
                  <span className={c.status === "sent" ? "text-green-600" : "text-red-500"}>
                    {c.status}
                    {c.error ? `: ${c.error}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
