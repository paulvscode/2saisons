import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Export CSV de la liste des membres (réservé admin). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { lastname: "asc" },
    include: {
      memberships: { orderBy: { endDate: "desc" }, take: 1 },
      documents: true,
      _count: { select: { registrations: true } },
    },
  });

  const header = [
    "prenom",
    "nom",
    "email",
    "telephone",
    "role",
    "inscription",
    "adhesion_statut",
    "adhesion_fin",
    "adhesion_montant_eur",
    "certificat_medical",
    "attestation_assurance",
    "evenements",
  ];

  const rows = users.map((u) => {
    const m = u.memberships[0];
    const docStatus = (t: string) => u.documents.find((d) => d.type === t)?.status ?? "absent";
    return [
      u.firstname,
      u.lastname,
      u.email,
      u.phone ?? "",
      u.role,
      u.createdAt.toISOString().slice(0, 10),
      m?.status ?? "aucune",
      m ? m.endDate.toISOString().slice(0, 10) : "",
      m ? (m.amountCents / 100).toFixed(2) : "",
      docStatus("medical_certificate"),
      docStatus("insurance"),
      u._count.registrations,
    ].map(csvCell).join(";");
  });

  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membres-2sdp-${date}.csv"`,
    },
  });
}
