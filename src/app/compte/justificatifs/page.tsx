import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_TYPE_LABEL } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { deleteDocument } from "../actions";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Justificatifs" };

const STATUS_BADGE = {
  pending: { cls: "badge badge--warn", label: "En attente de validation" },
  approved: { cls: "badge badge--ok", label: "Validé" },
  rejected: { cls: "badge badge--err", label: "Refusé" },
} as const;

export default async function DocumentsPage() {
  const user = await requireUser();
  const docs = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <>
      <div className="app-header">
        <h1>Justificatifs</h1>
      </div>

      <p className="muted" style={{ marginBottom: "var(--space-l)", maxWidth: "52ch" }}>
        Deux justificatifs sont demandés pour pratiquer avec l'association : un{" "}
        <strong>certificat médical</strong> de non contre-indication et une{" "}
        <strong>attestation d'assurance</strong> responsabilité civile. Ils sont vérifiés par un·e
        responsable.
      </p>

      <UploadForm />

      <div className="doc-list" style={{ marginTop: "var(--space-l)" }}>
        {docs.map((doc) => {
          const badge = STATUS_BADGE[doc.status];
          return (
            <div key={doc.id} className="doc">
              <div>
                <p className="doc__name">{DOC_TYPE_LABEL[doc.type]}</p>
                <p className="field__hint">
                  {doc.filename} · déposé le {formatDate(doc.uploadedAt)}
                </p>
                {doc.status === "rejected" && doc.note && (
                  <p className="field__error">Motif : {doc.note}</p>
                )}
              </div>
              <div className="inline-actions">
                <span className={badge.cls}>{badge.label}</span>
                <a
                  className="link-btn"
                  href={`/api/documents/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Consulter
                </a>
                <ActionButton
                  action={deleteDocument}
                  id={doc.id}
                  className="link-btn link-btn--danger"
                  confirm="Supprimer ce justificatif ?"
                >
                  Supprimer
                </ActionButton>
              </div>
            </div>
          );
        })}
        {docs.length === 0 && <p className="muted">Aucun justificatif déposé pour le moment.</p>}
      </div>
    </>
  );
}
