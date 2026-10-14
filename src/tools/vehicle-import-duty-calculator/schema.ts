import { z } from 'astro/zod';
import type { VehicleDutyRates } from './logic';

// Validates src/data/rates/vehicle-duty.json once `data` is filled in (see logic.test.ts),
// so a typo in the gazette transcription fails the tests instead of producing wrong results.
// Not imported by Tool.tsx, so zod stays out of the client bundle.

const vehicleType = z.enum(['car', 'suv', 'van']);
const fuelType = z.enum(['petrol', 'diesel', 'petrol-hybrid', 'diesel-hybrid', 'electric']);
const money = z.number().nonnegative();
const fraction = z.number().min(0).max(10); // rates above 100% exist for some vehicles

const appliesTo = z
  .object({
    vehicleTypes: z.array(vehicleType).optional(),
    fuelTypes: z.array(fuelType).optional(),
    minCapacity: z.number().nonnegative().optional(),
    maxCapacity: z.number().positive().optional(),
  })
  .strict();

const exciseRate = z
  .object({ perUnit: money.optional(), adValorem: fraction.optional(), minimum: money.optional() })
  .strict()
  .refine((r) => r.perUnit !== undefined || r.adValorem !== undefined || r.minimum !== undefined, {
    message: 'An excise rate needs perUnit, adValorem or minimum.',
  });

const ascending = <T>(items: T[], key: (item: T) => number | null) =>
  items.every((item, i) => {
    const value = key(item);
    if (value === null) return i === items.length - 1; // open-ended band must be last
    const prev = i > 0 ? key(items[i - 1]) : null;
    return prev === null || value > prev;
  });

const exciseTable = z
  .object({
    vehicleTypes: z.array(vehicleType).min(1),
    fuelTypes: z.array(fuelType).min(1),
    unit: z.enum(['cc', 'kW']),
    bands: z
      .array(
        z
          .object({
            maxCapacity: z.number().positive().nullable(),
            ages: z
              .array(
                z.object({ maxAgeYears: z.number().nonnegative().nullable(), rate: exciseRate }).strict(),
              )
              .min(1)
              .refine((ages) => ascending(ages, (a) => a.maxAgeYears), 'Age bands must ascend; null last.'),
          })
          .strict(),
      )
      .min(1)
      .refine((bands) => ascending(bands, (b) => b.maxCapacity), 'Capacity bands must ascend; null last.'),
  })
  .strict();

const componentBase = { id: z.string().min(1), label: z.string().min(1), appliesTo: appliesTo.optional() };

const component = z.discriminatedUnion('kind', [
  z
    .object({
      ...componentBase,
      kind: z.literal('percent'),
      rate: fraction,
      base: z.object({ cifMultiplier: z.number().nonnegative(), include: z.array(z.string()) }).strict(),
    })
    .strict(),
  z.object({ ...componentBase, kind: z.literal('excise') }).strict(),
  z.object({ ...componentBase, kind: z.literal('luxury') }).strict(),
  z.object({ ...componentBase, kind: z.literal('fixed'), amount: money }).strict(),
]);

export const vehicleDutyRatesSchema = z
  .object({
    maxAgeYears: z.number().int().positive().optional(),
    components: z.array(component).min(1),
    exciseTables: z.array(exciseTable),
    luxuryTax: z.array(
      z
        .object({
          appliesTo,
          thresholdLkr: money,
          rate: fraction,
          base: z.enum(['cif-excess', 'cif']),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((rates, ctx) => {
    const seen = new Set<string>();
    rates.components.forEach((c, i) => {
      if (seen.has(c.id))
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate component id "${c.id}"`,
          path: ['components', i],
        });
      if (c.kind === 'percent') {
        for (const id of c.base.include) {
          if (!seen.has(id)) {
            ctx.addIssue({
              code: 'custom',
              message: `"${c.id}" includes "${id}", which must be listed before it`,
              path: ['components', i, 'base', 'include'],
            });
          }
        }
      }
      seen.add(c.id);
    });
  }) satisfies z.ZodType<VehicleDutyRates>;
