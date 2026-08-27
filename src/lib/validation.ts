import { z } from "zod";

/** "" / null -> undefined : les champs de formulaire vides ne doivent pas casser la validation. */
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const emailSchema = z.string().trim().toLowerCase().email("E-mail invalide");

export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum")
  .max(128, "Mot de passe trop long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  firstname: z.string().trim().min(1, "Prénom requis").max(80),
  lastname: z.string().trim().min(1, "Nom requis").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  firstname: z.string().trim().min(1).max(80),
  lastname: z.string().trim().min(1).max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const membershipSchema = z
  .object({
    kind: z.enum(["adhesion", "don", "benevolat"]).default("adhesion"),
    firstname: z.string().trim().min(1, "Prénom requis").max(80),
    lastname: z.string().trim().min(1, "Nom requis").max(80),
    email: emailSchema,
    amountEuros: z.coerce.number().min(0).max(10_000).default(20),
    message: z.string().trim().max(1000).optional(),
    consent: z
      .string()
      .optional()
      .refine((v) => v === "on", { message: "Le consentement est requis." }),
    // Champs présents uniquement si l'utilisateur n'est pas connecté
    password: z.string().optional(),
  })
  .transform((v) => ({ ...v, amountCents: Math.round(v.amountEuros * 100) }));

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug : minuscules, chiffres et tirets uniquement"),
  date: z.coerce.date(),
  endDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()).transform((v) => v ?? null),
  location: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  imageUrl: z
    .preprocess(emptyToUndefined, z.string().trim().url("URL invalide").optional())
    .transform((v) => v ?? null),
  capacity: z
    .preprocess(emptyToUndefined, z.coerce.number().int().positive().optional())
    .transform((v) => v ?? null),
  published: z.coerce.boolean().default(true),
});

export const spotSchema = z.object({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(200),
  type: z.enum(["street", "park", "bowl"]),
  description: z.string().trim().min(1).max(2000),
  latitude: z
    .preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional())
    .transform((v) => v ?? null),
  longitude: z
    .preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional())
    .transform((v) => v ?? null),
});

export const documentSchema = z.object({
  type: z.enum(["medical_certificate", "insurance"]),
});

/** Petit utilitaire : transforme une erreur Zod en map champ -> message. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
