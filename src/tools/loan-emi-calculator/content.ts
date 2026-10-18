import type { ToolContent } from '@/tools/types';

export const content: ToolContent = {
  intro:
    'Calculate the monthly instalment on a loan or vehicle lease in Sri Lanka, see the total interest you will pay, and find out what a flat leasing rate really costs compared with a reducing-balance rate.',
  howTo: [
    'Choose how the lender quotes the interest rate: "Reducing balance" (most bank loans) or "Flat rate" (many vehicle leasing quotes). Check your offer letter if you are not sure.',
    'Enter the amount you are borrowing or leasing, after any down payment.',
    'Enter the annual interest rate as a percentage, for example 14.',
    'Enter the term in years or months.',
    'Read your monthly instalment, total interest and total payable. Open the repayment schedule to see every month, and use the equivalent-rate note to compare flat and reducing offers fairly.',
  ],
  howItWorks: [
    "With a reducing-balance rate, each month's interest is charged only on the amount you still owe. Your instalment stays the same, but as the balance falls, more of each payment goes towards the principal. The instalment is the standard EMI formula: P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the amount, r is the monthly rate (annual rate ÷ 12) and n is the number of months.",
    'With a flat rate, interest is charged on the full original amount for the whole term, even though you repay part of it every month. Total interest is simply amount × rate × years, and the instalment is (amount + total interest) ÷ number of months. Because you keep paying interest on money you have already repaid, a flat rate is much more expensive than the same number on a reducing balance.',
    'To compare offers fairly, the calculator converts a flat rate into the reducing-balance rate that gives the same instalment, and a reducing-balance rate into the equivalent flat rate. Over a typical three- to five-year lease, the equivalent reducing-balance rate is often close to double the flat rate.',
    'The repayment schedule spreads flat-rate interest evenly across the months. Some lenders split it differently (for example using the "rule of 78"), which changes how much of each payment is interest, but not the instalment or the total. Your lender\'s figures may also include fees, insurance or stamp duty that are not shown here.',
  ],
  faqs: [
    {
      q: 'What is the difference between a flat rate and a reducing balance rate?',
      a: 'A flat rate charges interest on the full amount you borrowed for the whole term. A reducing-balance rate charges interest only on what you still owe, which falls every month. For the same headline rate, a flat-rate loan costs much more in interest.',
    },
    {
      q: 'What is an EMI?',
      a: "EMI stands for equated monthly instalment: the fixed amount you pay every month until the loan is repaid. Each EMI covers that month's interest plus part of the principal.",
    },
    {
      q: 'How do I compare a leasing offer with a bank loan?',
      a: 'Convert both to the same type of rate. Enter the leasing offer with "Flat rate" selected and note the equivalent reducing-balance rate, then compare that number with the bank\'s reducing-balance rate. The lower reducing-balance rate is the cheaper loan, before fees.',
    },
    {
      q: 'Does paying a bigger down payment reduce my instalment?',
      a: 'Yes. A larger down payment reduces the amount you finance, which lowers both the monthly instalment and the total interest. Enter the amount after your down payment to see the effect.',
    },
    {
      q: "Why is my lender's instalment slightly different?",
      a: 'Lenders may round differently, charge fees or insurance, calculate interest daily, or use a different method to split flat-rate interest. Treat this calculator as an estimate and confirm the final figures in your offer letter.',
    },
  ],
};
