import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, getMembershipView } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday, DOC_TYPE_LABEL } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { MembershipStatus } from "@/components/member/membership-status";
import { ActionButton } from "@/components/action-button";
import { registerToEvent, unregisterFromEvent } from "./actions";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser();
  const { welcome } = await searchParams;

  const [membershipView, myRegs, upcoming, docs] = await Promise.all([
    getMembershipView(user.id),
    prisma.eventRegistration.findMany({
      where: { userId: user.id, status: "registered", event: { date: { gte: startOfToday() } } },
      include: { event: true },
      orderBy: { event: { date: "asc" } },
    }),
    prisma.event.findMany({
      where: { published: true, date: { gte: startOfToday() } },
      orderBy: { date: "asc" },
      take: 5,
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.document.findMany({ where: { userId: user.id } }),
  ]);

  const registeredIds = new Set(myRegs.map((r) => r.eventId));
  const missingDocs = (["medical_certificate", "insurance"] as const).filter(
    (t) => !docs.some((d) => d.type === t && d.status !== "rejected"),
  );

  return (
    <>
      <div className="app-header">
        <h1>Bonjour {user.firstname}</h1>
        <Link className="link-btn" href="/compte/parametres">
          Gérer mon compte
        </Link>
      </div>

      {welcome && (
        <p className="alert alert--ok">
          Bienvenue dans l'association ! Ton adhésion est enregistrée.
        </p>
      )}

      <MembershipStatus view={membershipView} />

      <div className="stat-grid">
        <div className="card">
          <p className="card__label">Événements à venir</p>
          <p className="card__value">{myRegs.length}</p>
        </div>
        <div className="card">
          <p className="card__label">Justificatifs validés</p>
          <p className="card__value">{docs.filter((d) => d.status === "approved").length}/2</p>
        </div>
        <div className="card">
          <p className="card__label">Membre depuis</p>
          <p className="card__value" style={{ fontSize: "var(--step-1)" }}>
            {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {missingDocs.length > 0 && (
        <p className="alert alert--err">
          Justificatif(s) manquant(s) : {missingDocs.map((t) => DOC_TYPE_LABEL[t]).join(", ")}.{" "}
          <Link href="/compte/justificatifs" style={{ textDecoration: "underline" }}>
            Téléverser maintenant
          </Link>
        </p>
      )}

      <section style={{ marginTop: "var(--space-l)" }}>
        <h2 className="h-m">Mes prochains événements</h2>
        {myRegs.length > 0 ? (
          <ol className="events" style={{ marginTop: "1.5rem" }}>
            {myRegs.map(({ event }) => (
              <li key={event.id} className="event event--action">
                <p className="event__date">{formatDate(event.date)}</p>
                <div className="event__body stack">
                  <h3 className="event__title">{event.title}</h3>
                  <p className="event__meta">
                    {formatTime(event.date)} · {event.location}
                  </p>
                </div>
                <ActionButton
                  action={unregisterFromEvent}
                  id={event.id}
                  className="btn btn--sm btn--ghost"
                  pendingLabel="…"
                  confirm="Annuler ton inscription à cet événement ?"
                >
                  Se désinscrire
                </ActionButton>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted" style={{ marginTop: "1rem" }}>
            Tu n'es inscrit·e à aucun événement à venir.
          </p>
        )}
      </section>

      <section style={{ marginTop: "var(--space-l)" }}>
        <h2 className="h-m">S'inscrire en un clic</h2>
        <ol className="events" style={{ marginTop: "1.5rem" }}>
          {upcoming.map((event) => {
            const full = Boolean(event.capacity && event._count.registrations >= event.capacity);
            const already = registeredIds.has(event.id);
            return (
              <li key={event.id} className="event event--action">
                <p className="event__date">{formatDate(event.date)}</p>
                <div className="event__body stack">
                  <h3 className="event__title">{event.title}</h3>
                  <p className="event__meta">
                    {formatTime(event.date)} · {event.location}
                    {event.capacity
                      ? ` · ${event._count.registrations}/${event.capacity}`
                      : ""}
                  </p>
                </div>
                {already ? (
                  <span className="badge badge--ok">Inscrit·e</span>
                ) : full ? (
                  <span className="badge badge--muted">Complet</span>
                ) : (
                  <ActionButton action={registerToEvent} id={event.id} pendingLabel="…">
                    S'inscrire
                  </ActionButton>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
