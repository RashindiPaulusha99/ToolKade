import { z } from 'astro/zod';
import type { ElectricityRates } from './logic';

// Validates the `data` of src/data/rates/electricity-tariff.json (see logic.test.ts). Not imported by Tool.tsx.

const block = z
  .object({
    upTo: z.number().positive().nullable(),
    rate: z.number().nonnegative(),
    fixedCharge: z.number().nonnegative().nullable(),
  })
  .strict();

const band = z
  .object({ maxUnits: z.number().positive().nullable(), blocks: z.array(block).min(1) })
  .strict()
  .refine(
    (b) => b.blocks.every((blk, i) => i === 0 || (blk.upTo ?? Infinity) > (b.blocks[i - 1].upTo ?? Infinity)),
    {
      message: 'Blocks must ascend; an open-ended block must be last.',
    },
  )
  .refine((b) => b.maxUnits === null || b.blocks.at(-1)?.upTo === b.maxUnits, {
    message: "A band's last block must end at the band limit.",
  });

const tariff = z
  .object({ label: z.string().min(1), bands: z.array(band).min(1) })
  .strict()
  .refine((t) => t.bands.at(-1)?.maxUnits === null, { message: 'The last band must have no upper limit.' })
  .refine(
    (t) =>
      t.bands.every((b, i) => i === 0 || (b.maxUnits ?? Infinity) > (t.bands[i - 1].maxUnits ?? Infinity)),
    {
      message: 'Bands must ascend.',
    },
  );

export const electricityRatesSchema = z
  .object({ billingDays: z.number().int().positive(), tariffs: z.record(z.string(), tariff) })
  .strict() satisfies z.ZodType<ElectricityRates>;
