import { estimatedSystemPriceEur } from "@/lib/pricing";
import { z } from "zod";

export const quoteFormSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    streetLine: z.string().min(2, "Enter street and house number"),
    city: z.string().min(2, "Enter city"),
    country: z.string().min(2, "Enter country"),
    monthlyConsumptionKwh: z.coerce
      .number()
      .positive("Must be greater than 0")
      .max(50000, "Enter a realistic value"),
    systemSizeKw: z.coerce
      .number()
      .positive("Must be greater than 0")
      .max(200, "Enter a realistic system size"),
    downPayment: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number().min(0, "Cannot be negative").optional(),
    ),
    addressLat: z.number().optional(),
    addressLon: z.number().optional(),
    confirmedUnverifiedAddress: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const down = data.downPayment ?? 0;
    const systemPriceEur = estimatedSystemPriceEur(data.systemSizeKw);
    if (down >= systemPriceEur) {
      const formatted = new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(systemPriceEur);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be less than the estimated system price (${formatted}).`,
        path: ["downPayment"],
      });
    }
  });

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
