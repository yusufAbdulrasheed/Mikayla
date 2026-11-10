const MIN_MINUTES = 0.05;
const MAX_MINUTES = 14;

export function startKeepAlive(log = console) {
  if (!['true', '1', 'yes'].includes(String(process.env.KEEP_ALIVE || '').toLowerCase())) return null;

  const base = (process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) {
    log.warn('[keep-alive] KEEP_ALIVE is on but there is no address to ping. Set KEEP_ALIVE_URL (Render sets RENDER_EXTERNAL_URL itself).');
    return null;
  }

  const minutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Number(process.env.KEEP_ALIVE_MINUTES) || 10));
  const target = `${base}/api/health`;
  let healthy = null;

  const ping = async () => {
    try {
      const res = await fetch(target, { headers: { 'User-Agent': 'mikayla-keep-alive' }, signal: AbortSignal.timeout(25000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (healthy !== true) log.log(`[keep-alive] ${healthy === false ? 'recovered' : 'running'}: pinging ${target} every ${minutes} min`);
      healthy = true;
    } catch (e) {
      if (healthy !== false) log.warn(`[keep-alive] ping failed (${e.message}). Will keep trying every ${minutes} min.`);
      healthy = false;
    }
  };

  const timer = setInterval(ping, minutes * 60 * 1000);
  timer.unref();
  setTimeout(ping, 15000).unref();
  return timer;
}
