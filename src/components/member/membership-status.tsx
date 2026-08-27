import Link from "next/link";
import type { MembershipView } from "@/lib/auth";
import { formatDateLong, formatEuros } from "@/lib/format";

const BADGE: Record<MembershipView["status"], string> = {
  active: "badge badge--ok",
  expiring: "badge badge--warn",
  expired: "badge badge--err",
  pending: "badge badge--warn",
  none: "badge badge--muted",
};

export function MembershipStatus({ view }: { view: MembershipView }) {
  const { status, label, current, daysLeft } = view;

  return (
    <div className={`status-banner status-banner--${status}`}>
      <span className={BADGE[status]}>{label}</span>

      {current ? (
        <>
          <p className="card__value" style={{ fontSize: "var(--step-1)" }}>
            {status === "expired"
              ? `Expirée le ${formatDateLong(current.endDate)}`
              : `Valable jusqu'au ${formatDateLong(current.endDate)}`}
          </p>
          <p className="muted">
            {status === "expiring" && daysLeft != null
              ? `Il reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""}. Pense à renouveler.`
              : status === "pending"
                ? "Nous attendons la confirmation du paiement."
                : `Cotisation ${formatEuros(current.amountCents)} · démarrée le ${formatDateLong(
                    current.startDate,
                  )}`}
          </p>
        </>
      ) : (
        <p className="muted">Tu n'as pas encore d'adhésion active pour la saison.</p>
      )}

      <div className="inline-actions" style={{ marginTop: ".5rem" }}>
        {(status === "expired" || status === "expiring" || status === "none") && (
          <Link className="btn btn--sm" href="/adhesion#adherer">
            {status === "none" ? "Adhérer" : "Renouveler"}
          </Link>
        )}
        {status === "pending" && (
          <Link className="btn btn--sm btn--ghost" href="/adhesion#adherer">
            Reprendre le paiement
          </Link>
        )}
        {current && (status === "active" || status === "expiring") && (
          <a className="link-btn" href={`/api/receipt/${current.id}`} target="_blank" rel="noreferrer">
            Télécharger le reçu
          </a>
        )}
      </div>
    </div>
  );
}
