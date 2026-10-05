const { createClient } = require('@libsql/client');
const path = require('path');

const db = createClient({ url: `file:${path.resolve(process.cwd(), 'studez.db').replace(/\\/g, '/')}` });

async function inspect() {
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('--- TABLES & COUNTS ---');
  for (const t of tables.rows) {
    try {
      const count = await db.execute(`SELECT COUNT(*) as c FROM "${t.name}"`);
      console.log(`${t.name.padEnd(25)}: ${count.rows[0].c}`);
    } catch (e) {
      console.log(`${t.name.padEnd(25)}: ERROR ${e.message}`);
    }
  }

  console.log('\n--- SAMPLE DATES IN ASSIGNMENTS ---');
  const asg = await db.execute('SELECT id, title, due_date, created_at FROM assignments LIMIT 5');
  console.log(asg.rows);

  console.log('\n--- SAMPLE DATES IN ATTENDANCE ---');
  const att = await db.execute('SELECT id, date, status, created_at FROM attendance LIMIT 5');
  console.log(att.rows);

  console.log('\n--- SAMPLE DATES IN STUDY TASKS ---');
  const st = await db.execute('SELECT id, title, due_date, completed, created_at FROM study_tasks LIMIT 5');
  console.log(st.rows);

  console.log('\n--- SAMPLE DATES IN TIMETABLE ---');
  const tt = await db.execute('SELECT id, day, start_time, end_time FROM timetable LIMIT 5');
  console.log(tt.rows);
}

inspect();
