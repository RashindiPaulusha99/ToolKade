import type { ToolContent } from '@/tools/types';

// No rates or thresholds in this file: figures come only from src/data/rates/vehicle-duty.json.
export const content: ToolContent = {
  intro:
    'Estimate the vehicle import duty and taxes on a car, SUV, van, hybrid or EV you plan to bring into Sri Lanka, with a line-by-line breakdown and the estimated landed cost in rupees.',
  howTo: [
    'Choose the vehicle type and fuel type. Pick "Electric (EV)" for a fully electric vehicle, so the calculator asks for motor power in kW instead of engine capacity.',
    'Enter the engine capacity in cc (or the motor power in kW) exactly as it appears on the auction sheet or export certificate.',
    'Enter the year of manufacture. Excise duty depends on the age of the vehicle, so this changes the result.',
    'Enter the CIF value (cost, insurance and freight) in Japanese yen, US dollars or rupees. For a foreign currency, type in the current exchange rate.',
    'Read the breakdown: each tax is listed with how it was worked out, followed by the total taxes and the estimated landed cost. Use "Copy summary" to share it.',
  ],
  howItWorks: [
    'Sri Lanka Customs charges several duties and taxes on an imported vehicle, and most of them are calculated in a fixed order because later taxes are charged on top of earlier ones. Everything starts from the CIF value: the price of the vehicle plus the cost of insurance and shipping to Sri Lanka, converted to rupees.',
    'Customs import duty is charged as a percentage of the CIF value, and a surcharge may be added on top of that duty. Excise duty is usually the largest component. It is set by gazette for each fuel type, and depends on the engine capacity in cc (or the motor power in kW for electric vehicles) and on the age of the vehicle. Some bands may charge whichever is higher: an amount per cc or a percentage of the value.',
    'Expensive vehicles may also pay a luxury tax once the CIF value passes a threshold set for each fuel type. Finally, the Social Security Contribution Levy (SSCL) and VAT are charged on a base made up of the CIF value plus the duties already added, and fixed levies may apply per vehicle.',
    'This calculator works through those steps using the rates in our data file, which records the official source and the date we last checked it. Rates change often, so treat the result as an estimate and confirm it with Sri Lanka Customs or a licensed clearing agent before you commit to a purchase.',
  ],
  faqs: [
    {
      q: 'What is the CIF value of a vehicle?',
      a: 'CIF stands for cost, insurance and freight. It is the price you pay for the vehicle plus the cost of insuring it and shipping it to a Sri Lankan port. Customs calculates duty on the CIF value converted to rupees, so a change in the exchange rate changes your duty even if the vehicle price stays the same.',
    },
    {
      q: 'Which exchange rate should I use?',
      a: 'Use the current selling rate published by the Central Bank of Sri Lanka for the currency you are paying in. Customs uses its own official rate on the day the vehicle is cleared, so the final figure can differ slightly from your estimate.',
    },
    {
      q: 'Why does the age of the vehicle matter?',
      a: 'Excise duty rates are set in age bands, so a brand-new vehicle and a used one with the same engine can pay different amounts. There may also be a maximum age for vehicles that can be imported. Enter the year of manufacture from the vehicle documents to get the right band.',
    },
    {
      q: 'How are hybrid and electric vehicles taxed?',
      a: 'Hybrids and electric vehicles have their own excise tables. Electric vehicles are usually taxed on motor power in kilowatts (kW) rather than engine capacity in cc, and luxury tax thresholds can differ by fuel type. Choose the correct fuel type so the calculator uses the right table.',
    },
    {
      q: 'Is the result the final amount I will pay?',
      a: 'No. The result is an estimate for planning. The final amount is decided by Sri Lanka Customs when the vehicle is cleared, and you will also pay clearing agent fees, port charges and registration costs, which this calculator does not include. Always confirm with Customs or a licensed clearing agent.',
    },
  ],
};
