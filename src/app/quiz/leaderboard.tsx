type Entry = { id: string; name: string; score: number; total: number };

/** Classement public du quiz (meilleur score d'abord). */
export function Leaderboard({
  entries,
  participants,
  averageScore,
  total,
  highlightId,
}: {
  entries: Entry[];
  participants: number;
  averageScore: number;
  total: number;
  highlightId?: string;
}) {
  return (
    <section className="section section--tight wrap" aria-labelledby="ranking-title">
      <h2 className="h-l" id="ranking-title">
        Classement
      </h2>
      <div className="stat-grid quiz__stats">
        <div className="card">
          <p className="card__label">Participants</p>
          <p className="card__value">{participants}</p>
        </div>
        <div className="card">
          <p className="card__label">Score moyen</p>
          <p className="card__value">
            {participants > 0 ? averageScore.toFixed(1).replace(".", ",") : "–"}
            <small> / {total}</small>
          </p>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="muted">Personne n'a encore participé. Sois le premier ou la première !</p>
      ) : (
        <ol className="ranking">
          {entries.map((e, i) => (
            <li key={e.id} className="ranking__row" aria-current={e.id === highlightId ? "true" : undefined}>
              <span className="ranking__rank">{i + 1}</span>
              <span className="ranking__name">{e.name}</span>
              <span className="ranking__score">
                {e.score} / {e.total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
