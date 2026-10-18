import { formatLKR } from '@/lib/format';
import type { ToolContent } from '@/tools/types';
import type { ElectricityRates } from './logic';

/** Page text built from the tariff file, so a tariff revision updates the copy too. */
export function getContent(rates: ElectricityRates | null): ToolContent {
  const domestic = rates?.tariffs.domestic;
  const firstBlock = domestic?.bands[0]?.blocks[0];
  const top = domestic?.bands.at(-1);
  const topThreshold = domestic?.bands.at(-2)?.maxUnits;

  return {
    intro:
      'Calculate your CEB or LECO electricity bill from the units you used, with a block-by-block breakdown of the current domestic tariff, the fixed charge and the total. You can also work backwards from a bill amount to the units used.',
    howTo: [
      'Choose your electricity provider (CEB or LECO) and your tariff category. Most homes are "Domestic".',
      'If you have a LECO prepaid meter, tick "Prepaid meter", as prepaid has its own rates.',
      'Enter the units (kWh) shown on your bill or meter. The units used are the current reading minus the previous reading.',
      'Change the billing period if your bill covers more or less than 30 days. The block limits are adjusted to match.',
      'Read the total, the charge for each block and the fixed charge. Switch to "Bill → units" to estimate how many units a bill amount covers.',
    ],
    howItWorks: [
      `Sri Lanka's electricity tariff is set by the Public Utilities Commission of Sri Lanka (PUCSL) and is the same for every licensed supplier's retail customers. Domestic tariffs use blocks: the first units are charged at a low rate${firstBlock ? ` (from ${formatLKR(firstBlock.rate)} a unit)` : ''}, and each further block of units costs more.`,
      `The domestic tariff is split by how much you use in the month. Low users pay only the cheap blocks. If you use more, a different set of rates applies to all your units, and above ${topThreshold ?? 180} units a month${top ? ` every unit is charged at ${formatLKR(top.blocks[0].rate)} up to that point and ${formatLKR(top.blocks.at(-1)!.rate)} after it` : ' a much higher rate applies'}. That is why a few extra units near a limit can raise your bill sharply.`,
      'On top of the energy charge you pay a monthly fixed charge, which depends on the highest block your usage reaches.',
      'The block sizes are set for a 30-day billing period. PUCSL prorates the units in each block for longer or shorter periods, so the calculator does the same. Your bill may also include arrears, adjustments or other charges that are not shown here.',
    ],
    faqs: [
      {
        q: 'How do I calculate my electricity units?',
        a: 'Subtract the previous meter reading from the current reading. Both are printed on your bill. The difference is the number of units (kWh) you used in that billing period.',
      },
      {
        q: 'Why did my bill jump so much for a few extra units?',
        a: `The domestic tariff charges different rates depending on your total monthly use. Crossing a limit, such as ${topThreshold ?? 180} units, moves all your units onto the higher set of rates and raises the fixed charge, so the bill can jump even for one extra unit.`,
      },
      {
        q: 'Is the tariff the same for CEB and LECO?',
        a: "Yes. The PUCSL tariff applies to both CEB and LECO postpaid customers. LECO also offers an optional prepaid scheme with its own rates, which you can select with the 'Prepaid meter' option.",
      },
      {
        q: 'What is the fixed charge?',
        a: 'It is a monthly charge added to every bill on top of the cost of the units. For domestic customers it depends on the highest block your usage reaches, so it goes up as your monthly consumption goes up.',
      },
      {
        q: 'How can I reduce my electricity bill?',
        a: 'Keep an eye on the block limits: staying just below a limit can save a lot. Use efficient LED bulbs and appliances, switch off devices at the plug, and run heavy appliances like irons and water heaters less often. Use the calculator to see how much a reduction in units would save.',
      },
    ],
  };
}
