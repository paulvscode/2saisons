import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { MapEmbed } from "./map-embed";

export const metadata: Metadata = {
  title: "Événements & Spots",
  description: "La carte des spots de skate du Havre et des exemples de skate-urbanisme ailleurs.",
};

export default async function EventsPage() {
  const c = await getContent();
  // Une ligne = « Titre | URL » ; les lignes mal formées sont ignorées.
  const links = c["events.links"].split("\n").flatMap((line) => {
    const [title, url] = line.split("|").map((part) => part.trim());
    if (!title || !/^https?:\/\//.test(url ?? "")) return [];
    try {
      return [{ title, url, host: new URL(url).hostname.replace(/^www\./, "") }];
    } catch {
      return [];
    }
  });

  return (
    <>
      <section className="page-intro wrap">
        <h1>{c["events.title"]}</h1>
      </section>

      <section className="section section--tight wrap wrap--wide">
        <MapEmbed query={c["events.map.query"]} />
      </section>

      {links.length > 0 && (
        <section className="section wrap" aria-labelledby="links-title">
          <h2 className="h-l" id="links-title">
            {c["events.links.title"]}
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
      )}
    </>
  );
}
