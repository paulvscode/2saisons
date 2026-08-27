import "server-only";
import { prisma } from "@/lib/prisma";

export function getUpcomingEvents(limit?: number) {
  return prisma.event.findMany({
    where: { published: true, date: { gte: startOfToday() } },
    orderBy: { date: "asc" },
    take: limit,
    include: { _count: { select: { registrations: true } } },
  });
}

export function getAllEventsForAdmin() {
  return prisma.event.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { registrations: true } } },
  });
}

export function getSpots() {
  return prisma.spot.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const SPOT_TYPE_LABEL: Record<string, string> = {
  street: "Street",
  park: "Skatepark",
  bowl: "Bowl / DIY",
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  medical_certificate: "Certificat médical",
  insurance: "Attestation d'assurance",
};
