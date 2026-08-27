import { requireAdmin } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="app-shell">
      <AppNav
        title="Administration"
        items={[
          { href: "/admin", label: "Tableau de bord" },
          { href: "/admin/membres", label: "Membres" },
          { href: "/admin/evenements", label: "Événements" },
          { href: "/admin/spots", label: "Spots" },
          { href: "/admin/taches", label: "Tâches" },
        ]}
      />
      <div className="app-main">{children}</div>
    </div>
  );
}
