"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/lib/action-types";
import { formatDate, formatTime } from "@/lib/format";
import { createTask, deleteTask, moveTask } from "./actions";
import { COLUMNS, type TaskStatus } from "./columns";

export type KanbanCard = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  author: string;
  createdAt: string;
};

/** Retire la carte, applique le nouveau statut, l'insère devant `beforeId` (ou à la fin). */
function reorder(
  cards: KanbanCard[],
  id: string,
  status: TaskStatus,
  beforeId: string | null,
): KanbanCard[] {
  const moved = cards.find((c) => c.id === id);
  if (!moved) return cards;
  const updated = { ...moved, status };
  const rest = cards.filter((c) => c.id !== id);

  if (beforeId == null || beforeId === id) return [...rest, updated];

  const out: KanbanCard[] = [];
  let inserted = false;
  for (const c of rest) {
    if (c.id === beforeId) {
      out.push(updated);
      inserted = true;
    }
    out.push(c);
  }
  if (!inserted) out.push(updated);
  return out;
}

export function KanbanBoard({ initialCards }: { initialCards: KanbanCard[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cards, setCards] = useState(initialCards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // Resynchronise dès que le serveur renvoie de nouvelles données.
  const signature = initialCards.map((c) => `${c.id}:${c.status}:${c.position}`).join("|");
  const prevSig = useRef(signature);
  if (prevSig.current !== signature) {
    prevSig.current = signature;
    setCards(initialCards);
  }

  // Rafraîchissement auto (cartes des autres admins), en pause pendant une action.
  useEffect(() => {
    const t = setInterval(() => {
      if (!isPending) router.refresh();
    }, 15000);
    return () => clearInterval(t);
  }, [router, isPending]);

  const commitMove = (id: string, status: TaskStatus, beforeId: string | null) => {
    setCards((prev) => reorder(prev, id, status, beforeId));
    startTransition(async () => {
      await moveTask(id, status, beforeId);
      router.refresh();
    });
  };

  const handleDrop = (status: TaskStatus, beforeId: string | null) => {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (id) commitMove(id, status, beforeId);
  };

  const shift = (card: KanbanCard, dir: -1 | 1) => {
    const i = COLUMNS.findIndex((c) => c.key === card.status);
    const next = COLUMNS[i + dir];
    if (next) commitMove(card.id, next.key, null);
  };

  const remove = (id: string) => {
    if (!window.confirm("Supprimer cette carte ?")) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  };

  return (
    <div className="kanban">
      {COLUMNS.map((col) => {
        const colCards = cards
          .filter((c) => c.status === col.key)
          .sort((a, b) => a.position - b.position);

        return (
          <section
            key={col.key}
            className={`kanban__col${overCol === col.key ? " is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setOverCol(null);
            }}
            onDrop={() => handleDrop(col.key, null)}
          >
            <header className="kanban__col-head">
              <span>{col.label}</span>
              <span className="badge badge--muted">{colCards.length}</span>
            </header>

            <div className="kanban__col-body">
              {colCards.map((card) => (
                <article
                  key={card.id}
                  className={`ktask${dragId === card.id ? " is-dragging" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    setDragId(card.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOverCol(col.key);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(col.key, card.id);
                  }}
                >
                  <p className="ktask__title">{card.title}</p>
                  {card.description && <p className="ktask__desc">{card.description}</p>}
                  <p className="ktask__meta">
                    {card.author} · {formatDate(card.createdAt)} à {formatTime(card.createdAt)}
                  </p>
                  <div className="ktask__actions">
                    <button
                      type="button"
                      aria-label="Déplacer à gauche"
                      disabled={card.status === COLUMNS[0].key}
                      onClick={() => shift(card, -1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Déplacer à droite"
                      disabled={card.status === COLUMNS[COLUMNS.length - 1].key}
                      onClick={() => shift(card, 1)}
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      className="ktask__del"
                      aria-label="Supprimer la carte"
                      onClick={() => remove(card.id)}
                    >
                      ✕
                    </button>
                  </div>
                </article>
              ))}

              {colCards.length === 0 && <p className="kanban__empty">Aucune carte</p>}

              <AddCard status={col.key} onAdded={() => router.refresh()} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AddCard({ status, onAdded }: { status: TaskStatus; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => {
      fd.set("status", status);
      const res = await createTask(fd);
      if (res.ok) {
        formRef.current?.reset();
        setOpen(false);
        onAdded();
      }
      return res;
    },
    {},
  );

  if (!open) {
    return (
      <button type="button" className="kanban__add" onClick={() => setOpen(true)}>
        + Ajouter une carte
      </button>
    );
  }

  return (
    <form ref={formRef} className="kanban__form" action={formAction}>
      <input name="title" placeholder="Titre de la tâche" required autoFocus maxLength={200} />
      <textarea name="description" placeholder="Détail (optionnel)" rows={2} maxLength={2000} />
      {state.message && !state.ok && <p className="field__error">{state.message}</p>}
      <div className="kanban__form-actions">
        <button type="submit" className="btn btn--sm" disabled={pending}>
          {pending ? "…" : "Ajouter"}
        </button>
        <button type="button" className="link-btn" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
