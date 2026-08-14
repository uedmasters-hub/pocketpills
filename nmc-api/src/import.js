const fs = require('fs');
const Database = require('better-sqlite3');

const csvFile = 'data/nmc-database-active.csv';
const dbFile = 'database/nmc.sqlite';

const db = new Database(dbFile);

db.exec(`
  DROP TABLE IF EXISTS doctors;

  CREATE TABLE doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nmc_number TEXT UNIQUE NOT NULL,
    name TEXT,
    address TEXT,
    gender TEXT,
    degree TEXT
  );

  CREATE INDEX idx_doctors_nmc
  ON doctors(nmc_number);

  CREATE INDEX idx_doctors_name
  ON doctors(name);

  CREATE INDEX idx_doctors_gender
  ON doctors(gender);

  CREATE INDEX idx_doctors_degree
  ON doctors(degree);
`);

const csv = fs.readFileSync(csvFile, 'utf8');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    if (char === '"') {

      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }

    } else if (
      char === ',' &&
      !quoted
    ) {

      result.push(current);
      current = '';

    } else {

      current += char;
    }
  }

  result.push(current);

  return result;
}

const lines =
  csv
    .split(/\r?\n/)
    .filter(Boolean);

const headers =
  parseCSVLine(lines.shift());

const index = {};

headers.forEach(
  (header, i) => {
    index[header] = i;
  }
);

const insert =
  db.prepare(`
    INSERT INTO doctors
    (
      nmc_number,
      name,
      address,
      gender,
      degree
    )
    VALUES (?, ?, ?, ?, ?)
  `);

const insertMany =
  db.transaction(rows => {

    for (const row of rows) {

      const values =
        parseCSVLine(row);

      insert.run(
        values[index['NMC Number']],
        values[index['NMC Name']],
        values[index['NMC Address']],
        values[index['NMC Gender']],
        values[index['NMC Degree']]
      );
    }
  });

insertMany(lines);

const count =
  db.prepare(
    'SELECT COUNT(*) AS count FROM doctors'
  ).get();

console.log(
  `Imported ${count.count} doctors`
);

db.close();