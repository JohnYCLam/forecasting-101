export function distinctSections(hits, passages, limit = 10) {
  const seen = new Set(), result = [];
  for (const hit of hits) {
    const href = passages[hit.i].href;
    if (seen.has(href)) continue;
    seen.add(href);
    result.push(hit);
    if (result.length === limit) break;
  }
  return result;
}

export function rankVectors(vector, matrix) {
  const ranked = [];
  for (let offset = 0; offset < matrix.length; offset += vector.length) {
    let score = 0;
    for (let j = 0; j < vector.length; j++) score += matrix[offset+j] * vector[j];
    ranked.push({i:offset/vector.length, score});
  }
  return ranked.sort((a,b) => b.score - a.score);
}

export function results(passages, lexical, semantic = []) {
  // Raw evidence gates exclude weak hits before rank fusion.
  const wordCutoff = Math.max(3, (lexical[0]?.score ?? 0) * 0.62);
  const meaningCutoff = Math.max(0.36, (semantic[0]?.score ?? 0) - 0.10);
  const lists = [lexical.filter(h => h.score >= wordCutoff), semantic.filter(h => h.score >= meaningCutoff)];
  const combined = new Map();
  for (const list of lists) {
    distinctSections(list, passages).forEach(({i},rank) => {
      const href = passages[i].href;
      const hit = combined.get(href) ?? {passage:passages[i], score:0, bestRank:Infinity};
      hit.score += 1 / (61 + rank);
      if (rank < hit.bestRank) {
        hit.passage = passages[i];
        hit.bestRank = rank;
      }
      combined.set(href,hit);
    });
  }
  return [...combined.values()].sort((a,b) => b.score - a.score).slice(0,3).map(hit => hit.passage);
}
