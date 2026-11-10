#!/usr/bin/env node
/**
 * One-request health check for the Gemini integration.
 *
 *   GEMINI_PORTFOLIO_API_KEY=your-portfolio-key node scripts/check-gemini.mjs
 *   GEMINI_PROJECT_API_KEY=your-project-key node scripts/check-gemini.mjs --project
 *
 * `--project` checks the AI Project Builder key/model and JSON mode, which is
 * the path that generates files. Without the flag it checks the portfolio key
 * used for bios and analysis. The two integrations are deliberately separate.
 *
 * The script sends exactly one small request through the same server-side code
 * path, then prints either the reply or the translated error code the UI shows.
 */
import { callGemini, AiUnavailableError, parseJsonFromText } from '../src/services/geminiService.js';
import { callAi, isProjectAiConfigured, projectModel } from '../src/services/aiProvider.js';
import { env } from '../src/config/env.js';

const projectMode = process.argv.includes('--project');
const configured = projectMode ? isProjectAiConfigured() : Boolean(env.gemini.apiKey);
const keyName = projectMode ? 'GEMINI_PROJECT_API_KEY' : 'GEMINI_PORTFOLIO_API_KEY';
const model = projectMode ? projectModel() : env.gemini.model;
const endpoint = projectMode ? env.ai.geminiApiBaseUrl : env.gemini.apiBaseUrl;

const fail = (message) => {
  console.error(message);
  process.exit(2);
};

if (!configured) {
  if (projectMode) {
    fail(
      'GEMINI_PROJECT_API_KEY is not set. Export it first, e.g.\n' +
        '  GEMINI_PROJECT_API_KEY=your-key node scripts/check-gemini.mjs --project\n' +
        '(GEMINI_API_KEY is still accepted as a legacy fallback for both integrations.)'
    );
  }
  fail(
    'GEMINI_PORTFOLIO_API_KEY is not set. Export it first, e.g.\n' +
      '  GEMINI_PORTFOLIO_API_KEY=your-key node scripts/check-gemini.mjs'
  );
}

console.log(`Target:     ${projectMode ? 'AI Project Builder (JSON/files)' : 'Portfolio AI'}`);
console.log(`Key:        ${keyName}`);
console.log(`Model:      ${model}`);
console.log(`Endpoint:   ${endpoint}`);
console.log('Sending one small request…\n');

const started = Date.now();
try {
  if (projectMode) {
    const { text, finishReason } = await callAi({
      prompt: 'Return exactly this JSON and nothing else: {"ok":true,"message":"project builder check"}',
      json: true,
      temperature: 0,
      maxOutputTokens: 64,
      timeoutMs: 30000,
      stage: 'check-project',
    });
    const parsed = parseJsonFromText(text);
    if (!parsed?.ok) throw new Error('The model replied, but the JSON mode response could not be parsed.');
    console.log(`✓ JSON response received in ${Date.now() - started} ms (finishReason: ${finishReason || 'n/a'})`);
    console.log(`  "${String(text).replace(/\s+/g, ' ').slice(0, 160)}"`);
    console.log('\nThe Project Builder key, model, endpoint and JSON mode all work.');
  } else {
    const { text, finishReason } = await callGemini({
      prompt: 'Reply with exactly: PortiAI Gemini check OK',
      temperature: 0,
      maxOutputTokens: 32,
      stage: 'check-portfolio',
    });
    console.log(`✓ Reply received in ${Date.now() - started} ms (finishReason: ${finishReason || 'n/a'})`);
    console.log(`  "${text.trim().slice(0, 160)}"`);
    console.log('\nThe portfolio AI key and model work.');
  }
} catch (error) {
  const code = error instanceof AiUnavailableError ? error.code : 'UNEXPECTED';
  console.error(`✗ ${code}: ${error.message}`);
  if (code === 'INVALID_KEY') {
    console.error(`  Create or copy a key at https://aistudio.google.com/apikey and check ${keyName}.`);
  } else if (code === 'PERMISSION') {
    console.error('  Enable the Generative Language API in the key’s Google Cloud project (403).');
  } else if (code === 'QUOTA' || code === 'RATE') {
    console.error('  The Gemini limit for this Google Cloud project is exhausted or rate-limited.');
    console.error('  It resets on the schedule shown in AI Studio; the app reports this to the user.');
  } else if (code === 'MODEL_NOT_FOUND') {
    console.error(`  Set ${projectMode ? 'GEMINI_PROJECT_MODEL' : 'GEMINI_PORTFOLIO_MODEL'} to a Flash or Flash-Lite model.`);
  } else if (code === 'TRUNCATED') {
    console.error('  The model hit its output-token limit. Try a Flash model, or check GEMINI_PROJECT_THINKING_BUDGET=0.');
  }
  process.exit(1);
}
