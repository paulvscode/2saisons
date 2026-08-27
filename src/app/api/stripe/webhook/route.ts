import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Webhook Stripe : confirme l'adhésion après paiement réussi.
 * Config : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 */
export async function POST(req: Request) {
  if (!stripe) return new NextResponse("Stripe non configuré", { status: 501 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("Signature manquante", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return new NextResponse(`Signature invalide: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const membershipId = session.metadata?.membershipId;
    if (membershipId && session.payment_status === "paid") {
      await prisma.membership.update({
        where: { id: membershipId },
        data: {
          status: "active",
          paymentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? session.id),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
