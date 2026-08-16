import json
import yaml
import os
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="OpenAPI Bootstrap")
    parser.add_argument("--spec", required=True, help="Path to the OpenAPI specification file")
    parser.add_argument("--adapter", required=True, help="adapter name")
    args = parser.parse_args()

    spec_path = Path(args.spec)
    core = Path(__file__).resolve().parent
    adapter_ = core.parent / "adapters" / args.adapter

    adapter_.mkdir(parents=True, exist_ok=True)

    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f) if spec_path.suffix == ".json" else yaml.safe_load(f)

    servers = spec.get("servers", [])
    base = servers[0].get("url") if servers and isinstance(servers[0], dict) else "http://localhost:3000"

    endpoints = {
        "base_url": base,
        "auth": {
            "type": "bearer",
            "token_env_var": "SIMULATION_SERVICE_API_TOKEN"
        }
    }
    
    with open(adapter_ / "endpoints.yaml", 'w', encoding='utf-8') as f:
        yaml.dump(endpoints, f, sort_keys=False)

    schemas = spec.get("components", {}).get("schemas", {})
    profile_fields = {}

    for schema_name, schema_details in schemas.items():
        if schema_details.get("type") == "object":
            properties = schema_details.get("properties", {})
            for prop_name, prop_details in properties.items():
                prop_type = prop_details.get("type", "string")
                
                if prop_name not in profile_fields:
                    if prop_type == "string":
                        profile_fields[prop_name] = {"type": "fake", "provider": "word"}
                    elif prop_type == "integer" or prop_type == "number":
                        profile_fields[prop_name] = {"type": "fake", "provider": "random_number"}
                    elif prop_type == "array":
                        profile_fields[prop_name] = {"type": "sample", "from": f"{prop_name}_list.csv", "count": 3}
                    elif prop_type == "boolean":
                        profile_fields[prop_name] = {"type": "choice", "values": [True, False], "weights": [0.5, 0.5]}

    schema_config = {"fields": profile_fields}
    with open(adapter_ / "profile_schema.yaml", 'w', encoding='utf-8') as f:
        yaml.dump(schema_config, f, sort_keys=False)

    locust_code = [
        "import os",
        "import json",
        "from locust import HttpUser, task, between",
        "",
        "class DomainUser(HttpUser):",
        "    wait_time = between(1, 3)",
        "",
        "    def on_start(self):",
        "        profiles_path = os.environ.get('PROFILES_PATH')",
        "        if profiles_path and os.path.exists(profiles_path):",
        "            with open(profiles_path, 'r', encoding='utf-8') as f:",
        "                self.profiles = json.load(f)",
        "        else:",
        "            self.profiles = []",
        "        self.profile_index = 0",
        "",
        "    def get_next_profile(self):",
        "        if not self.profiles:",
        "            return {}",
        "        p = self.profiles[self.profile_index % len(self.profiles)]",
        "        self.profile_index += 1",
        "        return p",
        ""
    ]

    paths = spec.get("paths", {})
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.lower() not in ['get', 'post', 'put', 'delete']:
                continue
            
            safe_path = path.replace('/', '_').replace('{', '').replace('}', '')
            func_name = details.get("operationId", f"{method}{safe_path}")
            func_name = func_name.replace('-', '_')
            
            locust_code.append(f"    @task")
            locust_code.append(f"    def {func_name}(self):")
            locust_code.append(f"        profile = self.get_next_profile()")
            
            if method.lower() in ['post', 'put', 'patch']:
                locust_code.append(f"        # TODO: Improve payloads")
                locust_code.append(f"        payload = profile")
                locust_code.append(f"        self.client.{method.lower()}('{path}', json=payload)")
            else:
                locust_code.append(f"        self.client.{method.lower()}('{path}')")
            locust_code.append("")

    with open(adapter_ / "locust_user.py", 'w', encoding='utf-8') as f:
        f.write("\n".join(locust_code))

    print(f"Successfully bootstrapped '{args.adapter}' adapter from OpenAPI spec.")
    print(f"Files generated in: {adapter_.resolve()}")

if __name__ == '__main__':
    main()