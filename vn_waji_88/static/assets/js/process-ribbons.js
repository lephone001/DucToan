(() => {
  'use strict';
  const section = document.getElementById('quy-trinh');
  const root = document.getElementById('process-ribbons');
  const toggle = document.getElementById('process-energy-toggle');
  if (!section || !root || !toggle || window.ducToanProcessRibbons) return;
  const orb = section.querySelector('.orb');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pixiUrl = 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.mjs';
  const segments = 240;
  let app = null, initialization = null, destroyed = false, failed = false, contextLost = false;
  let enabled = true, visible = false, pageActive = true;
  let elapsed = 0, accumulated = 0, frames = 0;
  const ribbons = [];
  const size = { width: 1, height: 1, x: 0, y: 0 };

    const vertexShader = `
      precision highp float;
      attribute vec2 aPosition;
      attribute vec2 aUV;
      uniform vec2 uResolution;
      uniform vec2 uOrigin;
      uniform float uTime;
      uniform float uLane;
      uniform float uSpeed;
      uniform float uAmplitude;
      uniform float uRibbonWidth;
      uniform float uPhase;
      varying float vT;
      varying float vAcross;
      varying float vFade;
      varying float vPhase;
      void main(void) {
        float t = aPosition.x;
        float side = aPosition.y;
        float lane = uLane - 0.5;
        vec2 redEnd = vec2(-uResolution.x * 0.08, uResolution.y * 0.35);
        vec2 blueEnd = vec2(uResolution.x * 0.64, -uResolution.y * 0.08);
        vec2 endpoint = mix(redEnd, blueEnd, uLane);
        vec2 source = uOrigin;
        vec2 blueControl = vec2(source.x, mix(source.y, endpoint.y, 0.4));
        vec2 tangent = mix(endpoint - source,
          2.0 * mix(blueControl - source, endpoint - blueControl, t), uLane);
        vec2 normal = normalize(vec2(-tangent.y, tangent.x));
        float flowTime = -uTime;
        float wave = sin(t * 5.2 - flowTime * uSpeed + uPhase);
        wave += 0.42 * sin(t * 11.6 - flowTime * uSpeed * 0.68 + uPhase * 1.53);
        wave += 0.18 * sin(t * 2.25 + flowTime * uSpeed * 0.22 + uPhase * 2.1);
        vec2 straight = mix(source, endpoint, t);
        vec2 blueCurve = mix(mix(source, blueControl, t), mix(blueControl, endpoint, t), t);
        vec2 center = mix(straight, blueCurve, uLane);
        float fanSpread = lane * uResolution.x * 0.11 * pow(t, 1.8);
        float flowEnvelope = sin(3.14159 * t) * smoothstep(0.0, 0.18, t);
        float waveEnvelope = flowEnvelope * (0.58 + 0.42 * t);
        float slowSway = sin(t * 3.0 - flowTime * 0.19 + uPhase * 1.7) * uAmplitude * 0.2 * flowEnvelope;
        center += normal * (fanSpread + wave * uAmplitude * waveEnvelope + slowSway);
        float widthPulse = 1.0 + 0.16 * sin(t * 8.4 - flowTime * uSpeed * 0.72 + uPhase * 1.4);
        float taper = smoothstep(0.0, 0.018, t);
        float halfWidth = uRibbonWidth * (0.24 + 3.9 * pow(t, 1.6)) * widthPulse * taper;
        vec2 position = center + normal * side * halfWidth;
        vec2 clipPosition = vec2(position.x / uResolution.x * 2.0 - 1.0, 1.0 - position.y / uResolution.y * 2.0);
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        vT = aUV.x;
        vAcross = side;
        vFade = mix(1.0, 0.12, smoothstep(0.0, 1.0, t));
        vPhase = uPhase;
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying float vT;
      varying float vAcross;
      varying float vFade;
      varying float vPhase;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uGlow;
      uniform float uOpacity;
      uniform vec3 uRibbonColor;
      uniform vec3 uAccent;
      void main(void) {
        float across = abs(vAcross);
        float body = exp(-pow(across * 1.52, 4.0));
        float core = exp(-pow(across / 0.105, 2.0));
        float rim = exp(-pow((across - 0.78) / 0.15, 2.0));
        float edgeCore = exp(-pow((across - 0.965) / 0.045, 2.0));
        float flowTime = -uTime;
        float grain = 0.5 + 0.5 * sin(vT * 118.0 - flowTime * uSpeed * 3.15 + sin(vT * 16.0 + vPhase) * 2.4);
        float filamentWave = 0.5 + 0.5 * sin(vT * 39.0 - flowTime * uSpeed * 2.4 + vPhase + sin(vT * 9.0) * 1.7);
        float filament = exp(-pow((across - (0.34 + 0.075 * sin(vT * 8.0 - flowTime * 0.26 + vPhase))) / 0.055, 2.0)) * filamentWave;
        float shimmer = pow(max(0.0, sin(vT * 31.0 - flowTime * uSpeed * 2.0 + vPhase + sin(vT * 7.0) * 1.3)), 18.0);
        float blend = smoothstep(0.08, 0.95, vT) * 0.58;
        vec3 color = mix(uRibbonColor, uAccent, blend);
        color = mix(color, vec3(0.94, 0.91, 1.0), clamp(core * 0.42 + edgeCore * 0.3 + shimmer * 0.58, 0.0, 0.82));
        color += uAccent * (rim * 0.18 + filament * 0.26 + shimmer * 0.2) * uGlow;
        float sourceGlow = exp(-pow(vT / 0.12, 2.0));
        float alpha = (body * 0.24 + core * 0.25 + rim * 0.22 + edgeCore * 0.18 + filament * 0.2 + shimmer * 0.26) + sourceGlow * 0.28;
        alpha *= vFade * uOpacity * (0.88 + grain * 0.12) * (0.78 + uGlow * 0.22);
        float finalAlpha = clamp(alpha, 0.0, 0.9);
        gl_FragColor = vec4(color * (1.0 + uGlow * 0.28) * finalAlpha, finalAlpha);
      }
    `;

  root.dataset.renderer = 'idle';

  function settings() {
    return { speed: .82, amplitude: 81, width: 68, glow: 1.35 };
  }

  function layout() {
    if (destroyed) return;
    const rect = root.getBoundingClientRect(), orbRect = orb.getBoundingClientRect();
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    const fit = Math.min(orbRect.width / (orb.naturalWidth || 627), orbRect.height / (orb.naturalHeight || 681));
    const coreOffset = (Number(orb.dataset.coreY) - .5) * (orb.naturalHeight || 681) * fit;
    size.x = orbRect.left - rect.left + orbRect.width / 2;
    size.y = orbRect.top - rect.top + orbRect.height / 2 + coreOffset;
    toggle.style.left = size.x + 'px'; toggle.style.top = size.y + 'px';
    const resized = size.width !== width || size.height !== height;
    size.width = width; size.height = height;
    const config = settings();
    if (app && resized) app.renderer.resize(width, height);
    ribbons.forEach(({ uniforms }) => {
      const u = uniforms.uniforms;
      u.uResolution[0] = width; u.uResolution[1] = height;
      u.uOrigin[0] = size.x; u.uOrigin[1] = size.y;
      u.uSpeed = config.speed; u.uAmplitude = config.amplitude; u.uRibbonWidth = config.width; u.uGlow = config.glow;
    });
  }

  function geometry(pixi) {
    const positions = new Float32Array((segments + 1) * 4);
    const uvs = new Float32Array((segments + 1) * 4);
    const indices = new Uint32Array(segments * 6);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, v = i * 4;
      positions.set([t, -1, t, 1], v); uvs.set([t, 0, t, 1], v);
      if (i < segments) {
        const a = i * 2; indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
      }
    }
    return new pixi.Geometry({ attributes: { aPosition: positions, aUV: uvs }, indexBuffer: indices });
  }

  function makeUniforms(pixi, lane, palette) {
    const config = settings();
    return new pixi.UniformGroup({
      uResolution: { value: new Float32Array([size.width, size.height]), type: 'vec2<f32>' },
      uOrigin: { value: new Float32Array([size.x, size.y]), type: 'vec2<f32>' },
      uTime: { value: elapsed, type: 'f32' }, uLane: { value: lane, type: 'f32' },
      uSpeed: { value: config.speed, type: 'f32' }, uAmplitude: { value: config.amplitude, type: 'f32' },
      uRibbonWidth: { value: config.width, type: 'f32' }, uPhase: { value: lane * 2.399, type: 'f32' },
      uGlow: { value: config.glow, type: 'f32' }, uOpacity: { value: 1, type: 'f32' },
      uRibbonColor: { value: new Float32Array(palette[0]), type: 'vec3<f32>' },
      uAccent: { value: new Float32Array(palette[1]), type: 'vec3<f32>' }
    });
  }

  function syncDisplay() {
    root.hidden = !enabled;
    if (app) app.canvas.hidden = failed || contextLost || motion.matches;
    toggle.classList.toggle('is-off', !enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    const label = enabled ? 'Tắt dải năng lượng' : 'Bật dải năng lượng';
    toggle.setAttribute('aria-label', label); toggle.title = label;
  }

  function onContextLost(event) {
    event.preventDefault(); contextLost = true; root.dataset.renderer = 'fallback'; syncDisplay();
  }
  function onContextRestored() {
    contextLost = false; failed = false; root.dataset.renderer = 'webgl'; layout(); syncDisplay();
  }

  function release() {
    if (!app) return;
    const previous = app; app = null;
    previous.canvas.removeEventListener('webglcontextlost', onContextLost);
    previous.canvas.removeEventListener('webglcontextrestored', onContextRestored);
    previous.stop();
    previous.destroy({ removeView: true }, { children: true, context: true });
    ribbons.length = 0;
  }

  async function initialize() {
    if (app || initialization || destroyed || failed || !enabled || motion.matches || document.hidden || !visible) return;
    root.dataset.renderer = 'loading';
    initialization = (async () => {
      const pixi = await import(pixiUrl);
      if (destroyed) return;
      const candidate = new pixi.Application();
      try {
        await candidate.init({
          preference: 'webgl', preferWebGLVersion: 2,
          width: size.width, height: size.height, resolution: 1,
          autoDensity: true, backgroundAlpha: 0, antialias: true, clearBeforeRender: true,
          powerPreference: 'low-power', autoStart: false, sharedTicker: false
        });
      } catch (error) {
        try { candidate.destroy({ removeView: true }, { children: true, context: true }); } catch (cleanupError) { /* Partially initialized renderer. */ }
        throw error;
      }
      if (destroyed) { candidate.destroy({ removeView: true }, { children: true, context: true }); return; }
      app = candidate; app.stop();
      app.canvas.setAttribute('aria-hidden', 'true'); root.appendChild(app.canvas);
      app.canvas.addEventListener('webglcontextlost', onContextLost);
      app.canvas.addEventListener('webglcontextrestored', onContextRestored);
      const meshGeometry = geometry(pixi);
      const palettes = [[[1, .045, .16], [1, .29, .57]], [[.035, .39, 1], [.22, .88, 1]]];
      palettes.forEach((palette, lane) => {
        const uniforms = makeUniforms(pixi, lane, palette);
        const shader = pixi.Shader.from({ gl: { vertex: vertexShader, fragment: fragmentShader }, resources: { ribbonUniforms: uniforms } });
        const mesh = new pixi.Mesh({ geometry: meshGeometry, shader });
        mesh.blendMode = 'normal'; app.stage.addChild(mesh); ribbons.push({ mesh, uniforms });
      });
      layout(); app.render(); root.dataset.renderer = 'webgl'; syncDisplay();
    })().catch(() => {
      failed = true; release(); root.dataset.renderer = 'fallback'; syncDisplay();
    }).finally(() => { initialization = null; });
    return initialization;
  }

  function renderFrame(dt) {
    // Driven by index.html's existing RAF; Pixi never starts a separate ticker.
    if (destroyed || !enabled || !visible || !pageActive || document.hidden || motion.matches || document.querySelector('.consult-dialog[open]')) return;
    if (!app) { initialize(); return; }
    if (failed || contextLost) return;
    elapsed += dt; accumulated += dt;
    if (accumulated < 1 / 30) return;
    accumulated %= 1 / 30;
    ribbons.forEach(({ uniforms }) => { uniforms.uniforms.uTime = elapsed; });
    try { app.render(); frames++; }
    catch (error) { failed = true; release(); root.dataset.renderer = 'fallback'; syncDisplay(); }
  }

  function onToggle() { enabled = !enabled; if (enabled && failed && !app) failed = false; syncDisplay(); if (enabled) initialize(); }
  function onMotionChange() { syncDisplay(); if (!motion.matches) initialize(); }
  function onVisibilityChange() { if (!document.hidden) initialize(); }
  function onPageHide(event) { pageActive = false; if (!event.persisted) destroy(); }
  function onPageShow() { pageActive = true; layout(); initialize(); }
  const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); if (visible) { layout(); initialize(); } }, { threshold: .05 });
  const resize = new ResizeObserver(layout);
  function destroy() {
    if (destroyed) return;
    destroyed = true; intersection.disconnect(); resize.disconnect();
    toggle.removeEventListener('click', onToggle); motion.removeEventListener('change', onMotionChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide); window.removeEventListener('pageshow', onPageShow);
    release(); delete window.ducToanProcessRibbons;
  }
  window.ducToanProcessRibbons = { renderFrame, destroy, getState: () => ({ renderer: root.dataset.renderer, enabled, visible, elapsed, frames, settings: settings(), origin: [size.x, size.y] }) };
  toggle.addEventListener('click', onToggle); motion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide); window.addEventListener('pageshow', onPageShow);
  layout(); syncDisplay(); intersection.observe(section); resize.observe(root); resize.observe(orb);
})();
