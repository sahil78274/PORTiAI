import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answerTurn,
  createBuilderFacts,
  nextFieldId,
  replayConversation,
  fieldPrompt,
  extractName,
  extractRole,
  extractSkills,
  parseSkillList,
  looksLikeName,
  getReadiness,
} from '../src/utils/builderConversation.js';

/** Drives the conversation exactly the way the page does. */
const runTurn = (state, text) => {
  const result = answerTurn({ facts: state.facts, declined: state.declined, text, activeField: state.activeField });
  return { ...state, ...result };
};

const start = (seed = {}) => {
  const facts = createBuilderFacts(seed);
  const declined = [];
  return { facts, declined, activeField: nextFieldId(facts, declined) || 'name', reply: '', captured: [] };
};

const say = (state, ...messages) => messages.reduce((current, message) => runTurn(current, message), state);

test('the reported flow collects the name and role and moves on', () => {
  let state = start();

  // 1. "hii" — a greeting is not a name.
  state = runTurn(state, 'hii');
  assert.equal(state.facts.fullName, '', 'a greeting must not be stored as the name');
  assert.equal(state.activeField, 'name');
  assert.match(state.reply, /name/i);

  // 2. "Sahil" — the name.
  state = runTurn(state, 'Sahil');
  assert.equal(state.facts.fullName, 'Sahil');
  assert.equal(state.activeField, 'role');
  assert.match(state.reply, /role/i);
  assert.ok(!/what’s your full name/i.test(state.reply), 'must not ask for the name again');

  // 3. "web developer" — the role, not a name.
  state = runTurn(state, 'web developer');
  assert.equal(state.facts.role, 'Web Developer');
  assert.equal(state.facts.fullName, 'Sahil', 'the role must not overwrite the name');
  assert.notEqual(state.activeField, 'role');
  assert.ok(!/professional role/i.test(state.reply), 'must not repeat the role question');

  // 4. A description also yields skills.
  state = runTurn(state, 'I build websites using React and Node.js');
  assert.equal(state.facts.about, 'I build websites using React and Node.js');
  assert.deepEqual(state.facts.skills.sort(), ['Node.js', 'React']);
  assert.equal(state.activeField, 'projects');
  assert.ok(getReadiness(state.facts).ready, 'name, role, about and skills are all known');
});

test('a role answer is never stored as the name', () => {
  let state = start();
  state = runTurn(state, 'web developer');
  assert.equal(state.facts.role, 'Web Developer');
  assert.equal(state.facts.fullName, '');
  assert.equal(state.activeField, 'name', 'the name is still the missing field');
  assert.match(state.reply, /name/i);
});

test('an explicit "my professional role is …" sentence is understood', () => {
  const state = say(start({ fullName: 'Sahil' }), 'my professional role is web developer');
  assert.equal(state.facts.role, 'Web Developer');
  assert.equal(state.facts.fullName, 'Sahil');
  assert.notEqual(state.activeField, 'role');
});

test('one message can answer several questions at once', () => {
  const state = say(start(), "I'm Sahil Sharma, a full stack developer building React dashboards");
  assert.equal(state.facts.fullName, 'Sahil Sharma');
  assert.match(state.facts.role, /Full Stack Developer/i);
  assert.match(state.facts.about, /React dashboards/);
  assert.ok(state.facts.skills.includes('React'));
});

test('with a seeded account name the first question is the role', () => {
  const state = start({ fullName: 'Sahil', contactEmail: 'sahil@example.com' });
  assert.equal(state.activeField, 'role');
  assert.match(fieldPrompt('role', state.facts), /role/i);
});

test('a question is never repeated once the answer is known', () => {
  let state = say(start(), 'Sahil', 'web developer', 'I build websites using React and Node.js', 'React, Node.js, Figma');
  assert.equal(state.facts.role, 'Web Developer');
  assert.equal(state.activeField, 'projects');

  const asked = state.reply;
  // Repeating the skill question would be a regression.
  state = runTurn(state, 'done');
  assert.ok(!/skills and technologies/i.test(asked));
  assert.equal(state.activeField, 'experience');
});

test('declined optional fields are never asked again', () => {
  let state = start();
  state = say(state, 'Sahil', 'web developer', 'I build websites using React and Node.js');
  assert.equal(state.activeField, 'projects');
  state = runTurn(state, 'skip'); // projects
  assert.equal(state.activeField, 'experience');
  state = runTurn(state, 'skip'); // experience
  assert.equal(state.activeField, 'education');
  state = runTurn(state, 'skip'); // education
  assert.equal(state.activeField, 'contact');
  state = runTurn(state, 'skip'); // contact
  assert.equal(state.activeField, 'template');

  const declinedIds = state.declined;
  assert.deepEqual(declinedIds, ['projects', 'experience', 'education', 'contact']);
  // Next state never revisits them.
  assert.equal(nextFieldId(state.facts, state.declined), 'template');
});

test('required fields cannot be skipped but the reply is reworded, not repeated', () => {
  const state = start();
  const result = runTurn(state, 'skip');
  assert.equal(result.activeField, 'name');
  assert.equal(result.status, 'clarify');
  assert.notEqual(result.reply, fieldPrompt('name', state.facts), 'must not repeat the same wording');
  assert.match(result.reply, /name/i);
});

test('an ambiguous answer asks for a clarification instead of restarting', () => {
  const state = start({ fullName: 'Sahil' });
  const result = runTurn(state, 'hmm not sure');
  assert.equal(result.facts.role, '');
  assert.equal(result.activeField, 'role');
  assert.equal(result.status, 'clarify');
  assert.match(result.reply, /(role|job title)/i);
});

test('a bare name while the role is being asked is acknowledged, not rejected', () => {
  const state = start({ fullName: 'Sahil' });
  const result = runTurn(state, 'Sahil');
  assert.equal(result.facts.fullName, 'Sahil');
  assert.equal(result.activeField, 'role', 'the role is still the missing field');
  assert.match(result.reply, /already set as Sahil/i);
  assert.ok(!/full name/i.test(result.reply), 'must not ask for the name again');
});

test('consecutive clarifications do not repeat the same sentence', () => {
  let state = start({ fullName: 'Sahil' });
  const first = runTurn(state, 'hmm');
  const second = runTurn(first, 'hmm');
  assert.equal(second.activeField, 'role');
  assert.notEqual(first.reply, second.reply, 'the second clarification should be worded differently');
});

test('skills are normalised and de-duplicated across messages', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js' });
  state = runTurn(state, 'react, node js and figma');
  assert.deepEqual(state.facts.skills, ['React', 'Node.js', 'Figma']);
  state = runTurn(state, 'Figma');
  assert.deepEqual(state.facts.skills, ['React', 'Node.js', 'Figma'], 'must not duplicate a skill');
});

test('projects are parsed from pipes and not duplicated by a repeated answer', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React'] });
  assert.equal(state.activeField, 'projects');

  state = runTurn(state, 'Campus Event Portal | Registration platform for two departments | React, Node.js | github.com/sahil/events');
  assert.equal(state.facts.projects.length, 1);
  assert.equal(state.facts.projects[0].name, 'Campus Event Portal');
  assert.deepEqual(state.facts.projects[0].technologies, ['React', 'Node.js']);
  assert.match(state.facts.projects[0].githubUrl, /^https:\/\/github\.com\/sahil\/events$/);

  const unparseable = runTurn(state, 'a thing I made once');
  assert.equal(unparseable.status, 'clarify');
  assert.equal(unparseable.facts.projects.length, 1, 'an unparseable project must not be stored');
  assert.match(unparseable.reply, /project name/i);
});

test('contact details are extracted from free text', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React'] });
  state = { ...state, activeField: 'contact' };
  state = runTurn(state, 'sahil@example.com, github.com/sahil, linkedin.com/in/sahil');
  assert.equal(state.facts.contactEmail, 'sahil@example.com');
  assert.equal(state.facts.socialLinks.github, 'https://github.com/sahil');
  assert.equal(state.facts.socialLinks.linkedin, 'https://linkedin.com/in/sahil');
  assert.notEqual(state.activeField, 'contact');
});

test('template and blog answers are recorded, then the flow reaches generate', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React'] });
  state = { ...state, declined: ['projects', 'experience', 'education', 'contact'], activeField: 'template' };

  state = runTurn(state, 'Dark Professional, concise tone');
  assert.equal(state.facts.templateId, 'dark');
  assert.equal(state.facts.tone, 'concise');
  assert.equal(state.activeField, 'blog');

  state = runTurn(state, 'Yes, add a blog');
  assert.equal(state.facts.wantsBlog, true);
  assert.equal(state.activeField, 'generate');
  assert.match(state.reply, /generate/i);
});

test('information given out of order is kept instead of lost', () => {
  // A contact answer while the summary is still outstanding must still be stored,
  // and the summary question must be asked again in different words.
  const state = start({ fullName: 'Sahil', role: 'Web Developer' });
  assert.equal(state.activeField, 'about');
  const result = runTurn(state, 'sahil@example.com, github.com/sahil');
  assert.equal(result.facts.contactEmail, 'sahil@example.com');
  assert.equal(result.facts.socialLinks.github, 'https://github.com/sahil');
  assert.equal(result.activeField, 'about', 'the summary is still missing');
  assert.match(result.reply, /saved your contact details/i);
});

test('closing a section acknowledges what was actually saved', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React'] });
  state = runTurn(state, 'Campus Portal | Registration app | React');
  assert.equal(state.activeField, 'projects');
  const closed = runTurn(state, 'done');
  assert.equal(closed.facts.projects.length, 1);
  assert.match(closed.reply, /projects saved/i);
  assert.doesNotMatch(closed.reply, /no projects for now/i);
  assert.equal(closed.activeField, 'experience');
});

test('a tool named later is added to the skill list instead of being dropped', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React', 'Node.js'] });
  const result = runTurn(state, 'React, Node.js, MongoDB');
  assert.deepEqual(result.facts.skills, ['React', 'Node.js', 'MongoDB']);
  assert.equal(result.activeField, 'projects', 'the project question is still outstanding');
});

test('the template step does not swallow an answer meant for another field', () => {
  let state = start({ fullName: 'Sahil', role: 'Web Developer', about: 'I build websites using React and Node.js', skills: ['React'] });
  state = { ...state, declined: ['projects', 'experience', 'education'], activeField: 'template' };

  const contact = runTurn(state, 'github.com/sahil');
  assert.equal(contact.facts.socialLinks.github, 'https://github.com/sahil');
  assert.equal(contact.facts.templateConfirmed, false, 'an unrelated message must not confirm the template');
  assert.equal(contact.activeField, 'template');
  assert.match(contact.reply, /saved your contact details/i);

  const confirmed = runTurn(contact, 'Minimal Developer, friendly tone');
  assert.equal(confirmed.facts.templateConfirmed, true);
  assert.equal(confirmed.facts.templateId, 'developer');
  assert.equal(confirmed.facts.tone, 'friendly');
  assert.equal(confirmed.activeField, 'blog');
});

test('replaying a transcript is deterministic and preserves order', () => {
  const messages = [
    { role: 'assistant', text: 'What’s your full name?' },
    { role: 'user', text: 'hii' },
    { role: 'assistant', text: 'Hello! What’s your full name?' },
    { role: 'user', text: 'Sahil' },
    { role: 'user', text: 'web developer' },
    { role: 'user', text: 'I build websites using React and Node.js' },
  ];
  const replayed = replayConversation(messages);
  assert.equal(replayed.facts.fullName, 'Sahil');
  assert.equal(replayed.facts.role, 'Web Developer');
  assert.equal(replayed.turns.length, 4, 'only user messages are turns');
  assert.equal(replayed.turns[0].facts.fullName, '', 'the greeting turn changes nothing');
  assert.equal(replayed.activeField, 'projects');
});

test('extraction helpers reject non-names and non-roles', () => {
  assert.equal(looksLikeName('web developer'), false);
  assert.equal(looksLikeName('I build websites using React'), false);
  assert.equal(looksLikeName('12345'), false);
  assert.equal(looksLikeName('Sahil'), true);
  assert.equal(looksLikeName('Sahil Sharma'), true);

  assert.equal(extractName('my name is Sahil Sharma'), 'Sahil Sharma');
  assert.equal(extractName('web developer'), null);
  assert.equal(extractRole('i work as a frontend developer'), 'Frontend Developer');
  assert.equal(extractRole('Sahil Sharma'), null);
  assert.deepEqual(extractSkills('I use React and postgresql daily'), ['React', 'PostgreSQL']);
  assert.deepEqual(parseSkillList('React, Node.js and UI/UX'), ['React', 'Node.js', 'UI/UX']);
});

test('the builder never returns an empty reply for a normal message', () => {
  const state = start();
  ['hii', 'Sahil', 'web developer', 'I build websites using React and Node.js'].reduce((current, text) => {
    const next = runTurn(current, text);
    assert.ok(next.reply && next.reply.trim().length > 0, `no reply for "${text}"`);
    return next;
  }, state);
});
