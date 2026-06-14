import random
from faker import Faker

fake = Faker()

ddl = """-- DDL: Create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DML: Insert 100 fake records
INSERT INTO users (name, email, role, created_at) VALUES
"""

values = []
for _ in range(100):
    name = fake.name().replace("'", "''")
    email = fake.email().replace("'", "''")
    role = random.choice(["admin", "editor", "viewer", "viewer", "viewer"])
    date = fake.date_time_between(start_date="-1y", end_date="now").strftime("%Y-%m-%d %H:%M:%S")
    values.append(f"('{name}', '{email}', '{role}', '{date}')")

dml = ddl + ",\n".join(values) + ";\n"

with open("/Users/harishkaparwan/.gemini/antigravity/brain/a3511985-58eb-4ff1-9faf-4c6e32d86f7b/postgres_seed.sql", "w") as f:
    f.write(dml)

print("Generated postgres_seed.sql")
