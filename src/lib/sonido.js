/** Pitido corto y agudo si el código se leyó bien; grave y largo si el producto no existe. */
export function pitido(error = false) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = pitido.ctx || (pitido.ctx = new Ctx());
    ctx.resume?.();
    const o = ctx.createOscillator(), g = ctx.createGain();
    const dur = error ? 0.3 : 0.08;
    o.frequency.value = error ? 320 : 1650; o.type = "square";
    g.gain.setValueAtTime(error ? 0.08 : 0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur + 0.01);
  } catch { /* sin sonido */ }
}
