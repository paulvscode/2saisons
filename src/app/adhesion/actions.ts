"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { fieldErrors, membershipSchema } from "@/lib/validation";
import { stripe, stripeEnabled, appUrl } from "@/lib/stripe";
import { addMonths } from "@/lib/format";
import type { FormState } from "@/lib/action-types";

export type MembershipState = FormState;

/**
 * Formulaire d'adhésion / don.
 * - Crée le compte membre si l'utilisateur n'est pas connecté.
 * - Crée une adhésion "pending".
 * - Redirige vers Stripe Checkout, ou valide directement si Stripe n'est pas configuré (mode démo local).
 */
export async function submitMembership(
  _prev: MembershipState,
  formData: FormData,
): Promise<MembershipState> {
  const parsed = membershipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Merci de corriger les champs indiqués.",
      errors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  let user = await getCurrentUser();

  if (!user) {
    if (!data.password || data.password.length < 8) {
      return {
        ok: false,
        message: "Choisis un mot de passe (8 caractères min.) pour créer ton espace membre.",
        errors: { password: "8 caractères minimum" },
      };
    }
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return {
        ok: false,
        message: "Un compte existe déjà avec cet e-mail. Connecte-toi puis réessaie.",
        errors: { email: "E-mail déjà utilisé" },
      };
    }
    user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        passwordHash: await hashPassword(data.password),
      },
    });
    await createSession({ userId: user.id, role: user.role });
  }

  const months = Number(process.env.MEMBERSHIP_DURATION_MONTHS ?? 12);
  const start = new Date();

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      startDate: start,
      endDate: addMonths(start, months),
      amountCents: data.amountCents,
      status: "pending",
    },
  });

  // --- Mode démo : pas de clé Stripe -> adhésion validée immédiatement ---
  if (!stripeEnabled || !stripe) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "active", paymentId: "demo_no_payment" },
    });
    redirect("/compte?welcome=1");
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: data.amountCents,
          product_data: {
            name:
              data.kind === "don"
                ? "Don — Deux saisons de planche"
                : "Adhésion annuelle — Deux saisons de planche",
          },
        },
      },
    ],
    success_url: appUrl("/compte?welcome=1&session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: appUrl("/adhesion?canceled=1#adherer"),
    metadata: { membershipId: membership.id, userId: user.id, kind: data.kind },
  });

  redirect(checkout.url!);
}
