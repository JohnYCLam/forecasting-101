"""Static honesty check for scripts/generators/generate_topic*_data.py and public/topic*_data.json.

Usage (from ts-forecasting-demo/):
    python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py [files...] [--max-kb 1024] [--require-keys tab1.actual,tab1.forecast]

Checks: faking patterns from INCIDENT_REPORT_FORECAST_AUDIT.md (py + json), model-fitting present, seeded,
NaN/Infinity in JSON (breaks the browser), optional size budget, optional required keys.
Exit code 0 = PASS, 1 = FAIL. Heuristic: a pass does not prove correctness.
"""
import argparse
import ast
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3].parent  # ts-forecasting-demo/
FORECAST_NAME = re.compile(r"(forecast|fcst|pred|var_fc|yhat)", re.I)
ACTUAL_NAME = re.compile(r"(actual|truth|true|target|d_star|test_y|y_test)", re.I)
MODEL_CALLS = {"forecast", "get_forecast", "predict", "forecast_interval", "simulate",
               "fit", "get_prediction", "fittedvalues", "dot", "matmul",
               "predict_proba", "make_future_dataframe", "generate", "forward", "eval"}

problems = []
warnings = []


def names_in(node):
    return {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}


def calls_in(node):
    out = set()
    for n in ast.walk(node):
        if isinstance(n, ast.Call):
            f = n.func
            if isinstance(f, ast.Attribute):
                out.add(f.attr)
            elif isinstance(f, ast.Name):
                out.add(f.id)
        if isinstance(n, ast.Attribute):
            out.add(n.attr)
        if isinstance(n, ast.BinOp) and isinstance(n.op, ast.MatMult):
            out.add("matmul")
    return out


def check_py(path: Path):
    src = path.read_text(encoding="utf-8", errors="replace")
    tree = ast.parse(src)
    for node in ast.walk(tree):
        targets, value = [], None
        if isinstance(node, ast.Assign):
            targets, value = node.targets, node.value
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            targets, value = [node.target], node.value
        if value is None:
            continue
        for t in targets:
            if not isinstance(t, ast.Name) or not FORECAST_NAME.search(t.id):
                continue
            if ACTUAL_NAME.search(t.id):
                continue
            # pattern: forecast_x = <actual-ish name> (+|-|*|/) <number>
            if isinstance(value, ast.BinOp) and isinstance(value.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
                used = names_in(value)
                has_const = any(isinstance(n, ast.Constant) and isinstance(n.value, (int, float))
                                for n in ast.walk(value))
                if any(ACTUAL_NAME.search(u) for u in used) and has_const and not (calls_in(value) & MODEL_CALLS):
                    problems.append(
                        f"{path.name}:{node.lineno}: '{t.id}' looks derived from an actual/target series "
                        f"plus a constant (no model call). This is the faking pattern from the incident report."
                    )
    # Each generator must really fit something
    if not re.search(r"(statsmodels|\bVAR\b|ARIMA|OLS|np\.linalg|lstsq|arch_model|ExponentialSmoothing|Holt"
                     r"|sklearn|lightgbm|xgboost|catboost|prophet|torch|tensorflow|keras|chronos|timesfm|transformers)", src):
        problems.append(f"{path.name}: no model fitting library/call found.")
    if "np.random.seed" not in src and "default_rng" not in src:
        problems.append(f"{path.name}: no random seed found (output must be deterministic).")
    # Literal forecast arrays
    for m in re.finditer(r"(forecast|pred)\w*\s*=\s*\[\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,", src, re.I):
        line = src.count("\n", 0, m.start()) + 1
        problems.append(f"{path.name}:{line}: literal numeric list assigned to a forecast variable.")


def walk_json(obj, path, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            walk_json(v, path + [k], out)
        out.append((path, obj))
    elif isinstance(obj, list):
        for i, v in enumerate(obj[:1]):
            walk_json(v, path + [i], out)


def check_json(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    nodes = []
    walk_json(data, [], nodes)
    for p, d in nodes:
        keys = list(d.keys())
        pairs = [(a, b) for a in keys for b in keys
                 if ACTUAL_NAME.fullmatch(a) and FORECAST_NAME.search(b) and a != b]
        for a, b in pairs:
            va, vb = d[a], d[b]
            if not (isinstance(va, list) and isinstance(vb, list) and len(va) == len(vb) and len(va) >= 4):
                continue
            if not all(isinstance(x, (int, float)) for x in va + vb):
                continue
            diffs = [round(y - x, 6) for x, y in zip(va, vb)]
            if len(set(diffs)) == 1:
                problems.append(f"{path.name}:{'/'.join(map(str, p))}: '{b}' equals '{a}' plus constant {diffs[0]}.")
            if all(x == y for x, y in zip(va, vb)):
                problems.append(f"{path.name}:{'/'.join(map(str, p))}: '{b}' is identical to '{a}'.")


def iter_numbers(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from iter_numbers(v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from iter_numbers(v, f"{path}[{i}]")
    elif isinstance(obj, float):
        yield path, obj


def check_json_health(path: Path, max_kb):
    """Non-finite numbers break fetch().json() in the browser; size is a load-time budget."""
    text = path.read_text(encoding="utf-8")
    if re.search(r"(?<![\w\"])(NaN|-?Infinity)(?![\w\"])", text):
        problems.append(f"{path.name}: contains NaN/Infinity literal. Browsers fail to parse this JSON. "
                        "Replace with null (for example df.replace([np.inf, -np.inf], np.nan) then None).")
    data = json.loads(text)
    bad = [p for p, v in iter_numbers(data) if v != v or v in (float("inf"), float("-inf"))]
    if bad:
        problems.append(f"{path.name}: {len(bad)} non-finite number(s), first at {bad[0]}.")
    kb = len(text.encode("utf-8")) / 1024
    if max_kb and kb > max_kb:
        problems.append(f"{path.name}: {kb:.0f} KB exceeds budget of {max_kb} KB. Round floats, downsample, drop unused keys.")
    elif kb > 1024:
        warnings.append(f"{path.name}: {kb:.0f} KB (target for NEW topics is under 1024 KB).")


def check_required_keys(path: Path, keys):
    data = json.loads(path.read_text(encoding="utf-8"))
    for dotted in keys:
        cur = data
        for part in dotted.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                problems.append(f"{path.name}: required key '{dotted}' is missing (stopped at '{part}').")
                break
        else:
            if cur in (None, [], {}, ""):
                problems.append(f"{path.name}: required key '{dotted}' is empty.")


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--max-kb", type=int, default=0, help="fail if a JSON file is larger (use 1024 for new topics)")
    ap.add_argument("--require-keys", default="", help="comma list of dotted keys that must exist and be non-empty, e.g. tab1.actual,tab1.forecast (applies to the JSON files checked)")
    args = ap.parse_args(argv)
    files = [Path(a) for a in args.files] or sorted((ROOT / "scripts" / "generators").glob("generate_topic*_data.py")) + sorted((ROOT / "public").glob("topic*_data.json"))
    keys = [k.strip() for k in args.require_keys.split(",") if k.strip()]
    for f in files:
        if f.suffix == ".py":
            check_py(f)
        elif f.suffix == ".json":
            check_json(f)
            check_json_health(f, args.max_kb)
            if keys:
                check_required_keys(f, keys)
    print(f"Checked {len(files)} file(s).")
    for w in warnings:
        print("  WARN:", w)
    for p in problems:
        print("  PROBLEM:", p)
    print("RESULT:", "FAIL" if problems else "PASS")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
