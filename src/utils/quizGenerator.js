/**
 * WikiHole Local Quiz Generator
 * ──────────────────────────────
 * Generates quiz cards entirely client-side from Wikipedia article data.
 * No API key required. Returns the same card format as /api/quiz so the
 * rest of the app needs zero changes.
 *
 * Card format:
 *   { question, options: ["A) ...", ...], answer: "A", explanation, source }
 */

const LETTERS = ['A', 'B', 'C', 'D'];

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build the options array and return the correct answer letter.
 * Shuffles correct answer in among up to 3 distractors.
 */
function makeOptions(correct, distractors) {
  const pool = shuffle([correct, ...distractors.slice(0, 3)]).slice(0, 4);
  // Pad to 4 if we don't have enough distractors
  while (pool.length < 4) pool.push('None of the above');
  const answerIdx = pool.indexOf(correct);
  return {
    options: pool.map((o, i) => `${LETTERS[i]}) ${o}`),
    answer: LETTERS[answerIdx === -1 ? 0 : answerIdx],
  };
}

/** Split extract into sentences, filter to useful length. */
function sentences(extract = '') {
  return extract
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 220);
}

// ── Question generators ───────────────────────────────────────────────────────

/**
 * Type 1 — Description match
 * "Which best describes '[Title]'?"
 * Correct answer = article.description
 * Distractors = descriptions from other trail articles
 */
function descriptionQuestion(article, others) {
  const correct = article.description?.trim();
  if (!correct || correct.length < 8) return null;

  const distractors = others
    .map(a => a.description?.trim())
    .filter(d => d && d.length >= 8 && d !== correct);

  if (distractors.length < 2) return null;

  const { options, answer } = makeOptions(correct, distractors);
  return {
    question: `Which of the following best describes "${article.title}"?`,
    options,
    answer,
    explanation: article.extract?.slice(0, 300) || correct,
    source: article.title,
  };
}

/**
 * Type 2 — Reverse lookup
 * "Which topic matches this description: '...'?"
 * Correct answer = article.title
 * Distractors = other article titles from the trail
 */
function reverseLookupQuestion(article, others) {
  const desc = article.description?.trim();
  if (!desc || desc.length < 8) return null;
  if (others.length < 2) return null;

  const distractors = shuffle(others).slice(0, 3).map(a => a.title);
  const { options, answer } = makeOptions(article.title, distractors);
  return {
    question: `Which topic is described as: "${desc}"?`,
    options,
    answer,
    explanation: article.extract?.slice(0, 300) || desc,
    source: article.title,
  };
}

/**
 * Type 3 — Year fill-in
 * Finds a sentence containing a 4-digit year and blanks it out.
 * Generates plausible year distractors (+/- a few years).
 */
function yearQuestion(article) {
  for (const s of sentences(article.extract)) {
    const m = s.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    if (!m) continue;

    const year = parseInt(m[1], 10);
    const blanked = s.replace(m[0], '______');

    const offsets = shuffle([2, 5, 8, 12, 17, 23, 31]);
    const signs = [1, -1, 1, -1];
    const distractors = offsets.slice(0, 3).map((d, i) =>
      String(year + d * signs[i])
    );

    const { options, answer } = makeOptions(String(year), distractors);
    return {
      question: `Complete the sentence: "${blanked}"`,
      options,
      answer,
      explanation: `Full sentence: "${s}"`,
      source: article.title,
    };
  }
  return null;
}

/**
 * Type 4 — Number fill-in (fallback when no year found)
 * Finds a sentence with a notable standalone number (30+) and blanks it out.
 */
function numberQuestion(article) {
  for (const s of sentences(article.extract)) {
    // Match numbers 30+ that aren't years (already handled above)
    const m = s.match(/\b([3-9][0-9]|[1-9][0-9]{2,4})\b(?!\s*(?:AD|BC|CE|BCE|\s*s\b))/);
    if (!m) continue;

    const num = parseFloat(m[1]);
    const blanked = s.replace(m[0], '______');

    const distractors = shuffle([
      String(Math.round(num * 1.7)),
      String(Math.round(num * 0.45)),
      String(Math.round(num * 2.8)),
    ]);

    const { options, answer } = makeOptions(m[1], distractors);
    return {
      question: `Complete the sentence: "${blanked}"`,
      options,
      answer,
      explanation: `Full sentence: "${s}"`,
      source: article.title,
    };
  }
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate up to 8 quiz cards from an array of Wikipedia articles.
 * Same return shape as /api/quiz so callers need no changes.
 *
 * @param {Array<{title, description, extract}>} articles
 * @returns {Array<{question, options, answer, explanation, source}>}
 */
export function generateQuizCardsLocally(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  const cards = [];

  for (const article of articles) {
    const others = articles.filter(a => a.title !== article.title);

    // Description match (needs at least 1 other article with a description)
    const q1 = descriptionQuestion(article, others);
    if (q1) cards.push(q1);

    // Reverse lookup (needs at least 2 other articles)
    if (others.length >= 2) {
      const q2 = reverseLookupQuestion(article, others);
      if (q2) cards.push(q2);
    }

    // Year or number fill-in from the extract
    const q3 = yearQuestion(article) || numberQuestion(article);
    if (q3) cards.push(q3);
  }

  return shuffle(cards).slice(0, 8);
}
