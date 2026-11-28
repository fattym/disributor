// Customer-facing hours, delivery and WhatsApp wording, shared so the pages cannot drift apart.
export const SHOP_HOURS =
  'Online shop open 24 hours, 7 days a week. Customer support Mon–Sat, 8am–6pm (Sunday: ordering open, support closed).';

export const DELIVERY_NOTE =
  'Delivery from KES 300, confirmed on WhatsApp before you pay. Orders over KES 5,000 may qualify for free delivery.';

export const WHATSAPP_NUMBERS = [
  { label: '0716 815 025', e164: '+254716815025', href: 'https://wa.me/254716815025' },
  { label: '0798 734 442', e164: '+254798734442', href: 'https://wa.me/254798734442' },
];

export const WHATSAPP_DELIVERY_LINE = '+ delivery from KES 300, confirmed here before you pay';

/** Adds the delivery line under "Total:" in the order message the server puts in its wa.me link. */
export function withDeliveryLine(url: string): string {
  const [base, text] = url.split('?text=');
  if (!text) return url;
  const message = decodeURIComponent(text);
  if (message.includes(WHATSAPP_DELIVERY_LINE)) return url;
  return `${base}?text=${encodeURIComponent(message.replace(/^Total:.*$/m, `$&\n${WHATSAPP_DELIVERY_LINE}`))}`;
}
