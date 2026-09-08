import { createWorker } from "tesseract.js";

const DATE_RE = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
const NUMBER_RE = /\d[\d,]*\.?\d*/g;

let workerPromise;
function getWorker() {
  if (!workerPromise) workerPromise = createWorker("eng");
  return workerPromise;
}

// Best-effort conversion of a raw OCR line into a ledger row guess.
// Handwritten ledgers are hard for OCR, so this only ever produces a
// starting point the user reviews and corrects before saving.
function parseLine(rawText) {
  const text = rawText.trim();
  if (!text) return null;

  const dateMatch = text.match(DATE_RE);
  if (!dateMatch) return null;

  const [, d, m, y] = dateMatch;
  const year = y.length === 2 ? `20${y}` : y;
  const entry_date = `${year.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

  const afterDate = text.slice(dateMatch.index + dateMatch[0].length);
  const numbers = (afterDate.match(NUMBER_RE) || []).map((n) => n.replace(/,/g, ""));

  let bill_no = null;
  let amounts = numbers;
  if (numbers.length > 0 && numbers[0].length <= 4 && !numbers[0].includes(".")) {
    bill_no = numbers[0];
    amounts = numbers.slice(1);
  }

  const debit = amounts[0] ? Number(amounts[0]) : 0;
  const credit = amounts[1] ? Number(amounts[1]) : 0;

  return {
    entry_date,
    bill_no,
    debit: Number.isFinite(debit) ? debit : 0,
    credit: Number.isFinite(credit) ? credit : 0,
    raw: text,
  };
}

export async function scanLedgerImage(file) {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);

  const lines = (data.lines || [data]).map((l) => l.text || "");
  const rows = lines.map(parseLine).filter(Boolean);

  return { rawText: data.text, rows };
}
