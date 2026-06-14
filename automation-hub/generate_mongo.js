const fs = require('fs');

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const actions = ["login", "workflow_executed", "settings_changed", "data_exported", "failed_login"];
const statuses = ["success", "success", "success", "error"];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const events = [];
for (let i = 0; i < 100; i++) {
  const firstName = firstNames[getRandomInt(0, firstNames.length - 1)];
  const lastName = lastNames[getRandomInt(0, lastNames.length - 1)];
  const name = `${firstName} ${lastName}`;
  
  events.push({
    action: actions[getRandomInt(0, actions.length - 1)],
    user: name,
    timestamp: randomDate(new Date(Date.now() - 30*24*60*60*1000), new Date()),
    ip_address: `${getRandomInt(1,255)}.${getRandomInt(0,255)}.${getRandomInt(0,255)}.${getRandomInt(1,254)}`,
    status: statuses[getRandomInt(0, statuses.length - 1)]
  });
}

const mongoScript = `
// DML for MongoDB - Run this in mongosh
use automation_hub;
db.events.insertMany(${JSON.stringify(events, null, 2)});
`;

const filePath = '/Users/harishkaparwan/.gemini/antigravity/brain/a3511985-58eb-4ff1-9faf-4c6e32d86f7b/mongo_seed_100.js';
fs.writeFileSync(filePath, mongoScript);

console.log('Successfully generated ' + filePath);
