import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard, type KanbanCard } from "./kanban-board";

export const metadata: Metadata = { title: "Tâches — Admin" };

// Le tableau change souvent (plusieurs admins) : pas de cache.
export const dynamic = "force-dynamic";

export default async function TachesPage() {
  await requireAdmin();

  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: { createdBy: { select: { firstname: true, lastname: true } } },
  });

  const cards: KanbanCard[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    position: t.position,
    author: `${t.createdBy.firstname} ${t.createdBy.lastname}`.trim(),
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="app-header">
        <h1>Tâches</h1>
        <span className="muted">
          {cards.length} carte{cards.length > 1 ? "s" : ""}
        </span>
      </div>

      <p className="muted" style={{ marginBottom: "var(--space-l)", maxWidth: "52ch" }}>
        Kanban partagé de l'équipe admin. Glisse les cartes d'une colonne à l'autre (ou utilise les
        flèches sur mobile). Le tableau se rafraîchit automatiquement.
      </p>

      <KanbanBoard initialCards={cards} />
    </>
  );
}
