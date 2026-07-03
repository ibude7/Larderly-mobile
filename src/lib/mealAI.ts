/**
 * Firebase AI Logic — meal-planning intelligence for Larderly.
 *
 * All calls run client-side through Firebase AI Logic with the
 * `VertexAIBackend` (Vertex AI Gemini API). Because every request is tied to
 * the user's Firebase Auth session, no extra API key or serverless function
 * is required. The Firebase console's AI Logic rules/quotas control access.
 *
 * Model routing (as of 2026 the Gemini 3 family is still in public preview
 * and ships as `-preview` model IDs; stable Gemini 2.5 IDs are kept as a
 * fallback so the app keeps working if the preview hasn't been opted in
 * for a given Firebase project):
 * - MODEL_FLASH – cheap & fast. Used for chat, streaming meal ideas, and
 * single-slot suggestions.
 * - MODEL_PRO – stronger reasoning. Used for a full 7-day plan and rich,
 * multi-step recipes.
 */

import {
 getGenerativeModel,
 Schema,
 type GenerativeModel,
} from '@react-native-firebase/ai';
import { getAIInstance } from './aiBackend';
import type { PantryItem } from '../types';

/** Minimal shape of a model response we read text from. Avoids depending on
 * the SDK's exported response type name, which differs between the web and
 * React Native Firebase AI modules. */
interface TextResponse {
 text: () => string;
}

// Hermes (React Native's JS engine) does not reliably provide the DOM's
// `DOMException`, which the web app used for abort signalling. These helpers
// preserve the exact same behaviour (an error whose `.name` is 'AbortError')
// without depending on that global.
function makeAbortError(): Error {
 const err = new Error('Aborted');
 err.name = 'AbortError';
 return err;
}

function isAbortError(err: unknown): boolean {
 return err instanceof Error && err.name === 'AbortError';
}
import { getDaysUntilDate } from './date';

// ─────────────────────────────────────────────────────────────────────────────
// Shared response types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIMealIngredient {
 /** Display name of the ingredient. */
 name: string;
 /** Numeric quantity (e.g. 2, 1.5). */
 quantity: number;
 /** Unit label (item, g, tbsp, …). */
 unit: string;
 /** True when the AI matched this ingredient to a pantry item. */
 inPantry: boolean;
 /** Optional pantry match id — set when `inPantry` is true. */
 pantryItemId?: string;
}

export interface AIMealIdea {
 /** Short, catchy dish name. */
 name: string;
 /** One-sentence hook (why you might want to make this now). */
 description: string;
 /** Prep time in minutes. */
 prepTimeMin: number;
 /** Cook time in minutes. */
 cookTimeMin: number;
 /** Recommended servings. */
 servings: number;
 /** Difficulty tier. */
 difficulty: 'easy' | 'medium' | 'hard';
 /** Ordered ingredients with pantry-match info. */
 ingredients: AIMealIngredient[];
 /** Optional short tags (e.g."high-protein","vegetarian"). */
 tags: string[];
 /** Fraction [0..1] of ingredients currently in the pantry. */
 pantryCoverage: number;
}

export interface AIRecipeStep {
 /** 1-based step number. */
 stepNumber: number;
 /** Short step title (e.g."Sauté aromatics"). */
 title: string;
 /** Full, detailed instructions. */
 body: string;
}

export interface AIRecipe extends AIMealIdea {
 /** Ordered cooking steps. */
 steps: AIRecipeStep[];
 /** Optional pro-tips, substitutions, serving notes. */
 tips: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface AIWeekPlanEntry {
 /** Stored-date string (YYYY-MM-DD). */
 date: string;
 mealType: MealType;
 meal: AIMealIdea;
}

export interface AIWeekPlan {
 /** 1–2 sentence summary of the overall strategy (what's prioritised). */
 summary: string;
 /** Flat list of suggested meals, one per day/mealType slot. */
 entries: AIWeekPlanEntry[];
}

export interface WeekPlanPreferences {
 /** ISO `YYYY-MM-DD` of the Monday starting the week. */
 startDate: string;
 /** Which meal types to plan. Defaults to dinner only to keep cost low. */
 mealTypes: MealType[];
 /** Target number of servings per meal. */
 servings: number;
 /** Free-form dietary restrictions (e.g."no pork","low-carb"). */
 restrictions: string;
 /** When true, prioritise items expiring within 7 days. */
 useExpiringFirst: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client access layer
// ─────────────────────────────────────────────────────────────────────────────

/** Primary fast model → first stable fallback. Used for chat, ideas, slot.
 * Gemini 3 flash is still a `-preview` ID in 2026; the 2.5 flash ID is
 * kept as a fallback so the app keeps working if the preview hasn't been
 * enabled yet for a given Firebase project. */
const MODEL_FLASH_IDS = ['gemini-3-flash-preview', 'gemini-2.5-flash'] as const;

/** Primary reasoning model → first stable fallback. Used for recipes and
 * full-week planning. */
const MODEL_PRO_IDS = ['gemini-3.1-pro-preview', 'gemini-2.5-pro'] as const;

/** Pattern that identifies"this model id is bogus / not available for
 * this project" errors so we can transparently fall back to the next id. */
const MODEL_MISSING = /not found|not supported|unknown model|does not exist|invalid model|NOT_FOUND|404/i;

/** Human-friendly error users can see if AI Logic isn't wired up yet. */
export class MealAIConfigurationError extends Error {
 constructor() {
 super(
 'AI meal planning is not available yet. Enable Firebase AI Logic with the Vertex AI Gemini API in the Firebase console and redeploy.',
 );
 this.name = 'MealAIConfigurationError';
 }
}

/**
 * Convert low-level SDK errors into a user-friendly message without leaking
 * internals into the UI.
 */
function toUserMessage(err: unknown): string {
 const raw = err instanceof Error ? err.message : String(err);
 // Dev-only breadcrumb so the original message is visible in the console
 // even after we prettify it for the UI. `__DEV__` is the React Native
 // global that is true in development builds.
 if (__DEV__) {
 console.error('[mealAI] error:', err);
 }
 if (/not enabled|AI Logic|consumer|PROJECT_NOT_FOUND/i.test(raw)) {
 return 'AI meal planning is not available yet. Enable Firebase AI Logic with the Vertex AI Gemini API in your Firebase project and try again.';
 }
 if (MODEL_MISSING.test(raw)) {
 return 'The AI model isn’t available for this project yet. Enable Gemini 3 (preview) or Gemini 2.5 in Firebase AI Logic and try again.';
 }
 if (/quota|rate limit|429/i.test(raw)) {
 return 'AI is busy right now. Please try again in a moment.';
 }
 if (/permission|unauthorized|auth/i.test(raw)) {
 return 'You need to be signed in to use AI meal planning.';
 }
 if (/network|fetch|failed to fetch|offline/i.test(raw)) {
 return 'Couldn’t reach the AI service. Check your connection and try again.';
 }
 return 'Something went wrong talking to the AI. Please try again.';
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory framing for prompts
// ─────────────────────────────────────────────────────────────────────────────

interface InventorySnapshotItem {
 id: string;
 name: string;
 brand: string;
 category: string;
 quantity: number;
 unit: string;
 daysUntilExpiry: number | null;
 isLowStock: boolean;
}

/**
 * Produce a compact, tokens-efficient pantry snapshot for the model. We
 * deliberately omit image URLs and notes to keep prompts lean.
 */
function buildInventorySnapshot(items: PantryItem[]): InventorySnapshotItem[] {
 return items.map(i => ({
 id: i.id,
 name: i.name,
 brand: i.brand,
 category: i.category,
 quantity: i.quantity,
 unit: i.unit,
 daysUntilExpiry: getDaysUntilDate(i.expiry_date),
 isLowStock: i.quantity <= i.low_stock_threshold,
 }));
}

/**
 * After the model returns ingredients, match them to real pantry items by
 * name (case-insensitive substring). The SDK can't do this alone because the
 * matching rules are app-specific.
 */
function enrichIngredients(
 ingredients: Array<Omit<AIMealIngredient, 'inPantry' | 'pantryItemId'>>,
 pantryItems: PantryItem[],
): AIMealIngredient[] {
 return ingredients.map(ing => {
 const match = pantryItems.find(p =>
 p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
 ing.name.toLowerCase().includes(p.name.toLowerCase()),
 );
 return {
 ...ing,
 inPantry: !!match,
 pantryItemId: match?.id,
 };
 });
}

/** Compute the pantry-coverage ratio for a completed meal idea. */
function coverage(ings: AIMealIngredient[]): number {
 if (ings.length === 0) return 0;
 const hits = ings.filter(i => i.inPantry).length;
 return hits / ings.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured-output schemas (Gemini responseSchema)
// ─────────────────────────────────────────────────────────────────────────────

const INGREDIENT_SCHEMA = Schema.object({
 properties: {
 name: Schema.string({ description: 'Ingredient name' }),
 quantity: Schema.number({ description: 'Numeric quantity' }),
 unit: Schema.string({ description: 'Unit (e.g. item, g, tbsp, cup)' }),
 },
});

const IDEA_SCHEMA = Schema.object({
 properties: {
 name: Schema.string({ description: 'Dish name' }),
 description: Schema.string({ description: 'Short enticing one-liner' }),
 prepTimeMin: Schema.integer({ description: 'Prep time in minutes' }),
 cookTimeMin: Schema.integer({ description: 'Cook time in minutes' }),
 servings: Schema.integer({ description: 'Recommended servings' }),
 difficulty: Schema.enumString({ enum: ['easy', 'medium', 'hard'] }),
 ingredients: Schema.array({ items: INGREDIENT_SCHEMA }),
 tags: Schema.array({ items: Schema.string() }),
 },
});

const IDEAS_SCHEMA = Schema.object({
 properties: {
 ideas: Schema.array({ items: IDEA_SCHEMA }),
 },
});

const RECIPE_SCHEMA = Schema.object({
 properties: {
 name: Schema.string(),
 description: Schema.string(),
 prepTimeMin: Schema.integer(),
 cookTimeMin: Schema.integer(),
 servings: Schema.integer(),
 difficulty: Schema.enumString({ enum: ['easy', 'medium', 'hard'] }),
 ingredients: Schema.array({ items: INGREDIENT_SCHEMA }),
 tags: Schema.array({ items: Schema.string() }),
 steps: Schema.array({
 items: Schema.object({
 properties: {
 stepNumber: Schema.integer(),
 title: Schema.string(),
 body: Schema.string(),
 },
 }),
 }),
 tips: Schema.array({ items: Schema.string() }),
 },
});

const WEEK_PLAN_SCHEMA = Schema.object({
 properties: {
 summary: Schema.string({ description: '1–2 sentence overview' }),
 entries: Schema.array({
 items: Schema.object({
 properties: {
 date: Schema.string({ description: 'YYYY-MM-DD' }),
 mealType: Schema.enumString({ enum: ['breakfast', 'lunch', 'dinner', 'snack'] }),
 meal: IDEA_SCHEMA,
 },
 }),
 }),
 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = [
 'You are Larderly, a friendly chef-in-residence that plans meals from whatever is actually in the user\'s pantry.',
 '',
 'Rules you must follow:',
 '1. Prefer recipes that maximise in-pantry ingredients. Aim for at least 60% pantry coverage.',
 '2. Prioritise ingredients expiring within the next 7 days — waste is the enemy.',
 '3. Respect the user\'s servings and dietary restrictions exactly.',
 '4. Be honest about missing ingredients: list them so they can be added to the shopping list.',
 '5. Keep names short and evocative (e.g."Lemony Chickpea Pasta", not"Pasta With Chickpeas And Lemon Served Hot").',
 '6. Use realistic prep/cook times and ingredient quantities.',
 '7. Output must strictly match the response schema. No markdown, no commentary.',
].join('\n');

function getIdeasModel(modelId: string): GenerativeModel {
 return getGenerativeModel(getAIInstance(), {
 model: modelId,
 systemInstruction: SYSTEM_INSTRUCTION,
 generationConfig: {
 responseMimeType: 'application/json',
 responseSchema: IDEAS_SCHEMA,
 temperature: 0.8,
 },
 });
}

function getSlotModel(modelId: string): GenerativeModel {
 return getGenerativeModel(getAIInstance(), {
 model: modelId,
 systemInstruction: SYSTEM_INSTRUCTION,
 generationConfig: {
 responseMimeType: 'application/json',
 responseSchema: IDEA_SCHEMA,
 temperature: 0.9,
 },
 });
}

function getWeekModel(modelId: string): GenerativeModel {
 return getGenerativeModel(getAIInstance(), {
 model: modelId,
 systemInstruction: SYSTEM_INSTRUCTION,
 generationConfig: {
 responseMimeType: 'application/json',
 responseSchema: WEEK_PLAN_SCHEMA,
 temperature: 0.7,
 },
 });
}

function getRecipeModel(modelId: string): GenerativeModel {
 return getGenerativeModel(getAIInstance(), {
 model: modelId,
 systemInstruction: SYSTEM_INSTRUCTION,
 generationConfig: {
 responseMimeType: 'application/json',
 responseSchema: RECIPE_SCHEMA,
 temperature: 0.6,
 },
 });
}

/**
 * Walk through `modelIds` calling `attempt` on each. If an attempt fails
 * with a"model-not-found" style error we fall through to the next id;
 * any other error is rethrown immediately. This lets us prefer `-preview`
 * IDs while still working on projects that only have stable models enabled.
 *
 * We remember the first id that succeeds in-memory so subsequent calls skip
 * the probing phase.
 */
const _resolvedModel = new Map<string, string>();

async function withModel<T>(
 bucket: 'flash' | 'pro',
 modelIds: readonly string[],
 attempt: (modelId: string) => Promise<T>,
): Promise<T> {
 const remembered = _resolvedModel.get(bucket);
 const ordered = remembered
 ? [remembered, ...modelIds.filter(id => id !== remembered)]
 : modelIds;

 let lastErr: unknown;
 for (const id of ordered) {
 try {
 const result = await attempt(id);
 _resolvedModel.set(bucket, id);
 return result;
 } catch (err) {
 const raw = err instanceof Error ? err.message : String(err);
 if (!MODEL_MISSING.test(raw)) throw err;
 // If the"preview" id is unknown we forget any cached mapping so the
 // next cold call still probes from the top of the list.
 if (remembered === id) _resolvedModel.delete(bucket);
 lastErr = err;
 }
 }
 throw lastErr ?? new Error('No compatible Gemini model found.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw-response shapes (before enrichment)
// ─────────────────────────────────────────────────────────────────────────────

interface RawIngredient {
 name: string;
 quantity: number;
 unit: string;
}

interface RawIdea {
 name: string;
 description: string;
 prepTimeMin: number;
 cookTimeMin: number;
 servings: number;
 difficulty: 'easy' | 'medium' | 'hard';
 ingredients: RawIngredient[];
 tags: string[];
}

interface RawRecipe extends RawIdea {
 steps: { stepNumber: number; title: string; body: string }[];
 tips: string[];
}

interface RawIdeasResponse {
 ideas: RawIdea[];
}

interface RawWeekPlan {
 summary: string;
 entries: { date: string; mealType: MealType; meal: RawIdea }[];
}

/** Safely parse JSON from a model response, defaulting to empty object. */
function parseJSON<T>(resp: TextResponse): T {
 try {
 return JSON.parse(resp.text()) as T;
 } catch (err) {
 throw new Error(`AI returned malformed JSON: ${err instanceof Error ? err.message : String(err)}`);
 }
}

function enrichIdea(raw: RawIdea, pantry: PantryItem[]): AIMealIdea {
 const ings = enrichIngredients(raw.ingredients ?? [], pantry);
 return {
 name: raw.name,
 description: raw.description ?? '',
 prepTimeMin: raw.prepTimeMin ?? 0,
 cookTimeMin: raw.cookTimeMin ?? 0,
 servings: raw.servings ?? 2,
 difficulty: raw.difficulty ?? 'easy',
 ingredients: ings,
 tags: raw.tags ?? [],
 pantryCoverage: coverage(ings),
 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateIdeasOptions {
 /** How many ideas to generate. Defaults to 6. */
 count?: number;
 /** Include ideas that need 1-2 grocery items, not just 100% pantry. */
 allowMissingIngredients?: boolean;
 /** Free-form dietary restrictions (e.g."no dairy"). */
 restrictions?: string;
 /** Signal used to cancel the request mid-flight. */
 signal?: AbortSignal;
 /** Called as ideas stream in (best-effort parse of partial JSON). */
 onPartial?: (ideasSoFar: AIMealIdea[]) => void;
}

/**
 * Stream a list of meal ideas tailored to the current pantry. Ideas arrive
 * incrementally via `onPartial`; the resolved promise contains the final set.
 */
export async function generateIdeas(
 pantryItems: PantryItem[],
 opts: GenerateIdeasOptions = {},
): Promise<AIMealIdea[]> {
 const {
 count = 6,
 allowMissingIngredients = true,
 restrictions,
 signal,
 onPartial,
 } = opts;

 const inventory = buildInventorySnapshot(pantryItems);
 const prompt = [
 `Suggest ${count} meal ideas the user could make right now.`,
 `Pantry (${inventory.length} items, JSON): ${JSON.stringify(inventory)}`,
 allowMissingIngredients
 ? 'Up to 2 missing ingredients per dish is OK — they go on the shopping list.'
 : 'Every ingredient must be in the pantry.',
 restrictions ? `Dietary restrictions: ${restrictions}` : '',
 'Prefer ideas with >60% pantry coverage, and prioritise items expiring in <=7 days.',
 'Order by relevance: best ideas first.',
 ]
 .filter(Boolean)
 .join('\n\n');

 try {
 return await withModel('flash', MODEL_FLASH_IDS, async modelId => {
 const model = getIdeasModel(modelId);
 const { stream, response } = await model.generateContentStream(prompt);

 let buffer = '';
 for await (const chunk of stream) {
 if (signal?.aborted) throw makeAbortError();
 buffer += chunk.text();
 if (onPartial) {
 const partial = tryParsePartialIdeas(buffer, pantryItems);
 if (partial.length) onPartial(partial);
 }
 }
 const final = await response;
 const parsed = parseJSON<RawIdeasResponse>(final);
 return (parsed.ideas ?? []).map(i => enrichIdea(i, pantryItems));
 });
 } catch (err) {
 if (isAbortError(err)) throw err;
 throw new Error(toUserMessage(err));
 }
}

/**
 * Best-effort parse of a partially-streamed JSON object so the UI can show
 * ideas as they arrive. Any parse failure simply returns an empty list — we
 * retry on the next chunk.
 */
function tryParsePartialIdeas(buffer: string, pantry: PantryItem[]): AIMealIdea[] {
 // Gemini streams incremental JSON that's valid-at-every-step when a schema
 // is attached, but the top-level object may still be open. Try closing
 // straggling brackets and re-parsing.
 const candidates = [buffer, buffer + ']}', buffer + '}', buffer + ']}}', buffer + '}}'];
 for (const c of candidates) {
 try {
 const obj = JSON.parse(c) as Partial<RawIdeasResponse>;
 if (obj.ideas && Array.isArray(obj.ideas)) {
 return obj.ideas
 .filter((i): i is RawIdea => !!i && typeof i.name === 'string' && i.name.length > 0)
 .map(i => enrichIdea(i, pantry));
 }
 } catch {
 // keep trying
 }
 }
 return [];
}

/**
 * Generate a single meal suggestion for a specific {date, mealType} slot.
 * Returns a completed `AIMealIdea` ready to hand to `AddMealModal`.
 */
export async function generateSlotMeal(
 pantryItems: PantryItem[],
 mealType: MealType,
 opts: { restrictions?: string; servings?: number; signal?: AbortSignal } = {},
): Promise<AIMealIdea> {
 const inventory = buildInventorySnapshot(pantryItems);
 const prompt = [
 `Suggest one ${mealType} idea using the current pantry.`,
 `Target servings: ${opts.servings ?? 2}.`,
 opts.restrictions ? `Dietary restrictions: ${opts.restrictions}` : '',
 `Pantry (JSON): ${JSON.stringify(inventory)}`,
 'Keep it realistic and appetising. Minimise missing ingredients.',
 ]
 .filter(Boolean)
 .join('\n\n');

 try {
 if (opts.signal?.aborted) throw makeAbortError();
 return await withModel('flash', MODEL_FLASH_IDS, async modelId => {
 const model = getSlotModel(modelId);
 const { response } = await model.generateContent(prompt);
 const raw = parseJSON<RawIdea>(response);
 return enrichIdea(raw, pantryItems);
 });
 } catch (err) {
 if (isAbortError(err)) throw err;
 throw new Error(toUserMessage(err));
 }
}

/**
 * Produce a full, structured recipe (ingredients + steps + tips) streamed as
 * it generates. The promise resolves once the model finishes.
 */
export async function generateRecipe(
 mealName: string,
 pantryItems: PantryItem[],
 opts: {
 mealType?: MealType;
 servings?: number;
 restrictions?: string;
 signal?: AbortSignal;
 onPartial?: (recipe: Partial<AIRecipe>) => void;
 } = {},
): Promise<AIRecipe> {
 const inventory = buildInventorySnapshot(pantryItems);
 const prompt = [
 `Create a detailed recipe for"${mealName}"${opts.mealType ? ` (for ${opts.mealType})` : ''}.`,
 `Target servings: ${opts.servings ?? 4}.`,
 opts.restrictions ? `Dietary restrictions: ${opts.restrictions}` : '',
 `Available pantry (JSON): ${JSON.stringify(inventory)}`,
 'Provide clear numbered steps, realistic times, and 2-4 helpful tips.',
 ]
 .filter(Boolean)
 .join('\n\n');

 try {
 return await withModel('pro', MODEL_PRO_IDS, async modelId => {
 const model = getRecipeModel(modelId);
 const { stream, response } = await model.generateContentStream(prompt);

 let buffer = '';
 for await (const chunk of stream) {
 if (opts.signal?.aborted) throw makeAbortError();
 buffer += chunk.text();
 if (opts.onPartial) {
 const partial = tryParsePartialRecipe(buffer, pantryItems);
 if (partial) opts.onPartial(partial);
 }
 }
 const final = await response;
 const raw = parseJSON<RawRecipe>(final);
 const idea = enrichIdea(raw, pantryItems);
 return {
 ...idea,
 steps: (raw.steps ?? []).map((s, i) => ({
 stepNumber: s.stepNumber ?? i + 1,
 title: s.title ?? `Step ${i + 1}`,
 body: s.body ?? '',
 })),
 tips: raw.tips ?? [],
 };
 });
 } catch (err) {
 if (isAbortError(err)) throw err;
 throw new Error(toUserMessage(err));
 }
}

function tryParsePartialRecipe(buffer: string, pantry: PantryItem[]): Partial<AIRecipe> | null {
 const candidates = [buffer, buffer + ']}', buffer + '}', buffer + ']}}', buffer + '"}]}'];
 for (const c of candidates) {
 try {
 const raw = JSON.parse(c) as Partial<RawRecipe>;
 if (raw.name && typeof raw.name === 'string') {
 const partialIdea = enrichIdea(
 {
 name: raw.name,
 description: raw.description ?? '',
 prepTimeMin: raw.prepTimeMin ?? 0,
 cookTimeMin: raw.cookTimeMin ?? 0,
 servings: raw.servings ?? 2,
 difficulty: raw.difficulty ?? 'easy',
 ingredients: raw.ingredients ?? [],
 tags: raw.tags ?? [],
 },
 pantry,
 );
 return {
 ...partialIdea,
 steps: (raw.steps ?? []).map((s, i) => ({
 stepNumber: s?.stepNumber ?? i + 1,
 title: s?.title ?? `Step ${i + 1}`,
 body: s?.body ?? '',
 })),
 tips: raw.tips ?? [],
 };
 }
 } catch {
 // keep trying
 }
 }
 return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat (multi-turn conversational) API
// ─────────────────────────────────────────────────────────────────────────────

/** A single message in a Larderly chat conversation. Owned by the UI layer so
 * we don't couple components to the Firebase SDK's `Content` shape. */
export interface ChatMessage {
 role: 'user' | 'assistant';
 text: string;
 /** Millisecond timestamp for display ordering / keys. */
 ts: number;
}

/** Conversational system instruction, separate from the structured-output
 * prompt used by ideas/recipes/week-plan generation. */
const CHAT_SYSTEM_INSTRUCTION = ["You are Chef Larderly, a warm and practical cooking assistant built into the user's kitchen app.",
 '',
 'What you do:',"- Answer questions about the user's pantry inventory (you will receive a fresh snapshot with every turn).",
 '- Suggest meals they can cook right now, favouring high pantry coverage.',
 '- Explain recipes, substitutions, and kitchen technique.',
 '- Help plan meals across days and gently flag ingredients that expire soon.',
 '- Respect dietary restrictions the user mentions.',
 '',
 'How you talk:',
 '- Be concise and conversational. Default to 2–6 sentences unless the user asks for detail.',
 '- Use short bullet lists (lines starting with"-") for ideas, ingredients, or steps.',
 '- Use **bold** to emphasise dish names or key terms.',
 '- When proposing a dish, include approximate total time and servings.',
 '- If the pantry is empty or sparse, be upfront and suggest a small shopping list.',"- Never say \"As an AI\" or similar hedges.",
 '',
 'Important limits:',
 '- You CANNOT modify the pantry, meal plan, or shopping list yourself. When the user wants to save a meal, point them to the"Save to meal plan","Plan my week", or"Add missing to shopping list" buttons in the app.',
 '- Do not invent pantry items the user has not mentioned.',
].join('\n');

function getChatModel(modelId: string): GenerativeModel {
 return getGenerativeModel(getAIInstance(), {
 model: modelId,
 systemInstruction: CHAT_SYSTEM_INSTRUCTION,
 generationConfig: {
 temperature: 0.85,
 },
 });
}

interface SendChatMessageOptions {
 signal?: AbortSignal;
 /** Called with the cumulative assistant reply as it streams. */
 onPartial?: (text: string) => void;
}

/**
 * Send a message in an ongoing meal-chat conversation and stream the
 * assistant's reply.
 *
 * This function is stateless at the SDK layer: the caller passes the full
 * conversation `history` plus the new `userMessage`, and we re-open a
 * ChatSession each turn. That's slightly more tokens than reusing a single
 * `ChatSession` object, but it plays much nicer with React state and means
 * we can trivially reset or rewind the conversation.
 *
 * A fresh inventory snapshot is injected into the turn as a system-style
 * prefix so the assistant's replies always reflect the current pantry.
 */
export async function sendChatMessage(
 pantryItems: PantryItem[],
 history: ChatMessage[],
 userMessage: string,
 opts: SendChatMessageOptions = {},
): Promise<string> {
 const inventory = buildInventorySnapshot(pantryItems);
 // The model expects history roles `user` and `model`. We store `assistant`
 // in the UI to match conventional chat vocabulary.
 const sdkHistory = history.map(m => ({
 role: m.role === 'user' ? ('user' as const) : ('model' as const),
 parts: [{ text: m.text }],
 }));

 const framedMessage = [
 `Current pantry (${inventory.length} items, JSON): ${JSON.stringify(inventory)}`,
 '',
 `User: ${userMessage}`,
 ].join('\n');

 try {
 if (opts.signal?.aborted) throw makeAbortError();
 return await withModel('flash', MODEL_FLASH_IDS, async modelId => {
 const model = getChatModel(modelId);
 const chat = model.startChat({ history: sdkHistory });
 const { stream, response } = await chat.sendMessageStream(framedMessage);

 let buffer = '';
 for await (const chunk of stream) {
 if (opts.signal?.aborted) throw makeAbortError();
 buffer += chunk.text();
 opts.onPartial?.(buffer);
 }
 const final = await response;
 return final.text();
 });
 } catch (err) {
 if (isAbortError(err)) throw err;
 throw new Error(toUserMessage(err));
 }
}

/** Conversation starters we surface in the empty state of the chat. They're
 * just strings — the UI decides how to present and how to submit them. */
export function getSuggestedChatPrompts(pantryItems: PantryItem[]): string[] {
 const hasPantry = pantryItems.length > 0;
 const expiring = pantryItems.filter(p => {
 const days = getDaysUntilDate(p.expiry_date);
 return days != null && days >= 0 && days <= 7;
 });

 const prompts: string[] = [];
 if (hasPantry) {
 prompts.push('What can I make for dinner tonight?');
 } else {
 prompts.push('I have an empty pantry — what should I shop for this week?');
 }
 if (expiring.length > 0) {
 const sample = expiring.slice(0, 2).map(p => p.name).join(' and ');
 prompts.push(`Give me an idea using my ${sample} before it expires.`);
 } else {
 prompts.push('Suggest a quick 15-minute breakfast.');
 }
 prompts.push('Plan 3 dinners for the week using mostly what I already have.');
 prompts.push('What pantry staples am I missing for a well-stocked kitchen?');
 return prompts;
}

/**
 * Generate a full week meal-plan starting at `startDate`. Returns a list of
 * `{ date, mealType, meal }` entries — one per requested slot. The caller is
 * expected to review and save to Firestore.
 */
export async function generateWeekPlan(
 pantryItems: PantryItem[],
 prefs: WeekPlanPreferences,
 opts: { signal?: AbortSignal } = {},
): Promise<AIWeekPlan> {
 const inventory = buildInventorySnapshot(pantryItems);
 const prompt = [
 `Plan ${prefs.mealTypes.join(', ')} for the 7 days starting ${prefs.startDate}.`,
 `Servings per meal: ${prefs.servings}.`,
 prefs.restrictions ? `Dietary restrictions: ${prefs.restrictions}.` : '',
 prefs.useExpiringFirst
 ? 'Prioritise pantry items expiring within 7 days; weave them into the earliest dinners.'
 : '',
 `Available pantry (JSON): ${JSON.stringify(inventory)}`,
 'Vary cuisines across the week. Avoid repeating the same dish twice. Keep breakfasts quick.',
 'Return exactly one meal per requested mealType per day (7 days × N meal types).',
 ]
 .filter(Boolean)
 .join('\n\n');

 try {
 if (opts.signal?.aborted) throw makeAbortError();
 return await withModel('pro', MODEL_PRO_IDS, async modelId => {
 const model = getWeekModel(modelId);
 const { response } = await model.generateContent(prompt);
 const raw = parseJSON<RawWeekPlan>(response);
 return {
 summary: raw.summary ?? '',
 entries: (raw.entries ?? []).map(e => ({
 date: e.date,
 mealType: e.mealType,
 meal: enrichIdea(e.meal, pantryItems),
 })),
 };
 });
 } catch (err) {
 if (isAbortError(err)) throw err;
 throw new Error(toUserMessage(err));
 }
}
