# Stochastic calculus — core introduction

Sections 1–9 are published on main. They progress from coin walks and Brownian motion through Itô and Stratonovich calculus, jump models, and learning dynamics from observed paths. Eighteen browser experiments support these chapters.

Based on and adapted from [Introduction to Stochastic Calculus by Ji-Ha Kim](https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See ATTRIBUTION.md for the author credit and adaptation changes.

Run npm test and npm run build from this app, or use the root commands for the combined site. The build also produces a standalone dist/preview.html. Nine attributed Python/TikZ companion examples remain downloadable.

Sections 10–12 and their references are maintained on development/calculus-sections-6-plus. Local review notes are ignored under the repository-root research-local/ folder.

## Ask this course

The bottom-right chat button finds a published section or experiment and shows an excerpt. Each question searches independently. Messages live in the current page, including across chapter navigation, and disappear on refresh.

Opening the panel loads the course index. On first use, the browser worker downloads the INT8 MiniLM model (23 MB) directly from Hugging Face and its WebAssembly runtime (about 22 MB) from the version-pinned Transformers.js distribution on jsDelivr. Subsequent visits can reuse the browser cache. Questions are processed on the device. Keyword search works while those assets load, when a download fails, and in the standalone preview.

After editing lessons or search topic labels, run `npm run search:index` in this app. Include the regenerated passage catalog, model manifest and Float32 vectors from `src/search/generated/` with the lesson changes. A normal build checks their freshness. `npm run search:evaluate` compares BM25, semantic and hybrid retrieval against the labeled course questions. Append `-- --verbose` to inspect individual destinations.

The encoder uses mean pooling and normalization with the same pinned model and tokenizer for indexing and browser queries. The browser and the two search maintenance commands load the weights and tokenizer from [Xenova/all-MiniLM-L6-v2 at revision 751bff3](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9). The index builder uses the CPU runtime and the library’s local model cache. Normal builds verify the precomputed index without downloading weights. The dev and build commands copy only the JavaScript library from the locked npm package.
