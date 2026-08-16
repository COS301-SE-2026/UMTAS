# this file hooks into the locust stats and exports it without having to go to the web ui 
import csv
import json
from datetime import datetime
from pathlib import Path

class ReportGen:
    def __init__(self, adapter_dir: str, adapter_name: str, pop: int):
        self.adapter_dir = adapter_dir
        self.adapter_name = adapter_name
        self.pop = pop
        self.timestamp = datetime.now().isoformat(timespec="seconds").replace(":", "-")

    def generate_report(self, csv_pre: str ="locust_run"):
        """
        1. Reads raw CSV data from locust 
        2. Packages them into a single JSON file 
        """

        stats_path = Path(self.adapter_dir) / f"{csv_pre}.csv"
        failures_path = Path(self.adapter_dir) / f"{csv_pre}_failures.csv"
        report ={"metadata": {"adapter_name": self.adapter_name, "population": self.pop, "timestamp": self.timestamp},"summary": {},"endpoints": [],    "failures": []}

        if stats_path.exists():
            with open(stats_path, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row["Name"] == "Aggregated":
                        report["summary"] = {
                    #  need to fill in with stats from locust
                        }
                    else:
                        report["endpoints"].append({

                        
                        })
        else:
            print(f"Stats file {stats_path} does not exist. Skipping stats report generation.")


        if failures_path.exists():
            with open(failures_path, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    report["failures"].append({
                 #   need to fill in with failure data from locust
                 # TODO: if anyone sees this please tell me that im being an idiot and forgot to fill in the failure data from locust :(
                    })        


        safe_time = self.timestamp.replace(":", "-")
        report_path = Path(self.adapter_dir) / f"{self.adapter_name}_report_{safe_time}.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        print(f"Report generated at {report_path}")

        if stats_path.exists():
            stats_path.unlink()
        if failures_path.exists():
            failures_path.unlink()

        history_p = Path(self.adapter_dir) / f"{csv_pre}_stats_history.csv"
        exceptions_p = Path(self.adapter_dir) / f"{csv_pre}_exceptions.csv"

        if history_p.exists():
            history_p.unlink()
        if exceptions_p.exists():
            exceptions_p.unlink()