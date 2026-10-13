import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { MapEmbed } from "./map-embed";

export const metadata: Metadata = {
  title: "Événements & Spots",
  description: "La carte des spots de skate du Havre.",
};

export default async function EventsPage() {
  const c = await getContent();

  return (
    <>
      <section className="page-intro wrap">
        <h1>{c["events.title"]}</h1>
      </section>

      <section className="section section--tight wrap wrap--wide">
        <MapEmbed query={c["events.map.query"]} />
      </section>
    </>
  );
}
