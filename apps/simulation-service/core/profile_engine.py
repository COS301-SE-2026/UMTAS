# core/profile_engine.py
# this file is responsible for creating the fake users, it reads profile_schema.yml and creates the random fake data based on the schema defined in the file. It uses the Faker library to generate realistic data for various fields such as names, addresses, emails, and more. The generated profiles can be used for testing and simulation purposes in the application.
# it is supposed to output the 20,000 synthetic profiles in json/other format will still decide 
import profile

from dataclasses import field

import yaml 
import random 
import csv 
import json 
from pathlib import Path
from faker import Faker


class ProfileEngine:
    def __init__(self, schema_path: str, adapter_dir: str, seed: int =42, worker_id: int = 0):
        """
        Initialize the ProfileEngine with the given schema and adapter directory.
        """
        self.adapter_dir = Path(adapter_dir)
        self.seed = seed + worker_id
        self.faker = Faker()
        random.seed(self.seed)
        Faker.seed(self.seed)
        with open(schema_path, 'r') as file:
            self.schema = yaml.safe_load(file) or {}
        self.fields = self.schema.get('fields', {})
        self.loaded_samples ={}
        self._preload_samples()


    def _preload_samples(self):
        """ Read CSV once to prevent disk IO issues """
        for field_name, rule in self.fields.items():
            if rule.get('type') == 'sample':
                csv_path = self.adapter_dir /rule['from']
                with open(csv_path, 'r') as csvfile:
                    #right now this is just a flat list, could extend later on
                    reader = csv.reader(csvfile)
                    self.loaded_samples[field_name] = [row[0] for row in reader if row]
    def _generate_single_profile(self) -> dict:
        """Parses rule for a single user and generates their profile based on the schema.
        Returns:
            dict: A dictionary representing the generated user profile.
        """
        profile ={}

        for field, rule in self.fields.items():
            field_type = rule.get('type')
            if field_type == 'choice':#picks based on the weights otherwise uniform dist 
                values = rule['values']
                weights = rule.get('weights')
                profile[field] = random.choices(values, weights=weights, k=1)[0]
                # picks from a sample csv file, can be used for names, addresses, we can use this specifcally for domain specific stuff 
            elif field_type == 'sample':
                count = rule.get('count', 1)
                population = self.loaded_samples.get(field, [])
                safe_count = min(count, len(population))
                sampled = random.sample(population, k=safe_count)
                
                if count == 1:
                    profile[field] = sampled[0] if sampled else None
                else:
                    profile[field] = sampled
            elif field_type == 'fake':# picks from the faker library, can be used for names, addresses, emails 

                provider = rule.get('provider')
                faker_method = getattr(self.faker, provider, None)
                profile[field] = faker_method() if faker_method else None

            else:
                raise ValueError(f"Unsupported field type in schema: {field_type}")
        return profile


    def export_to_json(self, pop_size: int, output_path: str):
            """Pre-generates all profiles and streams them to a JSON array file."""
            with open(output_path, 'w') as f:
                f.write('[\n')
                for i, profile in enumerate(self.generate(pop_size)):
                    if i > 0:
                        f.write(',\n')
                    json.dump(profile, f)
                f.write('\n]')
            print(f"Successfully exported {pop_size} profiles to {output_path}")


    def generate(self, pop_size: int):
        """ yields N profiles, using a generate instead of returning a list to save memory when scaling to 20K users"""
        for _ in range(pop_size):
            yield self._generate_single_profile()


