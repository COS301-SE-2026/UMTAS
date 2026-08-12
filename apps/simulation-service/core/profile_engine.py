# core/profile_engine.py
# this file is responsible for creating the fake users, it reads profile_schema.yml and creates the random fake data based on the schema defined in the file. It uses the Faker library to generate realistic data for various fields such as names, addresses, emails, and more. The generated profiles can be used for testing and simulation purposes in the application.
# it is supposed to output the 20,000 synthetic profiles in json/other format will still decide 
import yaml 
import random 
import csv 
from pathlib import Path
from faker import Faker


class ProfileEngine:
    def __init__(self, schema_path: str, adapter_dir: str, seed: int =42):
        """
        Initialize the ProfileEngine with the given schema and adapter directory.
        """
        self.adapter_dir = Path(adapter_dir)
        self.seed = seed
        self.faker = Faker()
        random.seed(self.seed)
        Faker.seed(self.seed)

        #step 1: load yaml schema 
        with open(schema_path, 'r') as file:
            self.schema = yaml.safe_load(file)
        self.fields = self.schema.get('fields', [])
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
                        self.loaded_samples[field_name] = [row[0] for row in reader]
        def _generate_single_profile(self) -> dict:
            """Parses rule for a single user and generates their profile based on the schema.
            Returns:
                dict: A dictionary representing the generated user profile.
            """
            profile ={}

            for field, rule in self.fields.items():
                field_type = rule.get('type')

                if field_type == 'choice':

                    values = rule['values']
                    weights = rule.get('weights')
                    profile[field] = random.choices(values, weights=weights, k=1)[0]
                elif field_type == 'sample':
                    count =rule.get('count', 1)
                    population = self.loaded_samples[field]
                    profile[field] = random.sample(population, k=count)

