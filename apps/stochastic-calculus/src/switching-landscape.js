// A schematic of the source double well. Compress its steep walls vertically
// so positions outside the wells stay visible without flattening the central hill.
export function drawValley(canvas, position, extent, target, reached, palette, ballColor) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const margin = 16, floor = height - 52;
  const screenX = x => margin + (x + extent) / (2 * extent) * (width - 2 * margin);
  const surface = x => floor - (floor - 24) * (1 - Math.exp(-0.85 * (x * x - 1) ** 2));
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const x = extent * (i / 100 - 1);
    if (i === 0) ctx.moveTo(screenX(x), surface(x));
    else ctx.lineTo(screenX(x), surface(x));
  }
  ctx.strokeStyle = palette.teal;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.lineTo(width - margin, floor + 13);
  ctx.lineTo(margin, floor + 13);
  ctx.closePath();
  ctx.fillStyle = palette.teal;
  ctx.globalAlpha = 0.13;
  ctx.fill();
  ctx.globalAlpha = 1;

  const flagX = screenX(target), flagY = surface(target);
  ctx.strokeStyle = reached ? palette.gold : palette.muted;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(flagX, flagY);
  ctx.lineTo(flagX, flagY - 36);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(flagX, flagY - 36);
  ctx.lineTo(flagX + 16, flagY - 31);
  ctx.lineTo(flagX, flagY - 25);
  ctx.fill();
  ctx.fillStyle = palette.muted;
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui';
  ctx.fillText('Flag +0.75', flagX, flagY - 43);
  ctx.fillText('Hilltop 0', screenX(0), surface(0) - 16);
  ctx.fillText('Left −1', screenX(-1), floor + 32);
  ctx.fillText('Right +1', screenX(1), floor + 32);

  const x = screenX(position), y = surface(position) - 8;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fillStyle = ballColor;
  ctx.fill();
  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 2, y - 3, 2, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
}
