import { useState } from 'react';
import { sendMessage } from '../lib/api.js';
import { useSite } from '../lib/SiteContext.jsx';
import { Heading } from '../lib/text.jsx';

const empty = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact() {
  const { brand, contact, social } = useSite();
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'sending', msg: '' });
    try {
      await sendMessage(form);
      setForm(empty);
      setStatus({ state: 'ok', msg: 'Message sent. I’ll get back to you soon ♥' });
    } catch (err) {
      setStatus({ state: 'err', msg: err.message });
    }
  }

  return (
    <section className="contact" id="contact">
      <div className="wrap contact__in">
        <div className="reveal">
          <p className="kicker kicker--light">{contact.kicker}</p>
          <Heading heading={contact.heading} emphasis={contact.emphasis} className="display display--light" />
          <p className="contact__sub">{contact.text}</p>
          <a className="link-u link-u--light" href={`mailto:${brand.email}`}>{brand.email}</a>
          {social.length > 0 && (
            <p className="contact__social">
              {social.map((s) => (<a key={s.platform + s.url} href={s.url} target="_blank" rel="noreferrer">{s.platform} ↗</a>))}
            </p>
          )}
        </div>
        <form className="form reveal" onSubmit={submit}>
          <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={set('website')} />
          <label>Name<input required value={form.name} onChange={set('name')} maxLength={100} /></label>
          <label>Email<input required type="email" value={form.email} onChange={set('email')} maxLength={200} /></label>
          <label>What’s it about?<input value={form.subject} onChange={set('subject')} maxLength={150} /></label>
          <label>Message<textarea required rows="4" value={form.message} onChange={set('message')} maxLength={4000} /></label>
          <button className="btn btn--light" disabled={status.state === 'sending'}>
            {status.state === 'sending' ? 'Sending…' : 'Send message ↗'}
          </button>
          <p className={`form__status form__status--${status.state}`} role="status">{status.msg}</p>
        </form>
      </div>
    </section>
  );
}
