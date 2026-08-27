import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/compte");

  return (
    <div className="auth-wrap">
      <h1>Créer un compte</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Le compte te donne accès à ton espace membre. L'adhésion se règle ensuite depuis la page
        dédiée.
      </p>
      <RegisterForm next={params.next} />
      <p className="auth-switch">
        Déjà membre ? <Link href="/login">Se connecter</Link>
      </p>
    </div>
  );
}
