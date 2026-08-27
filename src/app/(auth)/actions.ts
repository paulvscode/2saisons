"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validation";
import type { FormState } from "@/lib/action-types";

export type AuthState = FormState;

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!user || !ok) {
    return { message: "E-mail ou mot de passe incorrect." };
  }

  await createSession({ userId: user.id, role: user.role });
  const next = safeNext(formData.get("next"));
  redirect(next || (user.role === "admin" ? "/admin" : "/compte"));
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { errors: { email: "Un compte existe déjà avec cet e-mail." } };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      firstname: parsed.data.firstname,
      lastname: parsed.data.lastname,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")) || "/compte");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
