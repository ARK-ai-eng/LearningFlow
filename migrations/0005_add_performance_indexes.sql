-- PHASE 2: Performance-Indizes
-- Datum: 2026-02-16
-- Ziel: Präzise Composite-Indizes für JOIN-Queries

-- Index 1: topics.courseId (JOIN-Bedingung)
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(courseId);

-- Index 2: questions.topicId (JOIN-Bedingung)
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topicId);

-- Index 3: question_progress(questionId, userId) (Composite für Multi-Tenancy)
CREATE INDEX IF NOT EXISTS idx_question_progress_question_user ON question_progress(questionId, userId);

-- Index 4: question_progress.firstAttemptStatus (CASE-Statement-Filter)
CREATE INDEX IF NOT EXISTS idx_question_progress_status ON question_progress(firstAttemptStatus);

-- Index 5: courses.isActive (WHERE-Filter)
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(isActive);

-- Index 6: certificates(userId, issuedAt DESC) (WHERE + ORDER BY)
CREATE INDEX IF NOT EXISTS idx_certificates_user_issued ON certificates(userId, issuedAt DESC);
