import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="app-shell">
      <AppNav
        title="Mon espace"
        items={[
          { href: "/compte", label: "Tableau de bord" },
          { href: "/compte/evenements", label: "Mes événements" },
          { href: "/compte/justificatifs", label: "Justificatifs" },
          { href: "/compte/parametres", label: "Mon compte" },
        ]}
      />
      <div className="app-main">{children}</div>
    </div>
  );
}
