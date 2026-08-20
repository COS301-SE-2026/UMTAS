# this is the entry point
# reads command line arguments -> generate required population -> loads endpoints and locust users -> launches locust and handles the generated profiles 
import argparse
from encodings.punycode import adapt
import subprocess
import sys
import os
from pathlib import Path
CORE_DIR = Path(__file__).resolve().parent
if str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

from profile_engine import ProfileEngine
from report import ReportGen


def main():
    parser = argparse.ArgumentParser(description="SIMILATION SERVICE")
    parser.add_argument("--adapter", required=True, help="Name of the adapter directory for example umtas or openai")
    parser.add_argument("--population", type=int, default=1000, help="Number of profiles to generate")
    
    parser.add_argument("--locust-file", default="locust_user.py", help="name of locust file to run")
    
    args, locust_args = parser.parse_known_args()


    main_dir = Path(__file__).parent
    base = main_dir.parent
    adapt = base / "adapters" / args.adapter

    schema_path = adapt / "profile_schema.yaml"
    locust_file = adapt / args.locust_file
    profiles_out = adapt / "profiles.json"

    if not adapt.exists():
        print(f"Error: Adapter '{args.adapter}' not found at {adapt}")
        sys.exit(1)
    if not schema_path.exists():
        print(f"Error: Schema not found at {schema_path}")
        sys.exit(1)
    if not locust_file.exists():
        print(f"Error: Locust user script not found at {locust_file}")
        sys.exit(1)


  
    print(f"Generating {args.population} synthetic profiles for '{args.adapter}'...")
    try:
        engine = ProfileEngine(
            schema_path=str(schema_path), 
            adapter_dir=str(adapt)
        )
        engine.export_to_json(args.population, str(profiles_out))
    except Exception as e:
        print(f"Failed to generate profiles: {e}")
        sys.exit(1)

    print(f"Launching Locust simulation engine...")
    
   
    env = os.environ.copy()
    env["PROFILES_PATH"] = str(profiles_out)
    file_prefix = args.locust_file.replace('.py', '')
    csv_pre = str(adapt / f"{file_prefix}_run")

    cmd = ["locust", "-f", str(locust_file), f"--csv={csv_pre}"] + locust_args

    try:
        subprocess.run(cmd, env=env, check=True)
    except KeyboardInterrupt:
        print("\n Simulation stopped by operator.")
    except subprocess.CalledProcessError as e:
        print(f"Locust exited with error code {e.returncode}")

    reporter = ReportGen(
        adapter_dir=str(adapt),
        adapter_name=args.adapter,
        pop=args.population
    )
    reporter.generate_report(csv_pre=f"{file_prefix}_run")



if __name__ == "__main__":
    main()