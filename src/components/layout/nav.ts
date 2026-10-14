export interface NavItem {
  label: string;
  href: string;
}

/** Top-level links. "Tools" is the mega menu and is rendered separately between Home and Blog. */
export const primaryNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'All tools', href: '/tools/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

export const legalNav: NavItem[] = [
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Terms of Use', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
  { label: 'Cookie Policy', href: '/cookie-policy/' },
  { label: 'Sitemap', href: '/sitemap-index.xml' },
];
