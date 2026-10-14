import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readResults } from "@/lib/quiz";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Export CSV des participations à un quiz : une ligne par participant et par question (réservé admin). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
      submissions: { orderBy: [{ score: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!quiz) return new NextResponse("Introuvable", { status: 404 });

  const header = ["rang", "pseudo", "ip", "score", "total", "date", "question_n", "question", "reponse", "bonne_reponse", "juste"];
  const rows = quiz.submissions.flatMap((s, i) =>
    readResults(s.results).map((r, j) =>
      [
        i + 1,
        s.name,
        s.ip ?? "",
        s.score,
        s.total,
        s.createdAt.toISOString().slice(0, 16).replace("T", " "),
        j + 1,
        r.question ?? quiz.questions.find((q) => q.id === r.questionId)?.text ?? "",
        r.chosen?.map((c) => c.text).join(" | ") ?? "",
        r.expected?.map((c) => c.text).join(" | ") ?? "",
        r.correct ? "oui" : "non",
      ]
        .map(csvCell)
        .join(";"),
    ),
  );

  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");
  const slug = quiz.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug.startsWith("quiz") ? slug : `quiz-${slug || "export"}`}.csv"`,
    },
  });
}
