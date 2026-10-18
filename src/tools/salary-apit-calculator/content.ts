import { formatLKR, formatPercent } from '@/lib/format';
import type { ToolContent } from '@/tools/types';
import type { SalaryRates } from './logic';

/**
 * Page text built from the rates file, so a change in apit.json updates the copy too.
 * With no rates (pending verification), the copy stays generic.
 */
export function getContent(rates: SalaryRates | null): ToolContent {
  const relief = rates ? formatLKR(rates.apit.personalReliefAnnual / 12) : 'the monthly personal relief';
  const reliefAnnual = rates ? formatLKR(rates.apit.personalReliefAnnual) : 'the annual personal relief';
  const epfEmployee = rates ? formatPercent(rates.epf.employeeRate) : 'the employee rate';
  const epfEmployer = rates ? formatPercent(rates.epf.employerRate) : 'the employer rate';
  const etf = rates ? formatPercent(rates.etf.employerRate) : 'the ETF rate';
  const bandRates = rates ? rates.apit.bands.map((b) => formatPercent(b.rate)).join(', ') : '';

  return {
    intro: `Work out your take-home pay in Sri Lanka after APIT (PAYE) tax and your ${epfEmployee} EPF contribution, and see what your employer pays in EPF and ETF on top of your salary.`,
    howTo: [
      'Choose whether you are entering monthly or annual amounts.',
      'Enter your salary: the basic or consolidated salary shown on your payslip.',
      'Enter any other taxable allowances, such as travelling, fuel or transport allowances. Leave it blank if you have none.',
      'Tick "Allowances count towards EPF" if your payslip calculates EPF on your allowances as well as your salary.',
      'Read your take-home pay, the deductions and the APIT bracket breakdown. Switch to "Compare two salaries" to see how much of a raise or a new job offer you would actually keep.',
    ],
    howItWorks: [
      `APIT (Advance Personal Income Tax, also called PAYE) is deducted by your employer every month using the Inland Revenue Department's Tax Table No. 01. The first ${relief} of your monthly pay (${reliefAnnual} a year) is tax-free personal relief.${bandRates ? ` Income above that is taxed in bands at ${bandRates}.` : ''} Each rate applies only to the part of your pay inside its band, so a pay rise never reduces your take-home pay.`,
      `APIT is charged on your gross regular pay: salary plus allowances and taxable benefits. Your own EPF contribution is not deducted before tax is worked out.`,
      `EPF (Employees' Provident Fund) is a retirement saving scheme. You contribute ${epfEmployee} of your earnings, deducted from your pay, and your employer adds ${epfEmployer}. Your employer also pays ${etf} to the ETF (Employees' Trust Fund). The employer contributions do not come out of your salary, but they are part of what you cost your employer.`,
      'Take-home pay is your gross pay minus your EPF contribution and APIT. This calculator assumes you are a resident employee with one employment (or a primary declaration with this employer) and the same pay every month.',
    ],
    faqs: [
      {
        q: 'How much salary is tax-free in Sri Lanka?',
        a: `The personal relief is ${reliefAnnual} a year, which works out to ${relief} a month. If your regular monthly pay is at or below that amount, no APIT is deducted.`,
      },
      {
        q: 'Is APIT calculated before or after EPF?',
        a: `Before. APIT is worked out on your gross pay, including allowances. Your ${epfEmployee} EPF contribution is deducted from your pay separately and does not reduce the tax.`,
      },
      {
        q: 'What is the difference between EPF and ETF?',
        a: `EPF is a provident fund that both you (${epfEmployee}) and your employer (${epfEmployer}) pay into. ETF is a separate trust fund paid only by your employer (${etf}). You can withdraw both when you retire, and in some other situations set by each fund.`,
      },
      {
        q: 'Do allowances count towards EPF?',
        a: 'It depends on the allowance. EPF is paid on your "total earnings", and whether a particular allowance is included depends on its type and your employment terms. Check your payslip to see what your employer includes, and tick the box in the calculator to match.',
      },
      {
        q: 'Why is my payslip different from this calculator?',
        a: 'Your payslip can include bonuses, overtime, arrears, non-cash benefits or other deductions such as loans and welfare, and some of these are taxed using other IRD tables. Employers may also round figures differently. Use this calculator as an estimate for regular monthly pay.',
      },
    ],
  };
}
