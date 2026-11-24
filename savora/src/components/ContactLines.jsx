import Icon from './Icon';
import { Placeholder } from './ui';

/** Address/phone/email with visible placeholders when the owner hasn't supplied them yet. */
export default function ContactLines({ profile }) {
  const rows = [
    { icon: 'pin', label: 'Address', value: profile?.address, href: profile?.mapsUrl },
    { icon: 'phone', label: 'Phone', value: profile?.phone, href: profile?.phone && `tel:${profile.phone.replace(/\s/g, '')}` },
    { icon: 'mail', label: 'Email', value: profile?.email, href: profile?.email && `mailto:${profile.email}` },
  ];
  return (
    <ul className="contact-lines" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.9rem' }}>
      {rows.map((r) => (
        <li key={r.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Icon name={r.icon} width="20" height="20" style={{ color: 'var(--gold)', flex: 'none', marginTop: 3 }} />
          <span>
            <span className="visually-hidden">{r.label}: </span>
            {r.value ? (r.href ? <a href={r.href}>{r.value}</a> : r.value) : <Placeholder>{r.label} to be supplied</Placeholder>}
          </span>
        </li>
      ))}
    </ul>
  );
}
