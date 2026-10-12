import type { Metadata } from "next";
import { getContent, listMedia, mediaUsage, MEDIA_ACCEPT } from "@/lib/content";
import { ActionButton } from "@/components/action-button";
import { removeMedia } from "../contenu/actions";
import { UploadForm } from "./upload-form";
import { CopyUrl } from "./copy-url";

export const metadata: Metadata = { title: "Médiathèque — Admin" };

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function AdminMediaPage() {
  const [media, content] = await Promise.all([listMedia(), getContent()]);

  return (
    <>
      <div className="app-header">
        <h1>Médiathèque</h1>
      </div>

      <section className="card">
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Ajouter des images
        </h2>
        <UploadForm accept={MEDIA_ACCEPT} />
      </section>

      {media.length === 0 ? (
        <p className="muted" style={{ marginTop: "var(--space-l)" }}>
          Aucune image pour le moment.
        </p>
      ) : (
        <ul className="media-grid">
          {media.map((m) => {
            const usage = mediaUsage(content, m.url);
            return (
              <li key={m.name} className="media-tile">
                <a href={m.url} target="_blank" rel="noreferrer" className="media-tile__img">
                  <img src={m.url} alt="" loading="lazy" />
                </a>
                <div className="media-tile__body">
                  <p className="media-tile__name" title={m.name}>
                    {m.name}
                  </p>
                  <p className="field__hint">
                    {formatSize(m.size)} ·{" "}
                    {usage.length > 0 ? `Utilisée : ${usage.map((u) => u.label).join(", ")}` : "Non utilisée"}
                  </p>
                  <div className="inline-actions">
                    <CopyUrl url={m.url} />
                    {usage.length === 0 && (
                      <ActionButton
                        action={removeMedia}
                        id={m.name}
                        className="link-btn link-btn--danger"
                        confirm={`Supprimer ${m.name} ?`}
                      >
                        Supprimer
                      </ActionButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
