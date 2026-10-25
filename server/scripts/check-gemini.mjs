#!/usr/bin/env node
/**
 * One-request health check for the Gemini integration.
 *
 *   GEMINI_API_KEY=your-key node scripts/check-gemini.mjs
 *
 * Sends a minimal prompt through the same code path the API uses, then prints
 * either the model reply or the translated error code the UI would show.
 * Useful for confirming a key/model before a demo, and for checking that the
 * model id in GEMINI_MODEL is enabled for your project.
 */
import { callGemini, isAiEnabled, AiUnavailableError } from '../src/services/geminiService.js';
import { env } from '../src/config/env.js';

const main = async () => {
  if (!isAiEnabled()) {
    console.error('GEMINI_API_KEY is not set. Export it first, e.g.');
    console.error('  GEMINI_API_KEY=your-key node scripts/check-gemini.mjs');
    process.exit(2);
  }

  console.log(`Model:      ${env.gemini.model}`);
  console.log(`Endpoint:   ${env.gemini.apiBaseUrl}`);
  console.log('Sending one small request…\n');

  const started = Date.now();
  try {
    const { text, finishReason } = await callGemini({
      prompt: 'Reply with exactly: PortiAI Gemini check OK',
      temperature: 0,
      maxOutputTokens: 32,
    });
    console.log(`✓ Reply received in ${Date.now() - started} ms (finishReason: ${finishReason || 'n/a'})`);
    console.log(`  "${text.trim().slice(0, 160)}"`);
    console.log('\nThe API will use this key for AI generation and AI-enriched analysis.');
  } catch (error) {
    const code = error instanceof AiUnavailableError ? error.code : 'UNEXPECTED';
    console.error(`✗ ${code}: ${error.message}`);
    if (code === 'INVALID_KEY') {
      console.error('  Create or copy a key at https://aistudio.google.com/apikey');
    } else if (code === 'QUOTA' || code === 'RATE') {
      console.error('  The free-tier limit for this Google Cloud project is exhausted. It resets on the');
      console.error('  schedule shown in AI Studio; the app falls back to rule-based analysis meanwhile.');
    } else if (code === 'UNAVAILABLE' && /not available/.test(error.message)) {
      console.error('  Set GEMINI_MODEL to a Flash or Flash-Lite model enabled for this key.');
    }
    process.exit(1);
  }
};

main();
