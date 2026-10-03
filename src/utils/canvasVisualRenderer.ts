/**
 * Canvas Visual Renderer for High-Definition Video Lectures.
 * Faithfully mirrors the on-screen Interactive Lecture Module & SlideVisualBoard onto
 * an HTML5 Canvas for real-time 720p HD video recording.
 */

// Helper to clean LaTeX math expressions and emotion markers for clean canvas typography
export function cleanMathTextForCanvas(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[\s*(?:whispers|softly|excitedly|joyfully|playfully|happily|gasp|laughs|think|idea)\s*\]\s*/gi, '')
    .replace(/\$([^\$]+)\$/g, '$1') // remove $...$ math delimiters
    .replace(/\\(?:sqrt|text|mathbf|mathrm)\{([^}]+)\}/g, '√$1')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^([0-9a-zA-Z])/g, '^$1')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pm/g, '±')
    .replace(/\\degree/g, '°')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rightarrow/g, '➔')
    .replace(/\\quad/g, ' ')
    .trim();
}

export function detectSlideLayout(slide: any): string {
  if (!slide) return 'conceptual-flow';
  const rawLayout = (slide.visualLayout || '').toLowerCase();
  const keywords: string[] = slide.visualAttributes?.keywords || [];
  const titleText = ((slide.title || '') + " " + keywords.join(" ") + " " + (slide.content || '')).toLowerCase();

  if (slide.svgVisual && typeof slide.svgVisual === 'string' && slide.svgVisual.trim().startsWith('<svg')) {
    return 'dynamic-svg';
  } else if (
    rawLayout.includes('eclipse') || rawLayout.includes('solar-eclipse') || rawLayout.includes('lunar-eclipse') ||
    titleText.includes('eclipse') || titleText.includes('moon block') || titleText.includes('sun block') ||
    (titleText.includes('moon') && (titleText.includes('sun') || titleText.includes('shadow') || titleText.includes('earth'))) ||
    titleText.includes('umbra') || titleText.includes('penumbra') || titleText.includes('syzygy')
  ) {
    return 'solar-eclipse';
  } else if (
    rawLayout.includes('optics') || rawLayout.includes('prism') || rawLayout.includes('refraction') ||
    titleText.includes('prism') || titleText.includes('refraction') || titleText.includes('reflection') || titleText.includes('rainbow') ||
    titleText.includes('spectrum') || titleText.includes('lens') || titleText.includes('optics') || (titleText.includes('light') && (titleText.includes('ray') || titleText.includes('color') || titleText.includes('speed of light')))
  ) {
    return 'optics-light';
  } else if (
    rawLayout.includes('heart') || rawLayout.includes('circulation') || rawLayout.includes('cardio') ||
    titleText.includes('heart') || titleText.includes('circulation') || titleText.includes('blood flow') || titleText.includes('pulse') || titleText.includes('cardio') || titleText.includes('artery') || titleText.includes('vein')
  ) {
    return 'human-heart';
  } else if (
    rawLayout.includes('circuit') || rawLayout.includes('electricity') || rawLayout.includes('battery') ||
    titleText.includes('circuit') || titleText.includes('electricity') || titleText.includes('current') || titleText.includes('voltage') || titleText.includes('battery') || titleText.includes('electric')
  ) {
    return 'electric-circuit';
  } else if (
    rawLayout.includes('magnet') || rawLayout.includes('magnetic') ||
    titleText.includes('magnet') || titleText.includes('magnetic') || titleText.includes('compass') || titleText.includes('poles')
  ) {
    return 'magnetism';
  } else if (
    rawLayout.includes('spreadsheet') || rawLayout.includes('excel') || titleText.includes('excel') || titleText.includes('spreadsheet') || (titleText.includes('cell') && (titleText.includes('row') || titleText.includes('formula')))
  ) {
    return 'spreadsheet-excel';
  } else if (
    rawLayout.includes('space') || rawLayout.includes('orbit') || rawLayout.includes('rocket') || titleText.includes('rocket') || titleText.includes('gravity') || titleText.includes('space') || titleText.includes('planet') || titleText.includes('solar system')
  ) {
    return 'space-orbit';
  } else if (
    rawLayout.includes('cell') || rawLayout.includes('anatomy') || rawLayout.includes('bio') || titleText.includes('cell') || titleText.includes('blood') || titleText.includes('organ') || titleText.includes('hemoglobin') || titleText.includes('dna')
  ) {
    return 'cell-anatomy';
  } else if (
    rawLayout.includes('chem') || rawLayout.includes('atom') || titleText.includes('chemistry') || titleText.includes('reaction') || titleText.includes('molecule') || titleText.includes('atom') || titleText.includes('acid')
  ) {
    return 'chemistry-lab';
  } else if (
    rawLayout.includes('geometry') || rawLayout.includes('pythagoras') || titleText.includes('pythagoras') || titleText.includes('triangle') || titleText.includes('geometry') || titleText.includes('algebra') || titleText.includes('hypotenuse')
  ) {
    return 'geometry-pythagoras';
  } else if (
    rawLayout.includes('history') || rawLayout.includes('timeline') || rawLayout.includes('civics') || titleText.includes('constitution') || titleText.includes('freedom') || titleText.includes('history') || titleText.includes('ambedkar') || titleText.includes('gandhi')
  ) {
    return 'history-timeline';
  } else if (
    rawLayout.includes('agri') || rawLayout.includes('farm') || titleText.includes('farming') || titleText.includes('irrigation') || titleText.includes('soil') || titleText.includes('crop')
  ) {
    return 'agri-drone';
  } else if (
    rawLayout.includes('water') || rawLayout.includes('rain') || titleText.includes('water cycle') || titleText.includes('rain') || titleText.includes('cloud')
  ) {
    return 'water-cycle';
  } else if (
    rawLayout.includes('photo') || titleText.includes('photosynthesis') || titleText.includes('chlorophyll')
  ) {
    return 'photosynthesis';
  } else if (
    rawLayout.includes('multiplication') || titleText.includes('multiplication') || titleText.includes('times table') || titleText.includes('counting') || titleText.includes('multiply')
  ) {
    return 'multiplication';
  }

  return 'conceptual-flow';
}

export function drawWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 6
): number {
  if (!text) return y;
  const clean = cleanMathTextForCanvas(text);
  const words = clean.split(' ');
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesCount++;
      if (linesCount >= maxLines - 1 && n < words.length - 1) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export interface CompleteSlideFrameParams {
  query: string;
  subject: string;
  avatarChar: string;
  avatarName: string;
  currentSlide: {
    id: string;
    title: string;
    content: string;
    bullets?: string[];
    keyFact?: string;
    visualLayout?: string;
    visualAttributes?: any;
    svgVisual?: string;
  };
  currentSlideIndex: number;
  totalSlides: number;
  isAudioPlaying: boolean;
  now: number;
  elapsedMs: number;
  totalEstimatedSecs: number;
  progressPercent: number;
  lang: string;
  bubbles: { x: number; y: number; r: number; alpha: number; dx: number; dy: number }[];
}

export function drawCompleteSlideFrame(
  ctx: CanvasRenderingContext2D,
  params: CompleteSlideFrameParams
) {
  const {
    query,
    subject,
    avatarChar,
    avatarName,
    currentSlide,
    currentSlideIndex,
    totalSlides,
    isAudioPlaying,
    now,
    elapsedMs,
    totalEstimatedSecs,
    progressPercent,
    bubbles
  } = params;

  // 1. BASE BACKGROUND & AMBIENCE (1280 x 720)
  ctx.fillStyle = '#090D1A';
  ctx.fillRect(0, 0, 1280, 720);

  const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
  bgGrad.addColorStop(0, '#0a0e1c');
  bgGrad.addColorStop(0.5, '#101428');
  bgGrad.addColorStop(1, '#191b36');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1280, 720);

  // Background floating ambient particles
  bubbles.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < -b.r) b.x = 1280 + b.r;
    if (b.x > 1280 + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = 720 + b.r;
    if (b.y > 720 + b.r) b.y = -b.r;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(129, 178, 154, ${b.alpha * 0.7})`;
    ctx.fill();
  });

  // 2. HEADER TOP BAR (x: 35, y: 16, width: 1210, height: 56)
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(35, 16, 1210, 56, 16);
  ctx.fill();
  ctx.stroke();

  // Left: Module tag
  ctx.beginPath();
  ctx.arc(58, 44, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#E07A5F';
  ctx.fill();

  ctx.fillStyle = '#E07A5F';
  ctx.font = '900 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText("INTERACTIVE LECTURE MODULE", 72, 48);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText("•", 262, 48);

  // Subject Tag
  ctx.fillStyle = '#81B29A';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText(subject.toUpperCase(), 276, 48);

  // Center: Query Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Inter", sans-serif';
  const displayQuery = query.length > 52 ? query.substring(0, 49) + '...' : query;
  ctx.fillText(displayQuery, 455, 48);

  // Right: Tutor Name Badge
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = 'rgba(242, 204, 143, 0.4)';
  ctx.beginPath();
  ctx.roundRect(960, 26, 185, 36, 18);
  ctx.fill();
  ctx.stroke();

  ctx.font = '14px "Inter", sans-serif';
  ctx.fillText(avatarChar.split(' ')[0] || '🤖', 972, 49);

  ctx.fillStyle = '#F2CC8F';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  const shortAvatarName = avatarName.length > 16 ? avatarName.substring(0, 14) + '..' : avatarName;
  ctx.fillText(shortAvatarName.toUpperCase(), 995, 49);

  // REC 720P pill
  ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
  ctx.beginPath();
  ctx.roundRect(1155, 28, 76, 32, 16);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 10px "JetBrains Mono", monospace';
  ctx.fillText("🔴 REC HD", 1165, 48);
  ctx.restore();

  // 3. MAIN LEFT PANEL: THE VISUAL CANVAS BOARD (x: 35, y: 84, width: 750, height: 566)
  const boardX = 35;
  const boardY = 84;
  const boardW = 750;
  const boardH = 566;

  ctx.save();
  ctx.fillStyle = '#090D1A';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boardX, boardY, boardW, boardH, 20);
  ctx.fill();
  ctx.stroke();

  // Inner coordinate grid lines
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(boardX, boardY, boardW, boardH, 20);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let gx = boardX; gx <= boardX + boardW; gx += 20) {
    ctx.moveTo(gx, boardY);
    ctx.lineTo(gx, boardY + boardH);
  }
  for (let gy = boardY; gy <= boardY + boardH; gy += 20) {
    ctx.moveTo(boardX, gy);
    ctx.lineTo(boardX + boardW, gy);
  }
  ctx.stroke();
  ctx.restore();

  // Detect visual layout for current slide
  const layout = detectSlideLayout(currentSlide);

  // Render specific layout diagram with stage-aware visual adaptation
  drawVisualLayoutContent(
    ctx,
    boardX,
    boardY,
    boardW,
    boardH,
    layout,
    currentSlide,
    currentSlideIndex,
    totalSlides,
    isAudioPlaying,
    now
  );

  // Floating Picture-in-Picture Tutor Circle (bottom-right inside Visual Board)
  const pipX = boardX + boardW - 45;
  const pipY = boardY + boardH - 45;
  const pipR = 25;

  ctx.save();
  ctx.beginPath();
  ctx.arc(pipX, pipY, pipR, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#F2CC8F';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (isAudioPlaying) {
    const pulseR = pipR + 3 + Math.sin(now * 0.01) * 3;
    ctx.beginPath();
    ctx.arc(pipX, pipY, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(224, 122, 95, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.font = '24px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avatarChar.split(' ')[0] || '🤖', pipX, pipY + 1);

  // Little live badge on PIP
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(pipX + 8, pipY - 26, 24, 14, 7);
  ctx.fill();
  ctx.fillStyle = isAudioPlaying ? '#22c55e' : '#94a3b8';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText(isAudioPlaying ? '🔴' : '🎙️', pipX + 20, pipY - 18);
  ctx.restore();

  ctx.restore(); // End Visual Canvas Board

  // 4. MAIN RIGHT PANEL: CONTENT & TUTOR DETAILS (x: 800, y: 84, width: 445, height: 566)
  const contentX = 800;
  const contentY = 84;
  const contentW = 445;
  const contentH = 566;

  ctx.save();
  ctx.fillStyle = 'rgba(26, 29, 45, 0.96)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(contentX, contentY, contentW, contentH, 20);
  ctx.fill();
  ctx.stroke();

  // 4A. Active AI Tutor Header Card
  const tutorCardY = contentY + 14;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(contentX + 14, tutorCardY, contentW - 28, 62, 14);
  ctx.fill();
  ctx.stroke();

  // Tutor Circle inside Card
  ctx.beginPath();
  ctx.arc(contentX + 46, tutorCardY + 31, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#090D1A';
  ctx.fill();
  ctx.strokeStyle = '#F2CC8F';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '20px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avatarChar.split(' ')[0] || '🤖', contentX + 46, tutorCardY + 32);

  // Status & Name
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.beginPath();
  ctx.arc(contentX + 80, tutorCardY + 24, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = isAudioPlaying ? '#4ade80' : '#94a3b8';
  ctx.fill();

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillText(isAudioPlaying ? 'SPEAKING...' : 'AI MASCOT TUTOR', contentX + 90, tutorCardY + 27);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.fillText(avatarName, contentX + 80, tutorCardY + 48);

  // 4B. Slide Step & Title Pill
  const titleY = tutorCardY + 74;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(contentX + 14, titleY, contentW - 28, 44, 12);
  ctx.fill();
  ctx.stroke();

  // Slide Step Indicator Badge
  ctx.fillStyle = '#E07A5F';
  ctx.font = '900 10.5px "JetBrains Mono", monospace';
  const stageBadge = `SLIDE ${currentSlideIndex + 1}/${totalSlides}:`;
  ctx.fillText(stageBadge, contentX + 26, titleY + 27);

  const stageBadgeWidth = ctx.measureText(stageBadge).width;
  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 13.5px "Inter", sans-serif';
  const rawTitle = cleanMathTextForCanvas(currentSlide.title || `Concept Overview`);
  const maxTitleW = contentW - 60 - stageBadgeWidth;
  const slideTitle = ctx.measureText(rawTitle).width > maxTitleW ? rawTitle.substring(0, 32) + '...' : rawTitle;
  ctx.fillText(slideTitle, contentX + 32 + stageBadgeWidth, titleY + 27);

  // 4C. Slide Content Paragraph
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '14px/1.6 "Inter", sans-serif';
  const contentEndY = drawWrappedLines(
    ctx,
    currentSlide.content || '',
    contentX + 18,
    titleY + 68,
    contentW - 36,
    22,
    5
  );

  // 4D. Bullet Points with ▸ arrows
  const bullets = currentSlide.bullets || [];
  let bulletY = contentEndY + 12;
  if (bullets.length > 0) {
    bullets.slice(0, 3).forEach((b) => {
      if (bulletY < contentY + contentH - 95) {
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('▸', contentX + 18, bulletY);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '12.5px "Inter", sans-serif';
        const cleanB = cleanMathTextForCanvas(b);
        const bMetrics = ctx.measureText(cleanB);
        if (bMetrics.width > contentW - 55) {
          ctx.fillText(cleanB.substring(0, 46) + '...', contentX + 34, bulletY);
        } else {
          ctx.fillText(cleanB, contentX + 34, bulletY);
        }
        bulletY += 23;
      }
    });
  }

  // 4E. Key Fact Card at Bottom
  const keyFact = cleanMathTextForCanvas(currentSlide.keyFact || "Consistent daily exploration strengthens creative problem-solving!");
  const factBoxY = contentY + contentH - 85;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(contentX + 14, factBoxY, contentW - 28, 72, 14);
  ctx.fill();
  ctx.stroke();

  ctx.font = '22px "Inter", sans-serif';
  ctx.fillText('💡', contentX + 26, factBoxY + 38);

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 11px "Inter", sans-serif';
  drawWrappedLines(
    ctx,
    keyFact,
    contentX + 58,
    factBoxY + 24,
    contentW - 85,
    17,
    3
  );

  ctx.restore(); // End Right Panel

  // 5. FOOTER TIMELINE & PROGRESS (y: 662, width: 1210, height: 44)
  ctx.save();
  const footerX = 35;
  const footerY = 662;
  const footerW = 1210;

  // Thin timeline bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(footerX, footerY + 8, footerW, 5);

  const activeProgressW = footerW * (Math.min(progressPercent, 100) / 100);
  const progGrad = ctx.createLinearGradient(footerX, 0, footerX + activeProgressW, 0);
  progGrad.addColorStop(0, '#4F46E5');
  progGrad.addColorStop(0.5, '#8B5CF6');
  progGrad.addColorStop(1, '#E07A5F');
  ctx.fillStyle = progGrad;
  ctx.fillRect(footerX, footerY + 8, activeProgressW, 5);

  // Slide milestone dots
  for (let i = 1; i < totalSlides; i++) {
    const dotX = footerX + (footerW * (i / totalSlides));
    ctx.beginPath();
    ctx.arc(dotX, footerY + 10.5, 4, 0, Math.PI * 2);
    ctx.fillStyle = (progressPercent >= (i / totalSlides) * 100) ? '#E07A5F' : '#334155';
    ctx.fill();
  }

  // Footer status labels
  const secondsElapsed = Math.floor(elapsedMs / 1000);
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText(
    `SLIDE ${currentSlideIndex + 1} OF ${totalSlides}  |  ${secondsElapsed}s / ${Math.max(secondsElapsed + 2, totalEstimatedSecs)}s`,
    footerX,
    footerY + 34
  );

  // Live Sound Wave in the middle
  const waveStartX = footerX + 500;
  ctx.fillStyle = isAudioPlaying ? '#4ADE80' : '#475569';
  for (let idx = 0; idx < 12; idx++) {
    const waveH = isAudioPlaying ? (Math.sin(now * 0.015 + idx * 0.5) * 6 + 9) : 4;
    ctx.fillRect(waveStartX + idx * 8, footerY + 28 - waveH / 2, 4, waveH);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
  ctx.fillText("MASCOT CLASS TUTOR • HIGH DEFINITION VIDEO MOVIE", footerX + footerW, footerY + 34);
  ctx.restore();
}

/**
 * Renders the accurate visual diagram for each concept layout inside the Left Visual Board.
 * Features stage-aware drawing for multi-slide progression!
 */
export function drawVisualLayoutContent(
  ctx: CanvasRenderingContext2D,
  boardX: number,
  boardY: number,
  boardW: number,
  boardH: number,
  layout: string,
  slide: any,
  slideIndex: number,
  totalSlides: number,
  isPlaying: boolean,
  now: number
) {
  ctx.save();
  const headerY = boardY + 18;

  // 1. GEOMETRY & PYTHAGOREAN THEOREM (Stage-aware!)
  if (layout === 'geometry-pythagoras') {
    const isStage1 = slideIndex === 0;
    const isStage2 = slideIndex === 1;
    const isStage3 = slideIndex >= 2;

    // Header Badge
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🧭 PYTHAGORAS PRINCIPLE (a² + b² = c²)", boardX + 22, headerY + 16);

    ctx.fillStyle = 'rgba(69, 26, 3, 0.9)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boardX + boardW - 165, headerY, 145, 26, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      isStage1 ? "Phase 1: 90° Triangle" : isStage2 ? "Phase 2: Area Squares" : "Phase 3: Real Apps",
      boardX + boardW - 92,
      headerY + 17
    );

    if (isStage2) {
      // STAGE 2: Geometric Squares Proof on sides (a² + b² = c²)
      const triA = { x: boardX + 220, y: boardY + 350 };
      const triB = { x: boardX + 380, y: boardY + 350 };
      const triC = { x: boardX + 380, y: boardY + 230 };

      // Base Square (b = 4, area = 16) below base
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.fillRect(triA.x, triA.y, 160, 110);
      ctx.strokeRect(triA.x, triA.y, 160, 110);
      ctx.fillStyle = '#6EE7B7';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("Base² = 4² = 16", triA.x + 80, triA.y + 60);

      // Height Square (a = 3, area = 9) to the right of height
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = '#F59E0B';
      ctx.fillRect(triB.x, triC.y, 110, 120);
      ctx.strokeRect(triB.x, triC.y, 110, 120);
      ctx.fillStyle = '#FCD34D';
      ctx.fillText("Height² = 3² = 9", triB.x + 55, triC.y + 65);

      // Main Triangle
      ctx.beginPath();
      ctx.moveTo(triA.x, triA.y);
      ctx.lineTo(triB.x, triB.y);
      ctx.lineTo(triC.x, triC.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Right angle marker
      ctx.strokeRect(triB.x - 18, triB.y - 18, 18, 18);

      // Calculation summary card on left
      const calcX = boardX + 30;
      const calcY = boardY + 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(calcX, calcY, 170, 180, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText("GEOMETRIC PROOF", calcX + 85, calcY + 28);
      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText("a² + b² = c²", calcX + 85, calcY + 68);
      ctx.fillStyle = '#67E8F9';
      ctx.fillText("9 + 16 = 25", calcX + 85, calcY + 108);
      ctx.fillStyle = '#34D399';
      ctx.font = '900 15px "JetBrains Mono", monospace';
      ctx.fillText("c = √25 = 5", calcX + 85, calcY + 148);

    } else if (isStage3) {
      // STAGE 3: Real-World Applications (Navigation, Engineering, Height & Distance)
      // Draw building with ladder hypotenuse
      const bldX = boardX + 320;
      const bldY = boardY + 150;
      const bldW = 100;
      const bldH = 260;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      ctx.fillRect(bldX, bldY, bldW, bldH);
      ctx.strokeRect(bldX, bldY, bldW, bldH);

      // Building windows
      ctx.fillStyle = '#38BDF8';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillRect(bldX + 16 + c * 40, bldY + 20 + r * 55, 24, 30);
        }
      }

      // Ground line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(boardX + 50, bldY + bldH);
      ctx.lineTo(boardX + boardW - 50, bldY + bldH);
      ctx.stroke();

      // Ladder / Slope Hypotenuse
      const groundPt = { x: boardX + 120, y: bldY + bldH };
      const topPt = { x: bldX, y: bldY + 30 };

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(groundPt.x, groundPt.y);
      ctx.lineTo(topPt.x, topPt.y);
      ctx.stroke();

      // Height line
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(bldX, groundPt.y);
      ctx.lineTo(bldX, topPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("Distance (c = √a²+b²)", (groundPt.x + topPt.x) / 2 - 30, (groundPt.y + topPt.y) / 2 - 15);

      ctx.fillStyle = '#94A3B8';
      ctx.fillText("Ground Base (b)", (groundPt.x + bldX) / 2, groundPt.y + 25);
      ctx.fillText("Height (a)", bldX + bldW + 40, (groundPt.y + topPt.y) / 2);

      // App cards
      const apps = [
        { icon: "🛰️", label: "GPS Triangulation" },
        { icon: "🏗️", label: "Structural Engineering" },
        { icon: "🎮", label: "3D Graphics & Gaming" }
      ];
      apps.forEach((app, idx) => {
        const ax = boardX + 460;
        const ay = boardY + 150 + idx * 75;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ax, ay, 240, 58, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = '22px "Inter", sans-serif';
        ctx.fillText(app.icon, ax + 30, ay + 36);
        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(app.label, ax + 58, ay + 34);
      });

    } else {
      // STAGE 1: Standard Right Triangle Fundamentals (Legs a, b, Hypotenuse c)
      const triA = { x: boardX + 110, y: boardY + 370 };
      const triB = { x: boardX + 370, y: boardY + 370 };
      const triC = { x: boardX + 370, y: boardY + 180 };

      ctx.beginPath();
      ctx.moveTo(triA.x, triA.y);
      ctx.lineTo(triB.x, triB.y);
      ctx.lineTo(triC.x, triC.y);
      ctx.closePath();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Right-angle marker box
      const markerSize = 22;
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(triB.x - markerSize, triB.y - markerSize, markerSize, markerSize);

      // Base Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 13.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("Base (b = 4)", (triA.x + triB.x) / 2, triB.y + 28);

      // Height Label
      ctx.textAlign = 'left';
      ctx.fillText("Height (a = 3)", triB.x + 18, (triB.y + triC.y) / 2 + 5);

      // Hypotenuse Label
      ctx.save();
      const hypMidX = (triA.x + triC.x) / 2;
      const hypMidY = (triA.y + triC.y) / 2;
      ctx.translate(hypMidX - 18, hypMidY - 18);
      const hypAngle = Math.atan2(triC.y - triA.y, triC.x - triA.x);
      ctx.rotate(hypAngle);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("Hypotenuse (c = 5)", 0, 0);
      ctx.restore();

      // Math Calculation Card
      const cardX = boardX + 475;
      const cardY = boardY + 205;
      const cardW = 240;
      const cardH = 150;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 17px "JetBrains Mono", monospace';
      ctx.fillText("3² + 4² = 5²", cardX + cardW / 2, cardY + 42);

      ctx.fillStyle = '#67E8F9';
      ctx.font = 'bold 17px "JetBrains Mono", monospace';
      ctx.fillText("9 + 16 = 25", cardX + cardW / 2, cardY + 82);

      ctx.fillStyle = '#34D399';
      ctx.font = '900 17px "JetBrains Mono", monospace';
      ctx.fillText("√25 = 5 (Hypotenuse)", cardX + cardW / 2, cardY + 122);
    }

    // Bottom Subtitle Strip
    const stripX = boardX + 25;
    const stripY = boardY + boardH - 65;
    const stripW = boardW - 100;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(stripX, stripY, stripW, 42, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("Essential for GPS navigation, construction engineering, and distance calculations!", stripX + stripW / 2, stripY + 26);

  } else if (layout === 'water-cycle') {
    // 2. WATER CYCLE
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("💧 WATER CYCLE (EVAPORATION • CONDENSATION • PRECIPITATION)", boardX + 22, headerY + 16);

    // Sun in upper left
    const sunX = boardX + 110;
    const sunY = boardY + 160;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 50);
    sunGrad.addColorStop(0, '#FEF08A');
    sunGrad.addColorStop(0.5, '#F59E0B');
    sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("SUN", sunX, sunY + 4);

    // Ocean / Lake at bottom
    const waterY = boardY + boardH - 120;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.fillRect(boardX, waterY, boardW, 120);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🌊 LAKES, RIVERS & OCEANS", boardX + boardW / 2, waterY + 60);

    // Clouds in top center & right
    const cloud1X = boardX + 360;
    const cloud1Y = boardY + 180;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.beginPath();
    ctx.arc(cloud1X - 30, cloud1Y, 25, 0, Math.PI * 2);
    ctx.arc(cloud1X, cloud1Y - 15, 35, 0, Math.PI * 2);
    ctx.arc(cloud1X + 35, cloud1Y, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("CLOUD", cloud1X, cloud1Y + 5);

    // Rising Vapor Arrows (Evaporation)
    ctx.fillStyle = '#67E8F9';
    for (let i = 0; i < 3; i++) {
      const vx = boardX + 220 + i * 40;
      const vy = waterY - 30 - ((now * 0.05 + i * 20) % 70);
      ctx.font = '16px monospace';
      ctx.fillText("↑", vx, vy);
    }
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 11px monospace';
    ctx.fillText("Evaporation ↑", boardX + 260, waterY - 80);

    // Falling Rain (Precipitation)
    ctx.fillStyle = '#38BDF8';
    for (let r = 0; r < 5; r++) {
      const rx = cloud1X - 30 + r * 20;
      const ry = cloud1Y + 45 + ((now * 0.08 + r * 15) % 65);
      ctx.fillText("💧", rx, ry);
    }
    ctx.fillText("Precipitation ↓", cloud1X + 10, cloud1Y + 120);

  } else if (layout === 'photosynthesis') {
    // 3. PHOTOSYNTHESIS
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🌿 PHOTOSYNTHESIS (6CO₂ + 6H₂O + LIGHT ➔ GLUCOSE + 6O₂)", boardX + 22, headerY + 16);

    // Center Green Leaf
    const leafX = boardX + 360;
    const leafY = boardY + 280;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(leafX, leafY, 130, 80, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leaf vein
    ctx.beginPath();
    ctx.moveTo(leafX - 120, leafY + 40);
    ctx.lineTo(leafX + 120, leafY - 40);
    ctx.stroke();

    // Inputs: Sunlight & CO2
    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("☀️ Sunlight (Energy)", leafX - 160, leafY - 90);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText("🌬️ CO₂ (From Air)", leafX - 160, leafY + 20);
    ctx.fillStyle = '#38BDF8';
    ctx.fillText("💧 H₂O (From Roots)", leafX - 160, leafY + 110);

    // Outputs: Glucose & Oxygen
    ctx.fillStyle = '#F43F5E';
    ctx.fillText("🍬 Glucose (C₆H₁₂O₆)", leafX + 190, leafY - 40);
    ctx.fillStyle = '#22C55E';
    ctx.fillText("💨 Oxygen (O₂ Released!)", leafX + 190, leafY + 60);

  } else if (layout === 'solar-eclipse') {
    // 4. SOLAR ECLIPSE
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("☀️ SOLAR ECLIPSE (ORBITAL SYZYGY ALIGNMENT)", boardX + 22, headerY + 16);

    // Sun
    const sunX = boardX + 130;
    const sunY = boardY + 280;
    const sGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 65);
    sGrad.addColorStop(0, '#FFFBEB');
    sGrad.addColorStop(0.4, '#FDE047');
    sGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("SUN", sunX, sunY + 4);

    // Moon
    const moonX = boardX + 380;
    const moonY = boardY + 280;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("MOON", moonX, moonY + 4);

    // Earth
    const earthX = boardX + 610;
    const earthY = boardY + 280;
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(earthX, earthY, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("EARTH", earthX, earthY + 4);

    // Umbra Cone
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(moonX, moonY - 20);
    ctx.lineTo(earthX - 44, earthY - 6);
    ctx.lineTo(earthX - 44, earthY + 6);
    ctx.lineTo(moonX, moonY + 20);
    ctx.closePath();
    ctx.fill();

  } else if (layout === 'optics-light') {
    // 5. OPTICS & LIGHT
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🌈 PRISM REFRACTION & SPECTRUM DISPERSION", boardX + 22, headerY + 16);

    const p1 = { x: boardX + 360, y: boardY + 160 };
    const p2 = { x: boardX + 220, y: boardY + 400 };
    const p3 = { x: boardX + 500, y: boardY + 400 };

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Incident white ray
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(boardX + 70, boardY + 340);
    ctx.lineTo(boardX + 290, boardY + 280);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText("White Light", boardX + 120, boardY + 310);

    // Dispersed 7 Rainbow Rays
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6'];
    colors.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(boardX + 430, boardY + 280);
      ctx.lineTo(boardX + 680, boardY + 200 + i * 26);
      ctx.stroke();
    });

  } else if (layout === 'human-heart') {
    // 6. HUMAN HEART
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("❤️ HUMAN HEART & DOUBLE CIRCULATION", boardX + 22, headerY + 16);

    const midX = boardX + 360;
    const midY = boardY + 270;

    // Right side (blue)
    ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(midX - 170, midY - 100, 160, 90, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("Right Atrium", midX - 90, midY - 55);

    ctx.beginPath();
    ctx.roundRect(midX - 170, midY + 10, 160, 90, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillText("Right Ventricle", midX - 90, midY + 55);

    // Left side (red)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.strokeStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(midX + 10, midY - 100, 160, 90, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText("Left Atrium", midX + 90, midY - 55);

    ctx.beginPath();
    ctx.roundRect(midX + 10, midY + 10, 160, 90, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillText("Left Ventricle", midX + 90, midY + 55);

    // Pulse Line
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boardX + 40, boardY + boardH - 90);
    for (let px = boardX + 40; px < boardX + boardW - 120; px += 20) {
      const pulseH = (px % 80 === 0) ? -25 : 0;
      ctx.lineTo(px, boardY + boardH - 90 + pulseH);
    }
    ctx.stroke();

  } else if (layout === 'multiplication') {
    // 7. MULTIPLICATION
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("⚡ MULTIPLICATION (REPEATED ADDITION & ARRAYS)", boardX + 22, headerY + 16);

    // Grid of circles
    const gridCols = 6;
    const gridRows = 4;
    const startGX = boardX + 180;
    const startGY = boardY + 180;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const dotX = startGX + c * 45;
        const dotY = startGY + r * 45;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Calculation Box
    const cBoxX = boardX + 480;
    const cBoxY = boardY + 200;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cBoxX, cBoxY, 210, 140, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText("4 Rows × 6 Columns", cBoxX + 105, cBoxY + 40);
    ctx.fillStyle = '#34D399';
    ctx.font = '900 18px "JetBrains Mono", monospace';
    ctx.fillText("Total = 24 Units", cBoxX + 105, cBoxY + 80);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText("4 × 6 = 24 ⚡", cBoxX + 105, cBoxY + 115);

  } else if (layout === 'spreadsheet-excel') {
    // 8. SPREADSHEET EXCEL
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("📊 SPREADSHEET COMPUTATION & AUTOMATED FORMULAS", boardX + 22, headerY + 16);

    // Formula bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(boardX + 30, boardY + 65, boardW - 120, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText("fx  =SUM(B2:D2) * 1.18", boardX + 45, boardY + 88);

    // Table Grid
    const tblX = boardX + 30;
    const tblY = boardY + 120;
    const tblW = boardW - 120;
    const colW = tblW / 4;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(tblX, tblY, tblW, 30);
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ['A (Item)', 'B (Qty)', 'C (Rate)', 'D (Total ₹)'].forEach((h, idx) => {
      ctx.fillText(h, tblX + idx * colW + colW / 2, tblY + 20);
    });

    // Row 1
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(tblX, tblY + 32, tblW, 35);
    ctx.fillStyle = '#FFF';
    ['Notebooks', '5', '₹40', '₹200'].forEach((v, idx) => {
      ctx.fillText(v, tblX + idx * colW + colW / 2, tblY + 54);
    });

    // Row 2 (highlighted)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10B981';
    ctx.fillRect(tblX, tblY + 69, tblW, 35);
    ctx.strokeRect(tblX, tblY + 69, tblW, 35);
    ctx.fillStyle = '#6EE7B7';
    ['Pens', '10', '₹15', '₹150'].forEach((v, idx) => {
      ctx.fillText(v, tblX + idx * colW + colW / 2, tblY + 91);
    });

  } else if (layout === 'space-orbit') {
    // 9. SPACE & ORBITS
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🚀 ORBITAL MECHANICS & GRAVITATIONAL TRAJECTORY", boardX + 22, headerY + 16);

    const cx = boardX + 360;
    const cy = boardY + 280;

    // Earth at center
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("EARTH", cx, cy + 4);

    // Orbit ellipse
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 220, 110, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Satellite
    const satAngle = (now * 0.001) % (Math.PI * 2);
    const satX = cx + Math.cos(satAngle) * 220;
    const satY = cy + Math.sin(satAngle) * 110;

    ctx.font = '22px "Inter", sans-serif';
    ctx.fillText("🛰️", satX, satY);

  } else if (layout === 'chemistry-lab') {
    // 10. CHEMISTRY LAB
    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("🧪 MOLECULAR STRUCTURE & CHEMICAL EQUILIBRIUM", boardX + 22, headerY + 16);

    const atomX = boardX + 260;
    const atomY = boardY + 270;

    // Orbiting electron rings
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(atomX, atomY, 90, 45, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(atomX, atomY, 90, 45, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();

    // Nucleus
    ctx.fillStyle = '#9333EA';
    ctx.beginPath();
    ctx.arc(atomX, atomY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("P+N", atomX, atomY + 4);

    // Lab Beaker on right
    const bkrX = boardX + 480;
    const bkrY = boardY + 220;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bkrX, bkrY, 90, 120);

    ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.fillRect(bkrX, bkrY + 40, 90, 80);
    ctx.fillStyle = '#F3E8FF';
    ctx.font = 'bold 13px monospace';
    ctx.fillText("Reactants", bkrX + 45, bkrY + 90);

  } else if (layout === 'history-timeline') {
    // 11. HISTORY & CONSTITUTION TIMELINE
    ctx.fillStyle = '#F43F5E';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("📜 HISTORICAL MILESTONES & CONSTITUTIONAL HERITAGE", boardX + 22, headerY + 16);

    const tY = boardY + 270;
    const tStart = boardX + 80;
    const tEnd = boardX + boardW - 120;

    // Timeline connecting line
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tStart, tY);
    ctx.lineTo(tEnd, tY);
    ctx.stroke();

    const milestones = [
      { year: "1947", label: "Independence" },
      { year: "1949", label: "Constitution Adopted" },
      { year: "1950", label: "Republic of India" }
    ];

    milestones.forEach((m, idx) => {
      const mx = tStart + idx * ((tEnd - tStart) / 2);
      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mx, tY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.year, mx, tY - 32);

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.fillText(m.label, mx, tY + 42);
    });

  } else {
    // 12. DEFAULT CONCEPTUAL FLOW & GENERAL SUBJECTS
    ctx.fillStyle = '#81B29A';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText("💡 CONCEPTUAL STRUCTURE & WORKFLOW", boardX + 22, headerY + 16);

    // 3 Process Cards representing the concept stages
    const stepW = 195;
    const stepH = 160;
    const startStepX = boardX + 45;
    const stepY = boardY + 190;

    const bullets = slide.bullets || [];
    const steps = [
      { num: "01", title: "Core Principle", desc: bullets[0] || "Foundational Rule", color: "#F2CC8F" },
      { num: "02", title: "Working Mechanism", desc: bullets[1] || "Active Interaction", color: "#E07A5F" },
      { num: "03", title: "Real-world Impact", desc: bullets[2] || "Practical Outcome", color: "#81B29A" }
    ];

    steps.forEach((st, idx) => {
      const sx = startStepX + idx * (stepW + 28);
      const isCardActive = (slideIndex % 3) === idx;

      ctx.fillStyle = isCardActive ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = isCardActive ? st.color : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = isCardActive ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sx, stepY, stepW, stepH, 16);
      ctx.fill();
      ctx.stroke();

      // Number badge
      ctx.fillStyle = st.color;
      ctx.font = '900 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`PHASE ${st.num}`, sx + 16, stepY + 30);

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText(st.title, sx + 16, stepY + 58);

      // Description
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px "Inter", sans-serif';
      drawWrappedLines(ctx, st.desc, sx + 16, stepY + 84, stepW - 32, 18, 3);

      // Arrow connecting to next card
      if (idx < 2) {
        ctx.fillStyle = '#E07A5F';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("➔", sx + stepW + 14, stepY + stepH / 2 + 5);
      }
    });
  }

  ctx.restore();
}
