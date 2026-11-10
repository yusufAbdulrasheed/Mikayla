const clients = new Set();
let rev = Date.now();

export const currentRev = () => rev;

export function broadcast(scope = 'all') {
  rev = Date.now();
  const message = `event: content\ndata: ${JSON.stringify({ rev, scope })}\n\n`;
  for (const res of clients) {
    try { res.write(message); } catch { clients.delete(res); }
  }
}

export function eventsHandler(req, res) {
  if (clients.size >= 2000) return res.status(503).end();
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`retry: 3000\nevent: hello\ndata: ${JSON.stringify({ rev })}\n\n`);
  clients.add(res);

  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { } }, 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
}

export const liveClients = () => clients.size;
