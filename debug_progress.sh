#!/bin/bash
# Exportiere DB-Daten für Course 2, User testyou@me.com

echo "=== Checking progress for testyou@me.com, Course 2 ==="

# Verwende webdev_execute_sql Tool stattdessen
echo "Run this SQL manually:"
echo ""
echo "SELECT qp.questionId, qp.firstAttemptStatus, qp.lastAttemptCorrect, q.topicId, t.title"
echo "FROM question_progress qp"
echo "JOIN questions q ON qp.questionId = q.id"  
echo "JOIN topics t ON q.topicId = t.id"
echo "WHERE qp.userId = (SELECT id FROM users WHERE email = 'testyou@me.com')"
echo "  AND t.courseId = 2"
echo "ORDER BY q.topicId, q.id;"
