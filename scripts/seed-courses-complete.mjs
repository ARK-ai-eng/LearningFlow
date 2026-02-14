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

  // Kurs 2: IT-Sicherheit Sensibilisierung (Sensitization) - VOLLSTÄNDIG MIT 12 THEMEN
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

  // 12 Themen für Kurs 2
  const [topic2_1] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Phishing erkennen', 'Lernen Sie, gefälschte E-Mails und Websites zu erkennen und richtig zu reagieren.', 1]
  );
  const [topic2_2] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Sichere Passwörter', 'Best Practices für die Erstellung und Verwaltung sicherer Passwörter.', 2]
  );
  const [topic2_3] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Social Engineering', 'Wie Angreifer menschliche Schwächen ausnutzen und wie Sie sich schützen.', 3]
  );
  const [topic2_4] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'E-Mail & Dateianhänge', 'Sicherer Umgang mit E-Mail-Anhängen und verdächtigen Dateien.', 4]
  );
  const [topic2_5] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Geräte & Arbeitsplatzsicherheit', 'Physische Sicherheit am Arbeitsplatz und beim mobilen Arbeiten.', 5]
  );
  const [topic2_6] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'MFA & Login-Missbrauch', 'Multi-Faktor-Authentifizierung und Erkennung von Login-Missbrauch.', 6]
  );
  const [topic2_7] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Cloud & Datenaustausch', 'Sicherer Umgang mit Cloud-Diensten und Dateifreigaben.', 7]
  );
  const [topic2_8] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Updates & Fake-Updates', 'Echte von gefälschten Software-Updates unterscheiden.', 8]
  );
  const [topic2_9] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Mobile Security', 'Sicherheit auf mobilen Geräten und QR-Code-Risiken.', 9]
  );
  const [topic2_10] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Datenschutz & Datenklassifizierung', 'Umgang mit vertraulichen Daten und Datenklassifizierung.', 10]
  );
  const [topic2_11] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'USB & Fremdgeräte', 'Risiken durch unbekannte USB-Sticks und externe Geräte.', 11]
  );
  const [topic2_12] = await connection.execute(
    `INSERT INTO topics (courseId, title, content, orderIndex) VALUES (?, ?, ?, ?)`,
    [course2Id, 'Incident Reporting', 'Wann und wie Sicherheitsvorfälle gemeldet werden müssen.', 12]
  );

  // Frage für Thema 2.1 - Phishing erkennen
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_1.insertId, course2Id, 'Du erhältst eine E-Mail mit dringender Zahlungsaufforderung und Link. Was ist korrekt?', 
     'Link anklicken, um die Echtheit zu prüfen', 'E-Mail an Kollegen weiterleiten und fragen', 'Absenderdomain prüfen und Mail melden', 'Antworten und um Bestätigung bitten',
     'C', 'Absenderdomain prüfen und verdächtige Mails an die IT-Sicherheit melden ist die korrekte Vorgehensweise.']
  );

  // Frage für Thema 2.2 - Sichere Passwörter
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_2.insertId, course2Id, 'Welche Passwort-Praxis ist korrekt?', 
     'Dasselbe Passwort für mehrere Dienste', 'Passwort regelmäßig per Mail ändern', 'Kurzes Passwort mit Sonderzeichen', 'Einzigartige lange Passphrase je Dienst',
     'D', 'Jeder Dienst sollte ein einzigartiges, langes Passwort oder eine Passphrase haben.']
  );

  // Frage für Thema 2.3 - Social Engineering
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_3.insertId, course2Id, 'Ein Anrufer gibt sich als IT aus und fordert Zugangsdaten. Was tun?', 
     'Daten nennen, wenn er überzeugend wirkt', 'Rückfragen stellen, um ihn zu prüfen', 'Gespräch beenden und intern melden', 'Kollegen um Einschätzung bitten',
     'C', 'Gespräch sofort beenden und den Vorfall intern an die IT-Sicherheit melden.']
  );

  // Frage für Thema 2.4 - E-Mail & Dateianhänge
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_4.insertId, course2Id, 'Welcher Anhang ist besonders gefährlich?', 
     'PDF von bekanntem Absender', 'ZIP-Datei mit Passwort', 'Unerwarteter Anhang mit Aufforderung', 'Bilddatei unter 1 MB',
     'C', 'Unerwartete Anhänge mit Handlungsaufforderung sind besonders verdächtig und oft Malware.']
  );

  // Frage für Thema 2.5 - Geräte & Arbeitsplatzsicherheit
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_5.insertId, course2Id, 'Was ist Pflicht beim Verlassen des Arbeitsplatzes?', 
     'Programme schließen', 'Monitor ausschalten', 'Bildschirm sperren', 'Maus vom Tisch nehmen',
     'C', 'Der Bildschirm muss gesperrt werden, um unbefugten Zugriff zu verhindern.']
  );

  // Frage für Thema 2.6 - MFA & Login-Missbrauch
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_6.insertId, course2Id, 'Du erhältst eine MFA-Anfrage ohne Login. Was tun?', 
     'Bestätigen, um Ruhe zu haben', 'Ignorieren', 'Ablehnen und sofort melden', 'Später erneut prüfen',
     'C', 'MFA-Anfragen ohne eigenen Login-Versuch deuten auf Missbrauch hin und müssen gemeldet werden.']
  );

  // Frage für Thema 2.7 - Cloud & Datenaustausch
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_7.insertId, course2Id, 'Wie teilst du sensible Dateien korrekt?', 
     'Öffentlicher Link', 'Link ohne Ablaufdatum', 'Freigabe an konkrete Person mit Ablaufdatum', 'Versand per Messenger',
     'C', 'Sensible Dateien nur an konkrete Personen freigeben und mit Ablaufdatum versehen.']
  );

  // Frage für Thema 2.8 - Updates & Fake-Updates
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_8.insertId, course2Id, 'Woran erkennst du ein echtes Update?', 
     'Pop-up im Browser', 'E-Mail mit Download-Link', 'Aufforderung im Betriebssystem/Programm', 'Werbung auf Webseite',
     'C', 'Echte Updates kommen vom Betriebssystem oder der installierten Software selbst, nicht per E-Mail oder Browser-Pop-up.']
  );

  // Frage für Thema 2.9 - Mobile Security
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_9.insertId, course2Id, 'Warum sind QR-Codes ein Risiko?', 
     'Sie funktionieren oft nicht', 'Sie können auf manipulierte Seiten führen', 'Sie sammeln Standortdaten', 'Sie enthalten Werbung',
     'B', 'QR-Codes können auf manipulierte Websites führen, die Malware verbreiten oder Daten stehlen.']
  );

  // Frage für Thema 2.10 - Datenschutz & Datenklassifizierung
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_10.insertId, course2Id, 'Welche Daten sind "vertraulich"?', 
     'Öffentliche Firmeninfos', 'Marketingmaterial', 'Kunden- und Personaldaten', 'Stellenanzeigen',
     'C', 'Kunden- und Personaldaten sind vertraulich und müssen besonders geschützt werden.']
  );

  // Frage für Thema 2.11 - USB & Fremdgeräte
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_11.insertId, course2Id, 'Wie gehst du mit einem gefundenen USB-Stick um?', 
     'Einstecken und prüfen', 'Formatieren', 'Abgeben und melden', 'Mitnehmen',
     'C', 'Gefundene USB-Sticks niemals einstecken, sondern an die IT-Sicherheit abgeben.']
  );

  // Frage für Thema 2.12 - Incident Reporting
  await connection.execute(
    `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topic2_12.insertId, course2Id, 'Wann muss ein Sicherheitsvorfall gemeldet werden?', 
     'Nur bei bestätigtem Schaden', 'Erst nach Rücksprache', 'Sofort bei Auffälligkeit', 'Am Tagesende',
     'C', 'Sicherheitsvorfälle müssen sofort gemeldet werden, auch bei bloßem Verdacht.']
  );

  console.log('Kurs 2 (Sensitization) erstellt - 12 Themen, 12 Fragen');

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
    [topic3_2.insertId, 'Was ist das Recht auf Vergessenwerden?', 'Recht auf Anonymität', 'Recht auf Löschung personenbezogener Daten', 'Recht auf Datensicherung', 'Recht auf Verschlüsselung', 'B', 'Das Recht auf Vergessenwerden gibt Betroffenen das Recht, die Löschung ihrer Daten zu verlangen.'],
    [topic3_2.insertId, 'Was bedeutet Datenportabilität?', 'Daten auf USB-Stick speichern', 'Daten in strukturiertem Format erhalten und übertragen', 'Daten ausdrucken', 'Daten löschen', 'B', 'Datenportabilität bedeutet, dass Betroffene ihre Daten in einem strukturierten Format erhalten und an andere Anbieter übertragen können.'],
    [topic3_2.insertId, 'Wann kann das Recht auf Löschung eingeschränkt werden?', 'Nie', 'Bei rechtlichen Verpflichtungen', 'Immer', 'Nach Belieben des Unternehmens', 'B', 'Das Recht auf Löschung kann eingeschränkt werden, wenn rechtliche Aufbewahrungspflichten bestehen.'],
    [topic3_2.insertId, 'Was ist das Widerspruchsrecht?', 'Recht, Daten zu ändern', 'Recht, der Verarbeitung zu widersprechen', 'Recht auf Auskunft', 'Recht auf Kopie', 'B', 'Das Widerspruchsrecht erlaubt Betroffenen, der Verarbeitung ihrer Daten zu widersprechen.'],
    
    // Thema 3.3 - Datenpannen
    [topic3_3.insertId, 'Wann muss eine Datenpanne gemeldet werden?', 'Nie', 'Innerhalb von 72 Stunden', 'Nach 1 Woche', 'Nach 1 Monat', 'B', 'Datenpannen müssen innerhalb von 72 Stunden an die Aufsichtsbehörde gemeldet werden.'],
    [topic3_3.insertId, 'Wann müssen Betroffene bei einer Datenpanne informiert werden?', 'Immer', 'Bei hohem Risiko für ihre Rechte', 'Nie', 'Nach Ermessen', 'B', 'Betroffene müssen informiert werden, wenn ein hohes Risiko für ihre Rechte und Freiheiten besteht.'],
    [topic3_3.insertId, 'Was ist eine Datenpanne?', 'Geplante Wartung', 'Verletzung der Datensicherheit', 'Systemupdate', 'Datensicherung', 'B', 'Eine Datenpanne ist eine Verletzung der Datensicherheit, die zu Datenverlust oder unbefugtem Zugriff führt.'],
    [topic3_3.insertId, 'Welche Behörde ist in Deutschland für Datenschutz zuständig?', 'Polizei', 'Landesdatenschutzbeauftragte', 'Finanzamt', 'Gesundheitsamt', 'B', 'Die Landesdatenschutzbeauftragten sind die zuständigen Aufsichtsbehörden in Deutschland.'],
    [topic3_3.insertId, 'Was muss bei einer Datenpanne dokumentiert werden?', 'Nichts', 'Art, Umfang und Folgen der Panne', 'Nur der Zeitpunkt', 'Nur betroffene Personen', 'B', 'Art, Umfang, Folgen und ergriffene Maßnahmen müssen dokumentiert werden.'],
    [topic3_3.insertId, 'Welche Strafe droht bei verspäteter Meldung einer Datenpanne?', 'Keine', 'Bußgeld bis zu 10 Mio. Euro', 'Verwarnung', 'Geldstrafe von 100 Euro', 'B', 'Verspätete Meldungen können mit Bußgeldern bis zu 10 Mio. Euro geahndet werden.'],
    
    // Thema 3.4 - Technische Maßnahmen
    [topic3_4.insertId, 'Was sind TOM im Datenschutz?', 'Technische und organisatorische Maßnahmen', 'Temporäre Online-Maßnahmen', 'Totale Offline-Maßnahmen', 'Theoretische Optimierungs-Maßnahmen', 'A', 'TOM sind technische und organisatorische Maßnahmen zum Schutz personenbezogener Daten.'],
    [topic3_4.insertId, 'Was ist Pseudonymisierung?', 'Daten löschen', 'Daten so verarbeiten, dass sie ohne Zusatzinfo nicht zuordenbar sind', 'Daten verschlüsseln', 'Daten anonymisieren', 'B', 'Pseudonymisierung ersetzt identifizierende Merkmale durch Pseudonyme, sodass eine Zuordnung nur mit Zusatzinformationen möglich ist.'],
    [topic3_4.insertId, 'Was ist der Unterschied zwischen Pseudonymisierung und Anonymisierung?', 'Keiner', 'Pseudonymisierung ist umkehrbar, Anonymisierung nicht', 'Anonymisierung ist umkehrbar', 'Beide sind gleich', 'B', 'Pseudonymisierung kann rückgängig gemacht werden, Anonymisierung ist irreversibel.'],
    [topic3_4.insertId, 'Welche Verschlüsselung ist für sensible Daten empfohlen?', 'Keine', 'End-to-End-Verschlüsselung', 'Basis-Verschlüsselung', 'Optionale Verschlüsselung', 'B', 'End-to-End-Verschlüsselung schützt Daten während der gesamten Übertragung.'],
    [topic3_4.insertId, 'Was ist Privacy by Design?', 'Datenschutz nachträglich hinzufügen', 'Datenschutz von Anfang an einplanen', 'Datenschutz ignorieren', 'Datenschutz optional machen', 'B', 'Privacy by Design bedeutet, Datenschutz bereits bei der Planung von Systemen zu berücksichtigen.'],
    [topic3_4.insertId, 'Was ist Privacy by Default?', 'Standardmäßig alle Daten sammeln', 'Standardmäßig höchste Datenschutzeinstellungen', 'Datenschutz deaktivieren', 'Datenschutz optional', 'B', 'Privacy by Default bedeutet, dass die datenschutzfreundlichsten Einstellungen standardmäßig aktiv sind.'],
  ];

  for (const q of certQuestions) {
    await connection.execute(
      `INSERT INTO questions (topicId, courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [q[0], course3Id, q[1], q[2], q[3], q[4], q[5], q[6], q[7]]
    );
  }

  console.log('Kurs 3 (Certification) erstellt - 4 Themen, 25 Fragen');

  await connection.end();
  console.log('Seeding abgeschlossen!');
}

seed().catch(console.error);
