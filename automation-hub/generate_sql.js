const fs = require('fs');

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const domains = ["example.com", "test.org", "demo.net", "company.io", "startup.co"];
const roles = ["admin", "editor", "viewer", "viewer", "viewer", "viewer"];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

const ddl = `-- DDL: Create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DML: Insert 100 fake records
INSERT INTO users (name, email, role, created_at) VALUES
`;

const values = [];
for (let i = 0; i < 100; i++) {
  const firstName = firstNames[getRandomInt(0, firstNames.length - 1)];
  const lastName = lastNames[getRandomInt(0, lastNames.length - 1)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1, 99)}@${domains[getRandomInt(0, domains.length - 1)]}`;
  const role = roles[getRandomInt(0, roles.length - 1)];
  const date = formatDate(randomDate(new Date(Date.now() - 365*24*60*60*1000), new Date()));
  
  values.push(`('${name.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${role}', '${date}')`);
}

const sql = ddl + values.join(",\n") + ";\n";

const filePath = '/Users/harishkaparwan/.gemini/antigravity/brain/a3511985-58eb-4ff1-9faf-4c6e32d86f7b/postgres_seed_100.sql';
fs.writeFileSync(filePath, sql);

console.log('Successfully generated ' + filePath);
