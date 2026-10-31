---
name: notebook-to-demo
description: Port logic, parameters and expected numbers from a reference notebook (../references/*.ipynb) into a generate_topicN_data.py function and cross-check the result. Use when a plan says "use the example from notebook X".
disable-model-invocation: true
---

# notebook-to-demo

## When to use
A plan or task references a notebook such as `Time_Series_Analysis_101.ipynb` (VARIMA), `_103`, `_104`.

## Steps
1. Use the extractor script. Never open the raw .ipynb (huge, contains images):
   - list cells: `python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb`
   - find cells: `python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb --find VAR`
   - print cells with text outputs: `python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb 30 34`
   Read only the cells you need. Do not write extracted files into the repo.
2. Write down for the target cell: data source, seed, train/test split, model, order, key outputs.
3. Reimplement in a `gen_*` function following `forecast-data-integrity`. Same seed, split, order.
4. Run the script. Compare 2 or 3 key numbers (coefficients, AIC, RMSE) to the printed outputs in the cell's `--- output ---` section.
5. Record both values in your report. If they differ by more than about 5%, investigate (library versions, seed, split) before continuing.

## Do not
- Do not copy results from the notebook output into the JSON.
- Do not change the notebook.
- Do not create extracted files in the repo.

## Done when
The gen function runs, key numbers are compared, and the comparison is in the report.
