import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  // 1. Create the Test User for authentication
  const hashedPassword = await bcrypt.hash('password123', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      name: 'Test User',
    },
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });
  console.log(`Created test user with ID: ${testUser.id}`);

  // 2. Create mock user for development
  const mockUser = await prisma.user.upsert({
    where: { id: 'mock-user-id' },
    update: {
      name: 'Mock User',
    },
    create: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      password: hashedPassword,
      name: 'Mock User',
    },
  });
  console.log(`Created mock user with ID: ${mockUser.id}`);

  // 2. Clean up existing data for idempotency
  console.log("Deleting existing wedding data for test and mock users...");

  // Find weddings where users are participants
  const userWeddings = await prisma.wedding.findMany({
    where: {
      participants: {
        some: {
          userId: {
            in: [testUser.id, mockUser.id]
          }
        },
      },
    },
  });

  // Delete weddings (cascade will handle related data)
  for (const wedding of userWeddings) {
    await prisma.wedding.delete({ where: { id: wedding.id } });
  }

  // Also clean up events for mock user (tasks, budget, etc. cascade)
  await prisma.event.deleteMany({
    where: {
      userId: mockUser.id
    }
  });

  // 2b. Event dla mock user – dashboard (zadania AI, stoły, goście) używa Event
  const devEvent = await prisma.event.create({
    data: {
      name: 'Nasze Wesele',
      date: new Date('2025-08-15T14:00:00.000Z'),
      userId: mockUser.id,
      brideName: 'Anna',
      groomName: 'Jan',
      targetBudget: 50000,
      estimatedGuestCount: 100,
      style: 'Klasyczny',
      priorities: 'Fotograf,Catering,Muzyka',
    },
  });
  console.log(`Created dev Event for mock user (ID: ${devEvent.id}) – używane przez dashboard i „Wygeneruj plan zadań AI”.`);

  // 3. Create a Wedding associated with the Test User
  const wedding = await prisma.wedding.create({
    data: {
      name: 'Nasze Wesele',
      ceremonyDate: new Date('2025-08-15T14:00:00Z'),
      receptionLocation: 'Sala Weselna Pod Dębami',
      targetBudget: 50000,
      estimatedGuestCount: 100,
      style: 'Klasyczny',
      priorities: 'Fotograf,Catering,Muzyka', // Comma-separated string
      userId: testUser.id,
    },
  });

  // Create the wedding participant relationship
  await prisma.weddingParticipant.create({
    data: {
      weddingId: wedding.id,
      userId: testUser.id,
      role: 'OWNER',
    },
  });
  console.log(`Created wedding with ID: ${wedding.id}`);

  // 4. Create sample tasks
  await prisma.task.createMany({
    data: [
      { title: 'Zarezerwuj salę weselną', status: 'DONE', priority: 'HIGH', weddingId: wedding.id, assigneeId: testUser.id },
      { title: 'Wynajmij fotografa', status: 'IN_PROGRESS', priority: 'HIGH', weddingId: wedding.id },
      { title: 'Wyślij zaproszenia', status: 'TODO', priority: 'MEDIUM', weddingId: wedding.id },
      { title: 'Wybierz menu', status: 'TODO', priority: 'MEDIUM', weddingId: wedding.id },
      { title: 'Zamów kwiaty', status: 'TODO', priority: 'LOW', weddingId: wedding.id },
      { title: 'Ustal szczegóły z DJ-em', status: 'TODO', priority: 'MEDIUM', weddingId: wedding.id },
    ],
  });
  console.log("Created sample tasks.");

  // 5. Create sample budget items
  await prisma.budgetItem.createMany({
    data: [
      { name: 'Sala weselna', category: 'Venue', plannedAmount: 15000, actualAmount: 14500, status: 'PAID', weddingId: wedding.id },
      { name: 'Catering', category: 'Catering', plannedAmount: 12000, status: 'PLANNED', weddingId: wedding.id },
      { name: 'Fotograf', category: 'Photography', plannedAmount: 5000, status: 'PLANNED', weddingId: wedding.id },
      { name: 'Kwiaty i dekoracje', category: 'Decorations', plannedAmount: 3000, status: 'PLANNED', weddingId: wedding.id },
      { name: 'Muzyka/DJ', category: 'Entertainment', plannedAmount: 4000, status: 'PLANNED', weddingId: wedding.id },
      { name: 'Suknia ślubna', category: 'Attire', plannedAmount: 5000, status: 'PAID', weddingId: wedding.id },
    ],
  });
  console.log("Created sample budget items.");

  // 6. Create sample guests
  await prisma.guest.createMany({
    data: [
      { name: 'Anna Kowalska', firstName: 'Anna', lastName: 'Kowalska', status: 'CONFIRMED', weddingId: wedding.id },
      { name: 'Jan Nowak', firstName: 'Jan', lastName: 'Nowak', status: 'CONFIRMED', weddingId: wedding.id },
      { name: 'Maria Wiśniewska', firstName: 'Maria', lastName: 'Wiśniewska', status: 'PENDING', weddingId: wedding.id },
      { name: 'Piotr Zieliński', firstName: 'Piotr', lastName: 'Zieliński', status: 'PENDING', weddingId: wedding.id },
      { name: 'Katarzyna Lewandowska', firstName: 'Katarzyna', lastName: 'Lewandowska', status: 'DECLINED', weddingId: wedding.id },
      { name: 'Tomasz Wójcik', firstName: 'Tomasz', lastName: 'Wójcik', status: 'CONFIRMED', weddingId: wedding.id },
      { name: 'Ewa Kamińska', firstName: 'Ewa', lastName: 'Kamińska', status: 'PENDING', weddingId: wedding.id },
    ],
  });
  console.log("Created sample guests.");

  // 7. Create sample tables
  await prisma.table.createMany({
    data: [
      { name: 'Stół 1', capacity: 8, weddingId: wedding.id },
      { name: 'Stół 2', capacity: 8, weddingId: wedding.id },
      { name: 'Stół 3', capacity: 6, weddingId: wedding.id },
      { name: 'Stół Młodej Pary', capacity: 4, weddingId: wedding.id },
    ],
  });
  console.log("Created sample tables.");

  console.log("Seed process completed successfully!");
  console.log("\n=== TEST LOGIN CREDENTIALS ===");
  console.log("Email: test@example.com");
  console.log("Password: password123");
  console.log("============================\n");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
