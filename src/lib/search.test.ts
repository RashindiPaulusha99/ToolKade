import { describe, expect, it } from 'vitest';
import { searchTools, type SearchItem } from './search';

const items: SearchItem[] = [
  {
    slug: 'salary-apit-calculator',
    name: 'Salary & APIT Calculator',
    url: '/tools/salary-apit-calculator/',
    category: 'Sri Lanka Calculators',
    keywords: ['paye tax', 'epf etf'],
    published: false,
  },
  {
    slug: 'loan-emi-calculator',
    name: 'Loan & Leasing EMI Calculator',
    url: '/tools/loan-emi-calculator/',
    category: 'Sri Lanka Calculators',
    keywords: ['leasing calculator sri lanka'],
    published: true,
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    url: '/tools/json-formatter/',
    category: 'Developer Tools',
    keywords: ['json beautifier'],
    published: true,
  },
];

describe('searchTools', () => {
  it('returns nothing for an empty query', () => {
    expect(searchTools('', items)).toEqual([]);
    expect(searchTools('   ', items)).toEqual([]);
  });

  it('matches names case-insensitively', () => {
    expect(searchTools('json', items).map((i) => i.slug)).toEqual(['json-formatter']);
    expect(searchTools('APIT', items).map((i) => i.slug)).toEqual(['salary-apit-calculator']);
  });

  it('matches keywords and categories', () => {
    expect(searchTools('epf', items).map((i) => i.slug)).toEqual(['salary-apit-calculator']);
    expect(searchTools('developer', items).map((i) => i.slug)).toEqual(['json-formatter']);
  });

  it('requires every term to match', () => {
    expect(searchTools('calculator leasing', items).map((i) => i.slug)).toEqual(['loan-emi-calculator']);
    expect(searchTools('json leasing', items)).toEqual([]);
  });

  it('ranks name matches above keyword matches and published tools first on ties', () => {
    const results = searchTools('calculator', items).map((i) => i.slug);
    expect(results).toEqual(['loan-emi-calculator', 'salary-apit-calculator']);
  });

  it('respects the limit', () => {
    expect(searchTools('a', items, 1)).toHaveLength(1);
  });
});
