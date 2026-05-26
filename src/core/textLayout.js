export const INLINE_TEXT_PADDING_X = 16;
export const INLINE_TEXT_PADDING_Y = 10;
export const INLINE_TEXT_LINE_HEIGHT = 1.25;
export const MIN_INLINE_FONT_SIZE = 8;

export function textFont(shape, size) {
  const family = shape.fontFamily || 'Caveat';
  return `${size}px '${family}', cursive`;
}

function measureWidth(ctx, font, text) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function wrapLongWord(ctx, word, maxWidth, font) {
  const chunks = [];
  let current = '';
  for (const char of word) {
    const test = current + char;
    if (current && measureWidth(ctx, font, test) > maxWidth) {
      chunks.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function wrapText(ctx, text, maxWidth, font) {
  if (!text) return [''];
  const lines = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    let current = '';
    for (const word of paragraph.split(/\s+/)) {
      const wordChunks = measureWidth(ctx, font, word) > maxWidth
        ? wrapLongWord(ctx, word, maxWidth, font)
        : [word];

      for (const chunk of wordChunks) {
        const test = current ? `${current} ${chunk}` : chunk;
        if (!current || measureWidth(ctx, font, test) <= maxWidth) {
          current = test;
        } else {
          lines.push(current);
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [''];
}

export function fitTextToBox(ctx, shape, text, maxWidth, maxHeight) {
  const baseSize = shape.fontSize || 18;
  const minSize = Math.min(baseSize, MIN_INLINE_FONT_SIZE);
  const usableWidth = Math.max(1, maxWidth);
  const usableHeight = Math.max(1, maxHeight);

  for (let size = baseSize; size >= minSize; size -= 1) {
    const font = textFont(shape, size);
    const lines = wrapText(ctx, text, usableWidth, font);
    const lineHeight = size * INLINE_TEXT_LINE_HEIGHT;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= usableHeight) {
      return { fontSize: size, font, lines, lineHeight, totalHeight };
    }
  }

  const font = textFont(shape, minSize);
  const lines = wrapText(ctx, text, usableWidth, font);
  const lineHeight = minSize * INLINE_TEXT_LINE_HEIGHT;
  return {
    fontSize: minSize,
    font,
    lines,
    lineHeight,
    totalHeight: lines.length * lineHeight,
  };
}
