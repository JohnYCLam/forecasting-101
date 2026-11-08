"""Print code cells (and their text outputs) of a notebook, without images or huge payloads.

Usage (from ts-forecasting-demo/):
    python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb            # list cells (index + first line)
    python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb 30 34      # print cells 30..34 with outputs
    python .agents/skills/notebook-to-demo/scripts/extract_notebook.py ../references/<name>.ipynb --find VAR # cells containing text
"""
import json
import sys

MAX_OUT = 1500  # characters of output per cell


def cell_text(c):
    return "".join(c.get("source", []))


def cell_outputs(c):
    out = []
    for o in c.get("outputs", []):
        if "text" in o:
            out.append("".join(o["text"]))
        elif "data" in o and "text/plain" in o["data"]:
            out.append("".join(o["data"]["text/plain"]))
        elif o.get("output_type") == "error":
            out.append("ERROR: " + o.get("ename", "") + " " + o.get("evalue", ""))
    s = "\n".join(out)
    return s[:MAX_OUT] + ("\n...[truncated]" if len(s) > MAX_OUT else "")


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    nb = json.load(open(argv[0], encoding="utf-8"))
    cells = nb["cells"]
    rest = argv[1:]
    if not rest:
        for i, c in enumerate(cells):
            first = (cell_text(c).strip().splitlines() or [""])[0][:90]
            print(f"[{i:3d}] {c['cell_type']:8s} {first}")
        return 0
    if rest[0] == "--find":
        needle = rest[1].lower()
        for i, c in enumerate(cells):
            if needle in cell_text(c).lower():
                print(f"[{i}] {c['cell_type']}: {(cell_text(c).strip().splitlines() or [''])[0][:90]}")
        return 0
    lo = int(rest[0])
    hi = int(rest[1]) if len(rest) > 1 else lo
    for i in range(lo, min(hi, len(cells) - 1) + 1):
        c = cells[i]
        print(f"\n### CELL {i} ({c['cell_type']})")
        print(cell_text(c))
        if c["cell_type"] == "code":
            o = cell_outputs(c)
            if o:
                print("--- output ---")
                print(o)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
