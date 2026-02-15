import type { CheckResult, Inconsistency } from './checker';
import type { FixResult } from './fixer';
import { groupByUser, groupByType } from './checker';

/**
 * Zeigt Check-Ergebnis im Terminal
 */
export function reportCheckResult(result: CheckResult, verbose: boolean = false): void {
  console.log('\n' + '═'.repeat(70));
  console.log('         Data Integrity Check - AISmarterFlow Academy');
  console.log('═'.repeat(70) + '\n');

  console.log(`Started: ${new Date().toLocaleString('de-DE')}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s\n`);

  // Summary
  console.log('═'.repeat(70));
  console.log('                          SUMMARY');
  console.log('═'.repeat(70) + '\n');

  console.log(`Total Users:              ${result.totalUsers}`);
  console.log(`Total Courses:            ${result.totalCourses}`);
  console.log(`Total Topics:             ${result.totalTopics}`);
  console.log(`Total Checks:             ${result.totalChecks}\n`);

  const inconsistencyPercent = result.totalChecks > 0
    ? ((result.inconsistencies.length / result.totalChecks) * 100).toFixed(2)
    : '0.00';

  if (result.inconsistencies.length === 0) {
    console.log('✅ No inconsistencies found!\n');
  } else {
    console.log(`⚠️  Inconsistencies Found:    ${result.inconsistencies.length} (${inconsistencyPercent}%)`);

    // Group by type
    const byType = groupByType(result.inconsistencies);
    byType.forEach((issues, type) => {
      const label = getTypeLabel(type);
      console.log(`    - ${label}: ${issues.length}`);
    });

    console.log(`\nAffected Users:           ${result.affectedUsers}\n`);

    // Affected users table
    console.log('═'.repeat(70));
    console.log('                      AFFECTED USERS');
    console.log('═'.repeat(70) + '\n');

    const byUser = groupByUser(result.inconsistencies);
    console.log('User ID  Email                              Issues  Details');
    console.log('-------  ---------------------------------  ------  ----------------');

    byUser.forEach((issues, userId) => {
      const user = issues[0];
      const email = user.userEmail.padEnd(33);
      const issueCount = issues.length.toString().padStart(6);

      // Count by type
      const typeCount = groupByType(issues);
      const details: string[] = [];
      typeCount.forEach((items, type) => {
        details.push(`${items.length} ${getTypeShortLabel(type)}`);
      });

      console.log(`${userId.toString().padStart(7)}  ${email}  ${issueCount}  ${details.join(', ')}`);
    });

    console.log('');

    // Verbose: Show all issues
    if (verbose) {
      console.log('═'.repeat(70));
      console.log('                      DETAILED ISSUES');
      console.log('═'.repeat(70) + '\n');

      byUser.forEach((issues, userId) => {
        console.log(`\n📧 ${issues[0].userEmail} (ID: ${userId})`);
        console.log('─'.repeat(70));

        issues.forEach((issue, index) => {
          console.log(`\n  ${index + 1}. ${getTypeLabel(issue.type)}`);
          console.log(`     Course:    ${issue.courseTitle} (ID: ${issue.courseId})`);
          console.log(`     Topic:     ${issue.topicTitle} (ID: ${issue.topicId})`);
          console.log(`     Expected:  ${issue.expected}`);
          console.log(`     Actual:    ${issue.actual}`);
          console.log(`     Questions: ${issue.questionsAnswered}/${issue.questionsTotal} answered, ${issue.questionsCorrect} correct`);
        });
      });

      console.log('\n');
    }
  }

  console.log('═'.repeat(70));
  console.log('Run with --fix to apply corrections.');
  console.log('Run with --verbose for detailed issue list.');
  console.log('═'.repeat(70) + '\n');
}

/**
 * Zeigt Fix-Ergebnis im Terminal
 */
export function reportFixResult(fixResult: FixResult, checkResult: CheckResult): void {
  console.log('\n' + '═'.repeat(70));
  console.log('                      FIX RESULT');
  console.log('═'.repeat(70) + '\n');

  console.log(`Total Inconsistencies:    ${checkResult.inconsistencies.length}`);
  console.log(`Successfully Fixed:       ${fixResult.totalFixed}`);
  console.log(`Errors:                   ${fixResult.errors.length}\n`);

  if (fixResult.totalFixed > 0) {
    console.log('Fixed by type:');
    fixResult.fixedByType.forEach((count, type) => {
      const label = getTypeLabel(type);
      console.log(`  - ${label}: ${count}`);
    });
    console.log('');
  }

  if (fixResult.errors.length > 0) {
    console.log('⚠️  Errors during fix:');
    fixResult.errors.forEach((error, index) => {
      console.log(`\n  ${index + 1}. ${error.issue.userEmail} - ${error.issue.topicTitle}`);
      console.log(`     Error: ${error.error}`);
    });
    console.log('');
  }

  if (fixResult.totalFixed === checkResult.inconsistencies.length && fixResult.errors.length === 0) {
    console.log('✅ All inconsistencies fixed successfully!\n');
  }

  console.log('═'.repeat(70) + '\n');
}

/**
 * Gibt lesbare Labels für Inkonsistenz-Typen zurück
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'incomplete_topic_marked_complete':
      return 'Incomplete topic marked as complete';
    case 'missing_user_progress':
      return 'Missing user_progress entry';
    case 'complete_topic_not_marked':
      return 'Complete topic not marked';
    default:
      return type;
  }
}

/**
 * Gibt kurze Labels für Inkonsistenz-Typen zurück
 */
function getTypeShortLabel(type: string): string {
  switch (type) {
    case 'incomplete_topic_marked_complete':
      return 'incomplete';
    case 'missing_user_progress':
      return 'missing';
    case 'complete_topic_not_marked':
      return 'not marked';
    default:
      return type;
  }
}
