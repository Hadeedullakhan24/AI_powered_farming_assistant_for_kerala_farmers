"""
Generate Final Dataset Report

Author: Yamuna KN
"""

from pathlib import Path
import json

# =======================================================

PROJECT_ROOT = Path(__file__).resolve().parents[4]

REPORTS = PROJECT_ROOT / "backend" / "models" / "disease" / "reports"

OUTPUT = REPORTS / "preprocessing_summary.txt"

# =======================================================

files = [
    "cleaning_report.json",
    "dataset_statistics.json",
    "duplicate_report.json"
]

with open(OUTPUT, "w", encoding="utf-8") as report:

    report.write("=" * 60 + "\n")
    report.write("AI Powered Farming Assistant\n")
    report.write("Dataset Preprocessing Summary\n")
    report.write("=" * 60 + "\n\n")

    for file in files:

        report.write(f"{file}\n")
        report.write("-" * len(file) + "\n")

        path = REPORTS / file

        if path.exists():

            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            report.write(json.dumps(data, indent=4))

        else:

            report.write("File Not Found")

        report.write("\n\n")

print("=" * 60)
print("Preprocessing Report Generated Successfully")
print("=" * 60)
print(OUTPUT)