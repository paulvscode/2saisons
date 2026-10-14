import type { Metadata } from "next";
import Link from "next/link";
import { getContent, listMedia, MEDIA_ACCEPT, MEDIA_ACCEPT_VECTOR } from "@/lib/content";
import { CONTENT_SECTIONS } from "@/lib/content-schema";
import { ActionButton } from "@/components/action-button";
import { resetContentSection } from "./actions";
import { SectionForm } from "./section-form";

export const metadata: Metadata = { title: "Contenu du site — Admin" };

export default async function AdminContentPage() {
  const [values, media] = await Promise.all([getContent(), listMedia()]);
  const mediaUrls = media.map((m) => m.url);

  return (
    <>
      <div className="app-header">
        <h1>Contenu du site</h1>
      </div>

      {process.env.VERCEL && (
        <p className="alert alert--err" role="status" style={{ marginBottom: "var(--space-m)" }}>
          Lecture seule sur le site en ligne : modifie les textes et images sur ta version locale
          (localhost), puis publie avec un push.
        </p>
      )}
      <p className="muted" style={{ maxWidth: "60ch" }}>
        Textes et images des pages publiques. Chaque section s'enregistre séparément. Les images
        viennent de la <Link href="/admin/medias">médiathèque</Link> ou peuvent être téléversées
        directement ici.
      </p>

      <nav className="content-toc" aria-label="Sections">
        {CONTENT_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      {CONTENT_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="card content-section">
          <div className="content-section__head">
            <h2 className="h-m">{section.title}</h2>
            <div className="inline-actions">
              <Link className="link-btn" href={section.href} target="_blank">
                Voir sur le site ↗
              </Link>
              <ActionButton
                action={resetContentSection}
                id={section.id}
                className="link-btn"
                confirm={`Rétablir les valeurs par défaut de « ${section.title} » ?`}
              >
                Réinitialiser
              </ActionButton>
            </div>
          </div>
          <SectionForm
            section={section}
            values={values}
            media={mediaUrls}
            accept={MEDIA_ACCEPT}
            acceptVector={MEDIA_ACCEPT_VECTOR}
          />
        </section>
      ))}
    </>
  );
}
