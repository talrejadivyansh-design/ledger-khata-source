import { supabase } from "./lib/supabaseClient.js";

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export const api = {
  listDealers: async (search = "") => {
    let query = supabase.from("dealer_summary").select("*").order("name");
    if (search) query = query.ilike("name", `%${search}%`);
    return unwrap(await query);
  },

  getDealer: async (id) => unwrap(await supabase.from("dealers").select("*").eq("id", id).single()),

  createDealer: async ({ name, phone, address, opening_debit, opening_credit }) => {
    const { data, error } = await supabase
      .from("dealers")
      .insert({ name: name.trim(), phone: phone?.trim() || null, address: address?.trim() || null })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error(`A dealer named "${name.trim()}" is already in your list.`);
      throw new Error(error.message);
    }
    const dealer = data;

    const openingDebit = Number(opening_debit) || 0;
    const openingCredit = Number(opening_credit) || 0;
    if (openingDebit > 0 || openingCredit > 0) {
      await api.createEntry(dealer.id, {
        entry_date: new Date().toISOString().slice(0, 10),
        bill_no: null,
        debit: openingDebit,
        credit: openingCredit,
        note: "Opening balance",
      });
    }

    return dealer;
  },

  updateDealer: async (id, { name, phone, address }) => {
    const { data, error } = await supabase
      .from("dealers")
      .update({ name: name.trim(), phone: phone?.trim() || null, address: address?.trim() || null })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error(`A dealer named "${name.trim()}" is already in your list.`);
      throw new Error(error.message);
    }
    return data;
  },

  updateReminderSettings: async (id, { reminder_enabled, first_reminder_days, resend_interval_days }) =>
    unwrap(
      await supabase
        .from("dealers")
        .update({
          reminder_enabled,
          first_reminder_days: Number(first_reminder_days) || 7,
          resend_interval_days: Number(resend_interval_days) || 2,
        })
        .eq("id", id)
        .select()
        .single()
    ),

  deleteDealer: async (id) => {
    const { error } = await supabase.from("dealers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  listEntries: async (dealerId) =>
    unwrap(
      await supabase
        .from("entries")
        .select("*, company:companies(id, name)")
        .eq("dealer_id", dealerId)
        .order("entry_date")
        .order("id")
    ),

  createEntry: async (dealerId, { entry_date, bill_no, company_id, debit, credit, note }) =>
    unwrap(
      await supabase
        .from("entries")
        .insert({
          dealer_id: dealerId,
          entry_date,
          bill_no: bill_no?.trim() || null,
          company_id: company_id || null,
          debit: Number(debit) || 0,
          credit: Number(credit) || 0,
          note: note?.trim() || null,
        })
        .select()
        .single()
    ),

  updateEntry: async (dealerId, entryId, { entry_date, bill_no, company_id, debit, credit, note }) =>
    unwrap(
      await supabase
        .from("entries")
        .update({
          entry_date,
          bill_no: bill_no?.trim() || null,
          company_id: company_id || null,
          debit: Number(debit) || 0,
          credit: Number(credit) || 0,
          note: note?.trim() || null,
        })
        .eq("id", entryId)
        .eq("dealer_id", dealerId)
        .select()
        .single()
    ),

  deleteEntry: async (dealerId, entryId) => {
    const { error } = await supabase.from("entries").delete().eq("id", entryId).eq("dealer_id", dealerId);
    if (error) throw new Error(error.message);
  },

  bulkCreateEntries: async (dealerId, entries) =>
    unwrap(
      await supabase
        .from("entries")
        .insert(
          entries
            .filter((e) => e.entry_date)
            .map((e) => ({
              dealer_id: dealerId,
              entry_date: e.entry_date,
              bill_no: e.bill_no?.trim() || null,
              debit: Number(e.debit) || 0,
              credit: Number(e.credit) || 0,
            }))
        )
        .select()
    ),

  listCompanies: async () => unwrap(await supabase.from("companies").select("*").order("name")),

  createCompany: async (name) =>
    unwrap(await supabase.from("companies").insert({ name: name.trim() }).select().single()),

  listReminderCalls: async (dealerId) =>
    unwrap(
      await supabase
        .from("reminder_calls")
        .select("*")
        .eq("dealer_id", dealerId)
        .order("called_at", { ascending: false })
    ),

  callDealerNow: async (dealerId) => {
    const { data, error } = await supabase.functions.invoke("reminder-calls", {
      body: { dealer_id: dealerId },
    });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      throw new Error(detail?.error || error.message);
    }
    return data;
  },
};
