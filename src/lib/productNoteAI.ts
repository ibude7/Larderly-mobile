import { generateText } from './aiCore';
import { generateNote, type NoteInput } from './notes';

const SYSTEM_PROMPT = `You write short pantry item notes for a home food inventory app.
Given product scan data, write 1–2 concise sentences describing what the product is, notable traits (dietary labels, allergens when present), and a practical storage tip when relevant.
Plain text only — no bullet points, no markdown, no quotes around the answer. Keep it under 220 characters.`;

function buildPrompt(product: NoteInput): string {
  const payload = {
    name: product.name,
    brand: product.brand || null,
    category: product.category,
    barcode: product.barcode || null,
    unit: product.unit || null,
    description: product.description || null,
    packageSize: product.quantity_text || null,
    labels: product.labels_text || null,
    allergens: product.allergens?.length ? product.allergens : null,
    mayContainTraces: product.traces?.length ? product.traces : null,
    nutriScore: product.nutri_score || null,
    dietary: product.dietary?.length ? product.dietary : null,
  };
  return `${SYSTEM_PROMPT}\n\nProduct data:\n${JSON.stringify(payload)}`;
}

function trimNote(text: string): string {
  const line = text.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
  if (line.length <= 220) return line;
  const cut = line.slice(0, 217);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + '…';
}

/** AI-generated product note with deterministic fallback. */
export async function generateProductNote(product: NoteInput): Promise<string> {
  try {
    const raw = await generateText(buildPrompt(product), { temperature: 0.4, maxOutputTokens: 100 });
    const note = trimNote(raw);
    if (note.length >= 10) return note;
  } catch {
    // AI unavailable — fall back to rule-based note.
  }
  return generateNote(product);
}
