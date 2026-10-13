import type { Metadata } from "next";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Liens",
  description:
    "Exemples de skate-urbanisme en France et en Europe, et d'autres liens utiles.",
};

/** Une ligne = « Titre | URL » ; les lignes mal formées sont ignorées. */
function parseLinks(text: string) {
  return text.split("\n").flatMap((line) => {
    const [title, url] = line.split("|").map((part) => part.trim());
    if (!title || !/^https?:\/\//.test(url ?? "")) return [];
    try {
      return [{ title, url, host: new URL(url).hostname.replace(/^www\./, "") }];
    } catch {
      return [];
    }
  });
}

function LinkSection({ id, title, text }: { id: string; title: string; text: string }) {
  const links = parseLinks(text);
  if (links.length === 0) return null;
  return (
    <section className="section section--tight wrap" aria-labelledby={`${id}-title`}>
      <h2 className="h-l" id={`${id}-title`}>
        {title}
      </h2>
      <ul className="link-list">
        {links.map((link) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="link-list__title">{link.title}</span>
              <span className="link-list__host">
                {link.host} <span aria-hidden="true">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function LinksPage() {
  const c = await getContent();

  return (
    <>
      <section className="page-intro wrap">
        <h1>{c["links.title"]}</h1>
      </section>

      <LinkSection id="inspirations" title={c["links.inspirations.title"]} text={c["links.inspirations"]} />
      <LinkSection id="partners" title={c["links.partners.title"]} text={c["links.partners"]} />
    </>
  );
}
