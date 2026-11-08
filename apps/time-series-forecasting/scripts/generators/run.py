"""Unified data generator runner for Time Series Forecasting course demos.

Usage:
    python scripts/generators/run.py <topic_number | all | incident> [--validate]

Examples:
    python scripts/generators/run.py 5
    python scripts/generators/run.py 5 --validate
    python scripts/generators/run.py all
    python scripts/generators/run.py incident
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEMO_ROOT = SCRIPT_DIR.parents[1]
PUBLIC_DIR = DEMO_ROOT / "public"
VALIDATE_SCRIPT = DEMO_ROOT / ".agents" / "skills" / "forecast-data-integrity" / "scripts" / "validate_forecast.py"

TOPIC_SCRIPTS = {
    1: SCRIPT_DIR / "generate_topic1_data.py",
    2: SCRIPT_DIR / "generate_topic2_data.py",
    3: SCRIPT_DIR / "generate_topic3_data.py",
    4: SCRIPT_DIR / "generate_topic4_data.py",
    5: SCRIPT_DIR / "generate_topic5_data.py",
}

EXTRA_SCRIPTS = {
    "incident": SCRIPT_DIR / "generate_incident_plots.py",
}


def run_script(script_path: Path, validate: bool = False, topic_num: int = None) -> bool:
    if not script_path.exists():
        print(f"[ERROR] Generator script not found: {script_path}")
        return False

    name = script_path.name
    print(f"\n{'='*70}")
    print(f"--> Running {name}...")
    print(f"{'='*70}")

    start_time = time.time()
    result = subprocess.run([sys.executable, str(script_path)], cwd=str(DEMO_ROOT))
    elapsed = time.time() - start_time

    if result.returncode != 0:
        print(f"[FAIL] {name} exited with code {result.returncode} ({elapsed:.1f}s)")
        return False

    print(f"[OK] {name} completed successfully in {elapsed:.1f}s")

    if validate and topic_num is not None:
        json_file = PUBLIC_DIR / f"topic{topic_num}_data.json"
        if json_file.exists() and VALIDATE_SCRIPT.exists():
            print(f"\n--> Validating forecast integrity for Topic {topic_num}...")
            val_result = subprocess.run(
                [sys.executable, str(VALIDATE_SCRIPT), str(script_path), str(json_file)],
                cwd=str(DEMO_ROOT),
            )
            if val_result.returncode != 0:
                print(f"[WARN] Validation reported issues for {json_file.name}")
                return False
            print(f"[OK] Forecast integrity verified.")

    return True


def main():
    parser = argparse.ArgumentParser(description="Run dataset generators for the time series dashboard.")
    parser.add_argument(
        "target",
        nargs="?",
        default="all",
        help="Topic number (1-5), 'all' to run all topics, or 'incident' for audit plots.",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run forecast-data-integrity validation script on generated output.",
    )
    parser.add_argument(
        "--all",
        dest="run_all",
        action="store_true",
        help="Run all topic generators in sequence.",
    )

    args = parser.parse_args()

    if args.run_all or args.target.lower() == "all":
        print(f"Starting complete dataset generation for Topics 1 through {max(TOPIC_SCRIPTS.keys())}...")
        total_start = time.time()
        successes = 0
        failures = 0

        for num in sorted(TOPIC_SCRIPTS.keys()):
            ok = run_script(TOPIC_SCRIPTS[num], validate=args.validate, topic_num=num)
            if ok:
                successes += 1
            else:
                failures += 1
                break

        total_elapsed = time.time() - total_start
        print(f"\n{'='*70}")
        print(f"Finished: {successes} passed, {failures} failed ({total_elapsed:.1f}s total)")
        print(f"{'='*70}")
        sys.exit(0 if failures == 0 else 1)

    target_str = args.target.lower()

    if target_str in EXTRA_SCRIPTS:
        ok = run_script(EXTRA_SCRIPTS[target_str])
        sys.exit(0 if ok else 1)

    try:
        topic_num = int(target_str)
    except ValueError:
        print(f"[ERROR] Invalid topic argument '{args.target}'. Expected 1-5, 'all', or 'incident'.")
        sys.exit(1)

    if topic_num not in TOPIC_SCRIPTS:
        print(f"[ERROR] Topic {topic_num} not recognized. Available topics: {list(TOPIC_SCRIPTS.keys())}")
        sys.exit(1)

    ok = run_script(TOPIC_SCRIPTS[topic_num], validate=args.validate, topic_num=topic_num)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

