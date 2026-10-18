import { z } from 'astro/zod';
import type { SalaryRates } from './logic';

// Validates the `data` of src/data/rates/apit.json (see logic.test.ts). Not imported by Tool.tsx.

const fraction = z.number().min(0).max(1);

export const salaryRatesSchema = z
  .object({
    apit: z
      .object({
        personalReliefAnnual: z.number().nonnegative(),
        bands: z
          .array(z.object({ width: z.number().positive().nullable(), rate: fraction }).strict())
          .min(1)
          .refine(
            (bands) => bands.every((b, i) => (b.width === null) === (i === bands.length - 1)),
            'Only the last band may (and must) have width null.',
          )
          .refine(
            (bands) => bands.every((b, i) => i === 0 || b.rate >= bands[i - 1].rate),
            'Band rates must not decrease.',
          ),
      })
      .strict(),
    epf: z.object({ employeeRate: fraction, employerRate: fraction }).strict(),
    etf: z.object({ employerRate: fraction }).strict(),
  })
  .strict() satisfies z.ZodType<SalaryRates>;
