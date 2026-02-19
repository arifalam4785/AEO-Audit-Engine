// ─────────────────────────────────────────────────────────────────────────────
// Citation Analyzer Service
//
// Takes stored LLM responses and a company name/URL, then:
// 1. Checks if the company is mentioned in each response
// 2. Finds its rank if it appears in a numbered list (e.g., "#3")
// 3. Counts total mentions
// 4. Finds first mention position (which paragraph/section)
//
// Handles variants: "sirion.ai" also checks "sirion"
//                   "HubSpot CRM" also checks "hubspot"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all search variants from a company name/URL.
 *
 * Examples:
 *   "sirion.ai"    → ["sirion.ai", "sirion"]
 *   "Icertis"      → ["icertis"]
 *   "HubSpot CRM"  → ["hubspot crm", "hubspot"]
 *   "www.docusign.com" → ["www.docusign.com", "docusign.com", "docusign"]
 */
function getSearchVariants(companyInput) {
  const raw = companyInput.trim().toLowerCase();
  const variants = new Set();

  // Add full input
  variants.add(raw);

  // Strip common TLDs for domain-style inputs
  const tldPattern =
    /\.(com|ai|io|co|net|org|dev|app|xyz|tech|cloud|software|us|uk|in)$/i;
  const stripped = raw.replace(tldPattern, '');
  if (stripped !== raw) {
    variants.add(stripped);
  }

  // Strip "www." prefix
  const noWww = raw.replace(/^www\./, '');
  if (noWww !== raw) {
    variants.add(noWww);
    const noWwwStripped = noWww.replace(tldPattern, '');
    if (noWwwStripped !== noWww) {
      variants.add(noWwwStripped);
    }
  }

  // For multi-word names, also try the first word (brand name)
  const words = stripped.split(/[\s\-_]+/);
  if (words.length > 1 && words[0].length >= 3) {
    variants.add(words[0]);
  }

  return [...variants].filter((v) => v.length >= 2);
}

/**
 * Find rank in numbered lists within the response text.
 *
 * Handles these formats:
 *   1. Company Name       →  rank 1
 *   1) Company Name       →  rank 1
 *   **1. Company Name**   →  rank 1
 *   #1 Company Name       →  rank 1
 *   - **3. Company**      →  rank 3
 */
function findNumberedRank(text, variants) {
  const lines = text.split('\n');

  for (const line of lines) {
    const lineL = line.toLowerCase();

    // Check if any variant appears in this line
    const hasVariant = variants.some((v) => lineL.includes(v));
    if (!hasVariant) continue;

    // Try various numbered list patterns
    const patterns = [
      /^\s*[\*\-]*\s*\**(\d{1,2})[.):\-\s]/, // "1. " or "**1. " or "- 1. "
      /^\s*#(\d{1,2})\b/, // "#1"
      /^\s*\[?(\d{1,2})\]?\s*[.):\-]/, // "[1]" or "1:"
      /^\s*[\*\-]+\s*\**(\d{1,2})\**/, // "- **1**"
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const rank = parseInt(match[1]);
        if (rank >= 1 && rank <= 50) {
          return rank;
        }
      }
    }
  }

  return null;
}

/**
 * Find which paragraph/section the company first appears in.
 * Returns 1-based position.
 */
function findMentionPosition(text, variants) {
  // Split by double newlines (paragraphs)
  const sections = text
    .split(/\n\s*\n/)
    .filter((s) => s.trim().length > 0);

  for (let i = 0; i < sections.length; i++) {
    const sectionL = sections[i].toLowerCase();
    for (const v of variants) {
      if (sectionL.includes(v)) {
        return i + 1;
      }
    }
  }

  // Fallback: line-based search
  const lines = text.split('\n').filter((l) => l.trim().length > 5);
  for (let i = 0; i < lines.length; i++) {
    const lineL = lines[i].toLowerCase();
    for (const v of variants) {
      if (lineL.includes(v)) {
        return i + 1;
      }
    }
  }

  return null;
}

/**
 * Count how many times the company is mentioned in the text.
 */
function countMentions(text, variants) {
  const textL = text.toLowerCase();
  let count = 0;

  for (const v of variants) {
    let idx = 0;
    while (true) {
      idx = textL.indexOf(v, idx);
      if (idx === -1) break;
      count++;
      idx += v.length;
    }
  }

  return count;
}

// ─── Main Analysis Functions ─────────────────────────────────────────────────

/**
 * Analyze a single LLM response for company citation.
 *
 * @param {string} responseText - The full LLM answer
 * @param {string} companyInput - Company name or URL to search for
 * @returns {{ cited: boolean, rank: number|null, mentions: number, position: number|null }}
 */
export function analyzeCitation(responseText, companyInput) {
  if (!responseText || !companyInput) {
    return { cited: false, rank: null, mentions: 0, position: null };
  }

  const variants = getSearchVariants(companyInput);
  const textL = responseText.toLowerCase();

  // Check if any variant is mentioned
  const isCited = variants.some((v) => textL.includes(v));

  if (!isCited) {
    return { cited: false, rank: null, mentions: 0, position: null };
  }

  return {
    cited: true,
    rank: findNumberedRank(responseText, variants),
    mentions: countMentions(responseText, variants),
    position: findMentionPosition(responseText, variants),
  };
}

/**
 * Analyze ALL responses for a complete audit session.
 * Groups responses by question, then checks each platform's answer.
 *
 * @param {Array} responses - All Response documents from MongoDB
 * @param {string} companyInput - Target company name/URL
 * @returns {Array} Array of analyzed rows, one per question
 */
export function analyzeFullAudit(responses, companyInput) {
  // Group responses by questionIndex
  const grouped = {};

  for (const rec of responses) {
    if (!grouped[rec.questionIndex]) {
      grouped[rec.questionIndex] = {
        questionIndex: rec.questionIndex,
        question: rec.question,
        responses: {},
      };
    }
    grouped[rec.questionIndex].responses[rec.platform] = rec.answer;
  }

  // Analyze each group and return sorted results
  return Object.values(grouped)
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .map((group) => ({
      questionIndex: group.questionIndex,
      question: group.question,
      platforms: {
        claude: {
          answer: group.responses.claude || '',
          analysis: analyzeCitation(
            group.responses.claude || '',
            companyInput
          ),
        },
        chatgpt: {
          answer: group.responses.chatgpt || '',
          analysis: analyzeCitation(
            group.responses.chatgpt || '',
            companyInput
          ),
        },
        gemini: {
          answer: group.responses.gemini || '',
          analysis: analyzeCitation(
            group.responses.gemini || '',
            companyInput
          ),
        },
      },
    }));
}

/**
 * Generate summary statistics from analyzed results.
 * Returns per-platform stats: citation count, %, avg rank, total mentions.
 *
 * @param {Array} analyzedRows - Output from analyzeFullAudit()
 * @returns {Object} { claude: {...stats}, chatgpt: {...stats}, gemini: {...stats} }
 */
export function generateSummary(analyzedRows) {
  const platformKeys = ['claude', 'chatgpt', 'gemini'];
  const summary = {};

  for (const pKey of platformKeys) {
    const results = analyzedRows.map((r) => r.platforms[pKey].analysis);
    const cited = results.filter((r) => r.cited);
    const ranked = cited.filter((r) => r.rank != null);

    const avgRank =
      ranked.length > 0
        ? ranked.reduce((sum, r) => sum + r.rank, 0) / ranked.length
        : null;

    const totalMentions = cited.reduce((sum, r) => sum + r.mentions, 0);

    summary[pKey] = {
      totalQuestions: results.length,
      citedCount: cited.length,
      citedPercent:
        results.length > 0 ? (cited.length / results.length) * 100 : 0,
      avgRank,
      totalMentions,
      rankedCount: ranked.length,
    };
  }

  return summary;
}