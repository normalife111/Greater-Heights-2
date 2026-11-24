import { formatTime } from '../lib/format';
import { Placeholder } from './ui';

export default function OpeningHours({ hours }) {
  if (!hours) return null;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  return (
    <>
      <ul className="hours-list">
        {hours.days.map((d) => (
          <li key={d.day} style={d.day === today ? { color: 'var(--gold)' } : undefined}>
            <span>{d.day}{d.day === today && <span className="visually-hidden"> (today)</span>}</span>
            <span>{d.open ? `${formatTime(d.open)} – ${formatTime(d.close)}` : 'Closed'}</span>
          </li>
        ))}
      </ul>
      {hours.sample && <p style={{ marginTop: '0.8rem' }}><Placeholder>Sample hours — confirm before launch</Placeholder></p>}
    </>
  );
}
