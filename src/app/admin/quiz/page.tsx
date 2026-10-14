import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Disclosure } from "@/components/disclosure";
import { QuizForm } from "./quiz-form";

export const metadata: Metadata = { title: "Quiz — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminQuizListPage() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, submissions: true } } },
  });

  return (
    <>
      <div className="app-header">
        <h1>Quiz</h1>
      </div>

      <section className="card">
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Nouveau quiz
        </h2>
        <Disclosure label="+ Créer un quiz" openLabel="Annuler" className="btn btn--sm">
          <QuizForm />
        </Disclosure>
      </section>

      <div className="table-scroll" style={{ marginTop: "var(--space-l)" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Questions</th>
              <th>Participants</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td>
                  <Link href={`/admin/quiz/${q.id}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
                    {q.title}
                  </Link>
                </td>
                <td>{q._count.questions}</td>
                <td>{q._count.submissions}</td>
                <td>
                  {q.published ? (
                    <span className="badge">Publié</span>
                  ) : (
                    <span className="badge badge--muted">Brouillon</span>
                  )}
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Aucun quiz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
