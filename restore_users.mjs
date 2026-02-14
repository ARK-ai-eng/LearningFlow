import bcrypt from 'bcryptjs';

const users = [
  { email: 'arton.ritter@aismarterflow.de', password: 'Manus§123*', role: 'sysadmin' },
  { email: 'test@me.com', password: 'Testday2026', role: 'companyadmin' },
  { email: 'testyou@me.com', password: 'TestYou20266**', role: 'user' }
];

for (const user of users) {
  const hash = await bcrypt.hash(user.password, 10);
  console.log(`INSERT INTO users (email, passwordHash, role, isActive, createdAt, updatedAt, lastSignedIn) VALUES ('${user.email}', '${hash}', '${user.role}', 1, NOW(), NOW(), NOW());`);
}
