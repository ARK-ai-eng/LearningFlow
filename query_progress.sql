-- Finde User testyou@me.com
SELECT id, email, role FROM users WHERE email = 'testyou@me.com';

-- Zeige alle questionProgress für diesen User in Course 2
SELECT 
  qp.id,
  qp.questionId,
  q.courseId,
  q.topicId,
  qp.firstAttemptStatus,
  qp.lastAttemptCorrect,
  qp.attemptCount,
  qp.createdAt
FROM questionProgress qp
JOIN questions q ON qp.questionId = q.id
WHERE qp.userId = (SELECT id FROM users WHERE email = 'testyou@me.com')
  AND q.courseId = 2
ORDER BY q.topicId, q.id;

-- Statistik: Wie viele correct vs incorrect?
SELECT 
  firstAttemptStatus,
  COUNT(*) as count
FROM questionProgress qp
JOIN questions q ON qp.questionId = q.id
WHERE qp.userId = (SELECT id FROM users WHERE email = 'testyou@me.com')
  AND q.courseId = 2
GROUP BY firstAttemptStatus;
