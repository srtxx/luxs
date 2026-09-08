/**
 * Generates a synthetic test video Blob directly in the browser using Canvas & MediaRecorder.
 * Useful for instant demo/testing without needing to upload an external file.
 */
export async function generateSampleVideo(): Promise<Blob> {
  const width = 640;
  const height = 360;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const stream = canvas.captureStream(30); // 30 fps
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm',
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalFrames = 90; // 3 seconds at 30fps
  let frame = 0;

  recorder.start();

  return new Promise((resolve) => {
    const render = () => {
      const t = frame / 30; // seconds

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Moving glowing circles
      const circleX = width / 2 + Math.sin(t * 3) * 160;
      const circleY = height / 2 + Math.cos(t * 2) * 80;

      // Glow
      const radGrad = ctx.createRadialGradient(circleX, circleY, 10, circleX, circleY, 90);
      radGrad.addColorStop(0, '#38bdf8');
      radGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(circleX, circleY, 90, 0, Math.PI * 2);
      ctx.fill();

      // Sharp detailed subject (High contrast target for best score detection around t=1.5s)
      const sharpnessFactor = Math.max(0.2, Math.cos((t - 1.5) * 2)); // Best at t = 1.5s
      ctx.save();
      ctx.translate(circleX, circleY);
      ctx.rotate(t * 1.5);

      // Star shape with crisp lines
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = Math.round(1 + sharpnessFactor * 3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const dist = i % 2 === 0 ? 50 : 25;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Overlay text with time
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`SAMPLE BURST CAPTURE - FRAME ${frame}/${totalFrames}`, 24, 40);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px monospace';
      ctx.fillText(`TIME: ${t.toFixed(2)}s | SHARPNESS PEAK ~1.50s`, 24, 64);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    };

    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    render();
  });
}
