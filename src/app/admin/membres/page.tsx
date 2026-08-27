import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DOC_TYPE_LABEL } from "@/lib/queries";
import { formatDate, formatEuros } from "@/lib/format";
import { MembershipActions, DocumentReview } from "./member-actions";

export const metadata: Metadata = { title: "Membres — Admin" };

const STATUS_OPTIONS = [
  ["", "Tous les statuts"],
  ["active", "Adhésion active"],
  ["pending", "En attente"],
  ["expired", "Expirée"],
  ["none", "Sans adhésion"],
] as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { firstname: { contains: q, mode: "insensitive" } },
      { lastname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status === "none") {
    where.memberships = { none: {} };
  } else if (status) {
    where.memberships = { some: { status: status as "active" | "pending" | "expired" } };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { orderBy: { endDate: "desc" }, take: 1 },
      documents: true,
      _count: { select: { registrations: true } },
    },
    take: 200,
  });

  return (
    <>
      <div className="app-header">
        <h1>Membres</h1>
        <a className="btn btn--sm" href="/api/admin/members/export">
          Export CSV
        </a>
      </div>

      <form className="toolbar" method="get">
        <input type="search" name="q" placeholder="Nom ou e-mail" defaultValue={q} />
        <select name="status" defaultValue={status}>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn btn--sm" type="submit">
          Filtrer
        </button>
        {(q || status) && (
          <Link className="link-btn" href="/admin/membres">
            Réinitialiser
          </Link>
        )}
        <span className="toolbar__spacer" />
        <span className="muted">{users.length} résultat(s)</span>
      </form>

      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Membre</th>
              <th>Adhésion</th>
              <th>Justificatifs</th>
              <th>Événements</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const m = u.memberships[0];
              return (
                <tr key={u.id}>
                  <td>
                    <strong>
                      {u.firstname} {u.lastname}
                    </strong>
                    <br />
                    <span className="field__hint">{u.email}</span>
                    <br />
                    <span className="field__hint">Inscrit le {formatDate(u.createdAt)}</span>
                  </td>
                  <td>
                    {m ? (
                      <>
                        <span
                          className={`badge ${
                            m.status === "active"
                              ? "badge--ok"
                              : m.status === "pending"
                                ? "badge--warn"
                                : "badge--err"
                          }`}
                        >
                          {m.status}
                        </span>
                        <br />
                        <span className="field__hint">
                          {formatEuros(m.amountCents)} · fin {formatDate(m.endDate)}
                        </span>
                        <br />
                        <MembershipActions membershipId={m.id} status={m.status} />
                      </>
                    ) : (
                      <span className="badge badge--muted">aucune</span>
                    )}
                  </td>
                  <td>
                    {u.documents.length === 0 && <span className="field__hint">—</span>}
                    {u.documents.map((d) => (
                      <div key={d.id} style={{ marginBottom: ".75rem" }}>
                        <a
                          className="link-btn"
                          href={`/api/documents/${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {DOC_TYPE_LABEL[d.type]}
                        </a>
                        <DocumentReview documentId={d.id} status={d.status} />
                      </div>
                    ))}
                  </td>
                  <td>{u._count.registrations}</td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Aucun membre ne correspond à ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
