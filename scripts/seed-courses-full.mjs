import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Seeding courses...');

  // Kurs 1: Datenschutz Grundlagen (Learning)
  const [course1Result] = await connection.execute(
    `INSERT INTO courses (title, description, courseType, isActive, isMandatory, passingScore, timeLimit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Datenschutz Grundlagen',
      'Grundlegende Einführung in den Datenschutz nach DSGVO. Lernen Sie die wichtigsten Begriffe und Konzepte kennen.',
      'learning',
      true,
      false,
      60,
      0
    ]
  );
  const course1Id = course1Result.insertId;

  // Themen für Kurs 1
  const [topic1_1] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course1Id, 'Was ist Datenschutz?', 'Einführung in die Grundlagen des Datenschutzes und warum er wichtig ist.', 1]
  );
  const [topic1_2] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course1Id, 'Die DSGVO im Überblick', 'Die wichtigsten Regelungen der Datenschutz-Grundverordnung.', 2]
  );
  const [topic1_3] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course1Id, 'Personenbezogene Daten', 'Was sind personenbezogene Daten und wie werden sie geschützt?', 3]
  );

  // Fragen für Thema 1.1
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_1.insertId, course1Id, 'Was ist das Hauptziel des Datenschutzes?', 
     'Daten zu löschen', 'Persönliche Daten zu schützen', 'Daten zu verkaufen', 'Daten zu sammeln',
     'B', 'Datenschutz zielt darauf ab, die Privatsphäre von Personen zu schützen.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_1.insertId, course1Id, 'Wann trat die DSGVO in Kraft?', 
     '2016', '2017', '2018', '2019',
     'C', 'Die DSGVO trat am 25. Mai 2018 in Kraft.']
  );

  // Fragen für Thema 1.2
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_2.insertId, course1Id, 'Für wen gilt die DSGVO?', 
     'Nur für EU-Unternehmen', 'Alle Unternehmen weltweit', 'Alle Unternehmen, die EU-Bürgerdaten verarbeiten', 'Nur für Behörden',
     'C', 'Die DSGVO gilt für alle Organisationen, die personenbezogene Daten von EU-Bürgern verarbeiten.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_2.insertId, course1Id, 'Was ist ein Datenschutzbeauftragter?', 
     'Ein IT-Administrator', 'Eine Person, die die Einhaltung des Datenschutzes überwacht', 'Ein Polizist', 'Ein Richter',
     'B', 'Der Datenschutzbeauftragte überwacht die Einhaltung der Datenschutzvorschriften in einer Organisation.']
  );

  // Fragen für Thema 1.3
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_3.insertId, course1Id, 'Was sind personenbezogene Daten?', 
     'Nur Name und Adresse', 'Alle Daten, die eine Person identifizieren können', 'Nur Bankdaten', 'Nur Gesundheitsdaten',
     'B', 'Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic1_3.insertId, course1Id, 'Welche dieser Daten sind besonders schützenswert?', 
     'E-Mail-Adresse', 'Telefonnummer', 'Gesundheitsdaten', 'Postleitzahl',
     'C', 'Gesundheitsdaten gehören zu den besonderen Kategorien personenbezogener Daten und sind besonders schützenswert.']
  );

  console.log('Kurs 1 (Learning) erstellt');

  // Kurs 2: IT-Sicherheit Sensibilisierung (Sensitization)
  const [course2Result] = await connection.execute(
    `INSERT INTO courses (title, description, courseType, isActive, isMandatory, passingScore, timeLimit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'IT-Sicherheit Sensibilisierung',
      'Sensibilisierung für IT-Sicherheitsrisiken im Arbeitsalltag. Erkennen Sie Phishing, Social Engineering und andere Bedrohungen.',
      'sensitization',
      true,
      true,
      60,
      0
    ]
  );
  const course2Id = course2Result.insertId;

  // Themen für Kurs 2
  const [topic2_1] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Phishing erkennen', 'Lernen Sie, gefälschte E-Mails und Websites zu erkennen.', 1]
  );
  const [topic2_2] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Sichere Passwörter', 'Best Practices für die Erstellung und Verwaltung sicherer Passwörter.', 2]
  );
  const [topic2_3] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Social Engineering', 'Wie Angreifer menschliche Schwächen ausnutzen.', 3]
  );

  // Fragen für Thema 2.1
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_1.insertId, course2Id, 'Was ist ein typisches Merkmal einer Phishing-E-Mail?', 
     'Persönliche Anrede', 'Dringender Handlungsbedarf', 'Bekannter Absender', 'Keine Anhänge',
     'B', 'Phishing-E-Mails erzeugen oft künstlichen Zeitdruck, um Opfer zu unüberlegten Handlungen zu verleiten.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_1.insertId, course2Id, 'Was sollten Sie tun, wenn Sie eine verdächtige E-Mail erhalten?', 
     'Sofort auf Links klicken', 'Die E-Mail an die IT-Abteilung melden', 'Die E-Mail weiterleiten', 'Anhänge öffnen',
     'B', 'Verdächtige E-Mails sollten immer an die IT-Sicherheit gemeldet werden.']
  );

  // Fragen für Thema 2.2
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_2.insertId, course2Id, 'Welches Passwort ist am sichersten?', 
     'password123', 'Geburtstag2024', 'K#9xL!mP2@qR', 'admin',
     'C', 'Sichere Passwörter enthalten eine Mischung aus Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_2.insertId, course2Id, 'Wie oft sollte ein Passwort geändert werden?', 
     'Nie', 'Täglich', 'Regelmäßig oder bei Verdacht auf Kompromittierung', 'Nur einmal im Jahr',
     'C', 'Passwörter sollten regelmäßig geändert werden, besonders wenn ein Sicherheitsvorfall vermutet wird.']
  );

  // Fragen für Thema 2.3
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_3.insertId, course2Id, 'Was ist Social Engineering?', 
     'Eine Programmiersprache', 'Manipulation von Menschen zur Informationsgewinnung', 'Ein Netzwerkprotokoll', 'Eine Antivirensoftware',
     'B', 'Social Engineering nutzt menschliche Psychologie aus, um an vertrauliche Informationen zu gelangen.']
  );
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_3.insertId, course2Id, 'Welche Technik gehört NICHT zum Social Engineering?', 
     'Pretexting', 'Baiting', 'Firewall', 'Tailgating',
     'C', 'Eine Firewall ist eine technische Sicherheitsmaßnahme, keine Social-Engineering-Technik.']
  );

  console.log('Kurs 2 (Sensitization) erstellt');

  // Kurs 3: Datenschutz Zertifizierung (Certification)
  const [course3Result] = await connection.execute(
    `INSERT INTO courses (title, description, courseType, isActive, isMandatory, passingScore, timeLimit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Datenschutz Zertifizierung',
      'Umfassende Prüfung Ihrer Datenschutzkenntnisse. Bestehen Sie die Jahresprüfung und erhalten Sie Ihr Zertifikat.',
      'certification',
      true,
      true,
      80,
      15
    ]
  );
  const course3Id = course3Result.insertId;

  // Themen für Kurs 3
  const [topic3_1] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course3Id, 'Rechtsgrundlagen', 'Die rechtlichen Grundlagen der Datenverarbeitung nach DSGVO.', 1]
  );
  const [topic3_2] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course3Id, 'Betroffenenrechte', 'Die Rechte der betroffenen Personen nach DSGVO.', 2]
  );
  const [topic3_3] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course3Id, 'Datenpannen', 'Umgang mit Datenschutzverletzungen und Meldepflichten.', 3]
  );
  const [topic3_4] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course3Id, 'Technische Maßnahmen', 'Technische und organisatorische Maßnahmen zum Datenschutz.', 4]
  );

  // Viele Fragen für Zertifizierungskurs (mindestens 25 für 20-Fragen-Prüfung)
  const certQuestions = [
    // Thema 3.1 - Rechtsgrundlagen
    [topic3_1.insertId, 'Welche Rechtsgrundlage erlaubt die Datenverarbeitung zur Vertragserfüllung?', 'Art. 6 Abs. 1 lit. a DSGVO', 'Art. 6 Abs. 1 lit. b DSGVO', 'Art. 6 Abs. 1 lit. c DSGVO', 'Art. 6 Abs. 1 lit. f DSGVO', 'B', 'Art. 6 Abs. 1 lit. b erlaubt die Verarbeitung zur Erfüllung eines Vertrags.'],
    [topic3_1.insertId, 'Was bedeutet "Einwilligung" im Datenschutzrecht?', 'Automatische Zustimmung', 'Freiwillige, informierte Zustimmung', 'Stillschweigende Akzeptanz', 'Vertragliche Verpflichtung', 'B', 'Eine Einwilligung muss freiwillig, informiert und eindeutig sein.'],
    [topic3_1.insertId, 'Wann ist eine Datenschutz-Folgenabschätzung erforderlich?', 'Bei jeder Datenverarbeitung', 'Bei hohem Risiko für Betroffene', 'Nur bei Gesundheitsdaten', 'Nie', 'B', 'Eine DSFA ist bei Verarbeitungen mit hohem Risiko für die Rechte der Betroffenen erforderlich.'],
    [topic3_1.insertId, 'Was ist das Prinzip der Datenminimierung?', 'Alle Daten sammeln', 'Nur notwendige Daten erheben', 'Daten verschlüsseln', 'Daten löschen', 'B', 'Datenminimierung bedeutet, nur die für den Zweck erforderlichen Daten zu erheben.'],
    [topic3_1.insertId, 'Was bedeutet Zweckbindung?', 'Daten für jeden Zweck nutzen', 'Daten nur für festgelegte Zwecke verwenden', 'Daten unbegrenzt speichern', 'Daten weitergeben', 'B', 'Zweckbindung bedeutet, dass Daten nur für den ursprünglich festgelegten Zweck verwendet werden dürfen.'],
    [topic3_1.insertId, 'Welche Strafe droht bei DSGVO-Verstößen maximal?', '1 Million Euro', '10 Millionen Euro', '20 Millionen Euro oder 4% des Jahresumsatzes', '100.000 Euro', 'C', 'Bei schweren Verstößen können Bußgelder bis zu 20 Mio. Euro oder 4% des weltweiten Jahresumsatzes verhängt werden.'],
    
    // Thema 3.2 - Betroffenenrechte
    [topic3_2.insertId, 'Was ist das Auskunftsrecht?', 'Recht auf Datenlöschung', 'Recht auf Information über gespeicherte Daten', 'Recht auf Datenübertragung', 'Recht auf Widerspruch', 'B', 'Das Auskunftsrecht gibt Betroffenen das Recht zu erfahren, welche Daten über sie gespeichert sind.'],
    [topic3_2.insertId, 'Innerhalb welcher Frist muss auf Betroffenenanfragen reagiert werden?', '7 Tage', '14 Tage', '1 Monat', '3 Monate', 'C', 'Auf Betroffenenanfragen muss innerhalb eines Monats reagiert werden.'],
    [topic3_2.insertId, 'Was ist das Recht auf Vergessenwerden?', 'Recht auf Datenlöschung', 'Recht auf Anonymität', 'Recht auf Verschlüsselung', 'Recht auf Kopie', 'A', 'Das Recht auf Vergessenwerden ist das Recht auf Löschung personenbezogener Daten.'],
    [topic3_2.insertId, 'Wann kann das Recht auf Löschung eingeschränkt sein?', 'Bei Einwilligung', 'Bei gesetzlichen Aufbewahrungspflichten', 'Bei Vertragserfüllung', 'Nie', 'B', 'Gesetzliche Aufbewahrungspflichten können das Löschrecht einschränken.'],
    [topic3_2.insertId, 'Was ist Datenportabilität?', 'Daten löschen', 'Daten in maschinenlesbarem Format erhalten', 'Daten verschlüsseln', 'Daten anonymisieren', 'B', 'Datenportabilität ermöglicht es, die eigenen Daten in einem gängigen Format zu erhalten.'],
    [topic3_2.insertId, 'Wer kann eine Beschwerde bei der Aufsichtsbehörde einreichen?', 'Nur Unternehmen', 'Jede betroffene Person', 'Nur Anwälte', 'Nur der Datenschutzbeauftragte', 'B', 'Jede betroffene Person kann sich bei der Aufsichtsbehörde beschweren.'],
    
    // Thema 3.3 - Datenpannen
    [topic3_3.insertId, 'Was ist eine Datenpanne?', 'Systemausfall', 'Verletzung des Schutzes personenbezogener Daten', 'Softwarefehler', 'Stromausfall', 'B', 'Eine Datenpanne ist eine Sicherheitsverletzung, die zu Verlust oder unbefugtem Zugriff auf Daten führt.'],
    [topic3_3.insertId, 'Innerhalb welcher Frist muss eine Datenpanne gemeldet werden?', '24 Stunden', '48 Stunden', '72 Stunden', '7 Tage', 'C', 'Datenpannen müssen innerhalb von 72 Stunden an die Aufsichtsbehörde gemeldet werden.'],
    [topic3_3.insertId, 'Wann müssen Betroffene über eine Datenpanne informiert werden?', 'Immer', 'Bei hohem Risiko für ihre Rechte', 'Nie', 'Nur auf Anfrage', 'B', 'Betroffene müssen informiert werden, wenn ein hohes Risiko für ihre Rechte und Freiheiten besteht.'],
    [topic3_3.insertId, 'Was sollte in einer Datenpannenmeldung enthalten sein?', 'Nur das Datum', 'Art der Verletzung, Folgen und Maßnahmen', 'Nur die Anzahl Betroffener', 'Nur der Name des Verantwortlichen', 'B', 'Eine Meldung muss Art der Verletzung, wahrscheinliche Folgen und ergriffene Maßnahmen enthalten.'],
    [topic3_3.insertId, 'Wer ist für die Meldung einer Datenpanne verantwortlich?', 'Der Betroffene', 'Der Verantwortliche', 'Der Auftragsverarbeiter', 'Die Polizei', 'B', 'Der Verantwortliche (das Unternehmen) ist für die Meldung zuständig.'],
    [topic3_3.insertId, 'Was ist ein Datenpannen-Register?', 'Eine Software', 'Dokumentation aller Datenpannen', 'Eine Versicherung', 'Ein Backup-System', 'B', 'Alle Datenpannen müssen dokumentiert werden, auch wenn keine Meldepflicht besteht.'],
    
    // Thema 3.4 - Technische Maßnahmen
    [topic3_4.insertId, 'Was bedeutet "Privacy by Design"?', 'Datenschutz als Nachgedanke', 'Datenschutz von Anfang an einbauen', 'Datenschutz ignorieren', 'Datenschutz outsourcen', 'B', 'Privacy by Design bedeutet, Datenschutz von Beginn an in Systeme und Prozesse zu integrieren.'],
    [topic3_4.insertId, 'Was ist Pseudonymisierung?', 'Daten löschen', 'Daten so verarbeiten, dass sie ohne Zusatzinfo nicht zuordenbar sind', 'Daten verschlüsseln', 'Daten kopieren', 'B', 'Pseudonymisierung ersetzt identifizierende Merkmale durch Pseudonyme.'],
    [topic3_4.insertId, 'Was ist der Unterschied zwischen Pseudonymisierung und Anonymisierung?', 'Kein Unterschied', 'Anonymisierte Daten sind nicht mehr personenbezogen', 'Pseudonymisierte Daten sind sicherer', 'Anonymisierung ist verboten', 'B', 'Bei Anonymisierung ist keine Zuordnung mehr möglich, bei Pseudonymisierung schon.'],
    [topic3_4.insertId, 'Was ist ein TOMs-Verzeichnis?', 'Eine Mitarbeiterliste', 'Dokumentation technischer und organisatorischer Maßnahmen', 'Ein Softwaretool', 'Ein Backup', 'B', 'TOMs dokumentieren die Schutzmaßnahmen für personenbezogene Daten.'],
    [topic3_4.insertId, 'Welche Maßnahme schützt vor unbefugtem Zugriff?', 'Daten veröffentlichen', 'Zugriffskontrollen', 'Daten teilen', 'Passwörter weitergeben', 'B', 'Zugriffskontrollen beschränken den Zugang auf autorisierte Personen.'],
    [topic3_4.insertId, 'Was ist Verschlüsselung?', 'Daten löschen', 'Daten in unlesbaren Code umwandeln', 'Daten kopieren', 'Daten komprimieren', 'B', 'Verschlüsselung wandelt Daten so um, dass sie nur mit dem richtigen Schlüssel lesbar sind.'],
    [topic3_4.insertId, 'Was ist ein Auftragsverarbeitungsvertrag?', 'Arbeitsvertrag', 'Vertrag zwischen Verantwortlichem und Auftragsverarbeiter', 'Kaufvertrag', 'Mietvertrag', 'B', 'Ein AVV regelt die Datenverarbeitung durch externe Dienstleister.'],
  ];

  for (const q of certQuestions) {
    await connection.execute(
      `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [q[0], course3Id, q[1], q[2], q[3], q[4], q[5], q[6], q[7]]
    );
  }

  console.log('Kurs 3 (Certification) erstellt');
  console.log('Seeding abgeschlossen!');

  await connection.end();
}

seed().catch(console.error);
