import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/queries";
import { formatEuros, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord — Admin" };

export default async function AdminDashboard() {
  const now = new Date();

  const [activeMembers, pendingMemberships, collected, pendingDocs, upcoming, totalMembers] =
    await Promise.all([
      prisma.membership.count({ where: { status: "active", endDate: { gte: now } } }),
      prisma.membership.count({ where: { status: "pending" } }),
      prisma.membership.aggregate({
        _sum: { amountCents: true },
        where: { status: { in: ["active", "expired"] } },
      }),
      prisma.document.count({ where: { status: "pending" } }),
      prisma.event.findMany({
        where: { date: { gte: startOfToday() } },
        orderBy: { date: "asc" },
        take: 5,
        include: { _count: { select: { registrations: true } } },
      }),
      prisma.user.count({ where: { role: "member" } }),
    ]);

  return (
    <>
      <div className="app-header">
        <h1>Tableau de bord</h1>
        <Link className="link-btn" href="/api/admin/members/export">
          Export CSV membres
        </Link>
      </div>

      <div className="stat-grid">
        <div className="card">
          <p className="card__label">Membres actifs</p>
          <p className="card__value">{activeMembers}</p>
        </div>
        <div className="card">
          <p className="card__label">Cotisations perçues</p>
          <p className="card__value">{formatEuros(collected._sum.amountCents ?? 0)}</p>
        </div>
        <div className="card">
          <p className="card__label">Comptes membres</p>
          <p className="card__value">{totalMembers}</p>
        </div>
        <div className="card">
          <p className="card__label">Adhésions à valider</p>
          <p className="card__value">{pendingMemberships}</p>
        </div>
        <div className="card">
          <p className="card__label">Justificatifs à vérifier</p>
          <p className="card__value">{pendingDocs}</p>
        </div>
      </div>

      {(pendingMemberships > 0 || pendingDocs > 0) && (
        <p className="alert alert--err">
          {pendingMemberships > 0 && `${pendingMemberships} adhésion(s) en attente. `}
          {pendingDocs > 0 && `${pendingDocs} justificatif(s) à vérifier. `}
          <Link href="/admin/membres" style={{ textDecoration: "underline" }}>
            Traiter
          </Link>
        </p>
      )}

      <section style={{ marginTop: "var(--space-l)" }}>
        <h2 className="h-m">Prochains événements</h2>
        <div className="table-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Événement</th>
                <th>Inscrits</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>
                    <Link href="/admin/evenements" style={{ textDecoration: "underline" }}>
                      {e.title}
                    </Link>
                  </td>
                  <td>
                    {e._count.registrations}
                    {e.capacity ? ` / ${e.capacity}` : ""}
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    Aucun événement à venir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
