// Sticky nav background on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  links.classList.toggle('open', !open);
  document.body.style.overflow = open ? '' : 'hidden';
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  links.classList.remove('open');
  document.body.style.overflow = '';
}));

// Menu tabs
const tabs = document.querySelectorAll('[role="tab"]');
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
}));

// Highlight today's hours + open/closed status
// Hours: [openHour, closeHour] in 24h; null = closed. Index 0 = Sunday.
const HOURS = [[11, 21], null, [17, 22], [17, 22], [17, 22], [17, 24], [17, 24]];
const ROW_FOR_DAY = [3, 0, 1, 1, 1, 2, 2];
(() => {
  const now = new Date();
  const day = now.getDay();
  const rows = document.querySelectorAll('.hours dl div');
  rows[ROW_FOR_DAY[day]]?.classList.add('today');
  const status = document.getElementById('open-status');
  const h = HOURS[day];
  const hour = now.getHours() + now.getMinutes() / 60;
  const open = h && hour >= h[0] && hour < h[1];
  status.textContent = open ? 'Open now — come on in' : 'Closed right now — see you soon';
  status.classList.add(open ? 'open' : 'closed');
})();

// Reservation form (front-end only — connect to your booking system or email service)
const form = document.getElementById('reserve-form');
const msg = document.getElementById('form-msg');
const dateInput = form.querySelector('[name="date"]');
const today = new Date();
dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];

form.addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('[required]').forEach(el => {
    const bad = !el.value.trim();
    el.classList.toggle('invalid', bad);
    if (bad) valid = false;
  });
  if (!valid) {
    msg.textContent = 'Please fill in the highlighted fields.';
    msg.className = 'form-msg full err';
    return;
  }
  const data = new FormData(form);
  const date = new Date(data.get('date') + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  msg.textContent = `Thank you, ${data.get('name')}! Your table for ${data.get('guests')} on ${date} at ${data.get('time')} is requested. We'll call to confirm.`;
  msg.className = 'form-msg full ok';
  form.reset();
});

// Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.section-head, .story-grid, .cards, .quote, .visit-grid, .reserve-form').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

document.getElementById('year').textContent = new Date().getFullYear();
