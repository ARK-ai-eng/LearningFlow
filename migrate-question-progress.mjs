import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔄 Migrating existing question_progress data...');

// Copy status to firstAttemptStatus for all existing records
const result = await connection.execute(`
  UPDATE question_progress 
  SET firstAttemptStatus = status,
      lastAttemptCorrect = CASE 
        WHEN status = 'correct' THEN TRUE
        WHEN status = 'incorrect' THEN FALSE
        ELSE NULL
      END
  WHERE firstAttemptStatus = 'unanswered'
`);

console.log(\`✅ Migrated \${result[0].affectedRows} records\`);
console.log('✅ Migration complete!');

await connection.end();
process.exit(0);
