"use client";

import { useState, useTransition } from "react";
import { reviewDocument, setMembershipStatus } from "../actions";

export function MembershipActions({
  membershipId,
  status,
}: {
  membershipId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="inline-actions">
      {status !== "active" && (
        <button
          className="btn btn--sm"
          disabled={pending}
          onClick={() => start(() => setMembershipStatus(membershipId, "active").then(() => {}))}
        >
          {pending ? "…" : "Activer"}
        </button>
      )}
      {status === "active" && (
        <button
          className="link-btn link-btn--danger"
          disabled={pending}
          onClick={() => start(() => setMembershipStatus(membershipId, "expired").then(() => {}))}
        >
          Marquer expirée
        </button>
      )}
    </div>
  );
}

export function DocumentReview({ documentId, status }: { documentId: string; status: string }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  if (status === "approved") return <span className="badge badge--ok">Validé</span>;

  return (
    <div className="inline-actions" style={{ flexDirection: "column", alignItems: "flex-start" }}>
      <div className="inline-actions">
        <button
          className="btn btn--sm"
          disabled={pending}
          onClick={() => start(() => reviewDocument(documentId, "approved").then(() => {}))}
        >
          {pending ? "…" : "Valider"}
        </button>
        <button
          className="link-btn link-btn--danger"
          disabled={pending}
          onClick={() => setRejecting((v) => !v)}
        >
          Refuser
        </button>
      </div>
      {rejecting && (
        <div className="inline-actions" style={{ marginTop: ".5rem" }}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motif du refus"
            style={{ minHeight: 40, padding: "0 .5rem", border: "1px solid var(--fg)" }}
          />
          <button
            className="link-btn link-btn--danger"
            disabled={pending || !note.trim()}
            onClick={() =>
              start(() => reviewDocument(documentId, "rejected", note.trim()).then(() => setRejecting(false)))
            }
          >
            Confirmer le refus
          </button>
        </div>
      )}
      {status === "rejected" && <span className="badge badge--err">Refusé</span>}
    </div>
  );
}
