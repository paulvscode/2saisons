import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@deuxsaisonsdeplanche.fr" },
    update: {},
    create: {
      email: "admin@deuxsaisonsdeplanche.fr",
      passwordHash: password,
      role: "admin",
      firstname: "Camille",
      lastname: "Roux",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@deuxsaisonsdeplanche.fr" },
    update: {},
    create: {
      email: "member@deuxsaisonsdeplanche.fr",
      passwordHash: password,
      role: "member",
      firstname: "Alex",
      lastname: "Martin",
      phone: "+33600000000",
    },
  });

  await prisma.membership.create({
    data: {
      userId: member.id,
      startDate: new Date(),
      endDate: addMonths(new Date(), 12),
      status: "active",
      amountCents: 2000,
      paymentId: "seed_demo",
    },
  });

  const events = [
    {
      slug: "session-ouverture",
      title: "Session d'ouverture — Skatepark central",
      date: new Date("2026-09-13T14:00:00Z"),
      location: "Skatepark central, rue des Tilleuls",
      description:
        "On relance la saison ensemble. Prêt de matériel pour les débutants, coaching libre par les membres.",
      capacity: 60,
    },
    {
      slug: "jam-street-gare",
      title: "Jam street — Place de la Gare",
      date: new Date("2026-10-04T15:00:00Z"),
      location: "Place de la Gare",
      description: "Format best-trick sur le spot. Musique, cash-for-tricks et barbecue à suivre.",
      capacity: 40,
    },
    {
      slug: "contest-indoor",
      title: "Contest indoor — Halle couverte",
      date: new Date("2026-11-08T13:00:00Z"),
      location: "Halle couverte",
      description: "Clôture de la première saison. Catégories minimes, amateurs et open.",
      capacity: 80,
    },
    {
      slug: "atelier-reparation",
      title: "Atelier réparation & montage",
      date: new Date("2026-12-06T15:00:00Z"),
      location: "Local associatif",
      description: "Changer un roulement, monter des trucks, régler sa planche. Outils fournis.",
      capacity: 20,
    },
  ];

  for (const e of events) {
    await prisma.event.upsert({ where: { slug: e.slug }, update: e, create: e });
  }

  const spots = [
    {
      name: "Skatepark central",
      address: "Parc municipal, rue des Tilleuls",
      type: "park" as const,
      description: "Bowl, street plaza, éclairé jusqu'à 22 h.",
    },
    {
      name: "Place de la Gare",
      address: "Parvis de la gare",
      type: "street" as const,
      description: "Ledges, gap et escaliers 3-4 marches. À rider hors heures de pointe.",
    },
    {
      name: "Le spot sous le pont",
      address: "Quai bas, sous le pont de la Concorde",
      type: "bowl" as const,
      description: "Quarter et banks construits par la communauté. Sessions nettoyage régulières.",
    },
  ];

  for (const s of spots) {
    const existing = await prisma.spot.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.spot.create({ data: s });
  }

  await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId: (await prisma.event.findUniqueOrThrow({ where: { slug: "session-ouverture" } })).id,
        userId: member.id,
      },
    },
    update: {},
    create: {
      eventId: (await prisma.event.findUniqueOrThrow({ where: { slug: "session-ouverture" } })).id,
      userId: member.id,
    },
  });

  console.log("Seed terminé.");
  console.log("  admin  : admin@deuxsaisonsdeplanche.fr / password123");
  console.log("  membre : member@deuxsaisonsdeplanche.fr / password123");
  console.log(`  (${admin.email}, ${member.email})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
