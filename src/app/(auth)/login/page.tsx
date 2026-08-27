import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect(user.role === "admin" ? "/admin" : "/compte");

  return (
    <div className="auth-wrap">
      <h1>Connexion</h1>
      <LoginForm next={params.next} />
      <p className="auth-switch">
        Pas encore de compte ? <Link href="/register">Créer un compte</Link>
        <br />
        Tu veux adhérer ? <Link href="/adhesion#adherer">Formulaire d'adhésion</Link>
      </p>
    </div>
  );
}
