/** The one main menu: same items, same order, in the desktop menu row and the phone drawer. */
export const MAIN_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/shop/', label: 'Shop' },
  { href: '/find-my-school-list/', label: 'School lists' },
  { href: '/discovery/', label: 'Discovery' },
  { href: '/product-category/student-boxes/', label: 'Signature pack' },
  { href: '/contact/', label: 'Contact us' },
  { href: '/bookshop/', label: '3D Bookshop' },
];

/** Desktop: right side of the top row. Phone: inside the menu drawer. */
export const TRACK_ORDER = { href: '/track-your-order/', label: 'Track order' } as const;
