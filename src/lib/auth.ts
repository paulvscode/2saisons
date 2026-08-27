import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Membership, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

/** Utilisateur courant (ou null). Mémoïsé le temps d'un rendu. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/compte");
  return user;
}

export type MembershipView = {
  status: "active" | "expiring" | "expired" | "pending" | "none";
  label: string;
  current: Membership | null;
  daysLeft: number | null;
};

/** Statut consolidé de la cotisation d'un membre (active / à renouveler / expirée). */
export async function getMembershipView(userId: string): Promise<MembershipView> {
  const current = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { endDate: "desc" },
  });

  if (!current) {
    return { status: "none", label: "Aucune adhésion", current: null, daysLeft: null };
  }

  const now = Date.now();
  const daysLeft = Math.ceil((current.endDate.getTime() - now) / 86_400_000);

  if (current.status === "pending") {
    return { status: "pending", label: "Paiement en attente", current, daysLeft };
  }
  if (current.status === "expired" || daysLeft <= 0) {
    return { status: "expired", label: "Adhésion expirée", current, daysLeft };
  }
  if (daysLeft <= 30) {
    return { status: "expiring", label: "À renouveler bientôt", current, daysLeft };
  }
  return { status: "active", label: "Adhésion active", current, daysLeft };
}
