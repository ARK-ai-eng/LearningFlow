/**
 * Data Integrity Check Script
 * 
 * Prüft und korrigiert inkonsistente Progress-Daten in der Datenbank.
 * 
 * Usage:
 *   npx tsx scripts/check-data-integrity.ts --dry-run          # Nur prüfen
 *   npx tsx scripts/check-data-integrity.ts --fix              # Prüfen und korrigieren
 *   npx tsx scripts/check-data-integrity.ts --user-id 123      # Nur User 123
 *   npx tsx scripts/check-data-integrity.ts --course-id 456    # Nur Kurs 456
 *   npx tsx scripts/check-data-integrity.ts --verbose          # Detailliertes Logging
 */

import { checkDataIntegrity } from '../server/integrity/checker';
import { fixInconsistencies } from '../server/integrity/fixer';
import { reportCheckResult, reportFixResult } from '../server/integrity/reporter';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || !args.includes('--fix'),
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  userId: undefined,
  courseId: undefined,
};

// Parse --user-id
const userIdIndex = args.indexOf('--user-id');
if (userIdIndex !== -1 && args[userIdIndex + 1]) {
  options.userId = parseInt(args[userIdIndex + 1], 10);
}

// Parse --course-id
const courseIdIndex = args.indexOf('--course-id');
if (courseIdIndex !== -1 && args[courseIdIndex + 1]) {
  options.courseId = parseInt(args[courseIdIndex + 1], 10);
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Data Integrity Check Script

Usage:
  node scripts/check-data-integrity.mjs [options]

Options:
  --dry-run          Only check for inconsistencies, don't fix (default)
  --fix              Check and fix inconsistencies
  --user-id <id>     Only check specific user
  --course-id <id>   Only check specific course
  --verbose          Show detailed issue list
  --help, -h         Show this help message

Examples:
  node scripts/check-data-integrity.mjs --dry-run
  node scripts/check-data-integrity.mjs --fix
  node scripts/check-data-integrity.mjs --user-id 123 --verbose
  node scripts/check-data-integrity.mjs --course-id 456 --dry-run
`);
  process.exit(0);
}

// Main
async function main() {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('         Data Integrity Check - AISmarterFlow Academy');
    console.log('═'.repeat(70) + '\n');

    if (options.dryRun) {
      console.log('Mode: DRY RUN (no changes will be made)\n');
    } else {
      console.log('Mode: FIX (inconsistencies will be corrected)\n');
    }

    // Step 1: Check
    console.log('[1/2] Checking data integrity...\n');
    const checkResult = await checkDataIntegrity({
      userId: options.userId,
      courseId: options.courseId,
      verbose: options.verbose,
    });

    // Step 2: Report
    reportCheckResult(checkResult, options.verbose);

    // Step 3: Fix (if --fix)
    if (options.fix && checkResult.inconsistencies.length > 0) {
      console.log('[2/2] Fixing inconsistencies...\n');
      const fixResult = await fixInconsistencies(checkResult.inconsistencies);
      reportFixResult(fixResult, checkResult);

      if (fixResult.errors.length > 0) {
        process.exit(1);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
