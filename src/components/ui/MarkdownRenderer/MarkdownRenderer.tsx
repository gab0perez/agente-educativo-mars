import React from 'react';
import styles from './MarkdownRenderer.module.css';

function replaceLatexFrac(str: string): string {
  let result = str;
  let safetyCounter = 0;

  while (/\\frac\s*\{/.test(result) && safetyCounter++ < 50) {
    const match = /\\frac\s*\{/.exec(result);
    if (!match) break;

    const startIdx = match.index;
    let braceCount = 0;
    let numEnd = -1;

    for (let i = startIdx + match[0].length - 1; i < result.length; i++) {
      if (result[i] === '{') braceCount++;
      else if (result[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          numEnd = i;
          break;
        }
      }
    }

    if (numEnd !== -1 && numEnd + 1 < result.length) {
      const remaining = result.slice(numEnd + 1);
      const nextBraceIdx = remaining.indexOf('{');
      if (nextBraceIdx !== -1) {
        const dStart = numEnd + 1 + nextBraceIdx;
        braceCount = 0;
        let denomEnd = -1;
        for (let i = dStart; i < result.length; i++) {
          if (result[i] === '{') braceCount++;
          else if (result[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              denomEnd = i;
              break;
            }
          }
        }
        if (denomEnd !== -1) {
          const numerator = result.slice(startIdx + match[0].length, numEnd);
          const denominator = result.slice(dStart + 1, denomEnd);
          result = result.slice(0, startIdx) + `(${numerator} / ${denominator})` + result.slice(denomEnd + 1);
          continue;
        }
      }
    }
    // Si no coincide la estructura estándar, reemplazar solo el prefijo para evitar bucle
    result = result.replace(/\\frac\s*\{/, '{');
  }

  return result;
}

/**
 * Limpia y convierte expresiones matemáticas en formato LaTeX a caracteres legibles en texto plano y Unicode
 */
export function cleanMathAndLatex(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Reemplazar raíces cuadradas \sqrt{a} o \sqrt[n]{a}
  while (/\\sqrt\[(.*?)\]\{(.*?)\}/s.test(cleaned)) {
    cleaned = cleaned.replace(/\\sqrt\[(.*?)\]\{(.*?)\}/g, '$1√($2)');
  }
  while (/\\sqrt\{(.*?)\}/s.test(cleaned)) {
    cleaned = cleaned.replace(/\\sqrt\{(.*?)\}/g, '√($1)');
  }

  // 2. Reemplazar fracciones \frac{numerador}{denominador} soportando expresiones anidadas
  cleaned = replaceLatexFrac(cleaned);

  // 3. Símbolos matemáticos comunes en LaTeX
  const symbolMap: Record<string, string> = {
    '\\\\pm': '±',
    '\\\\mp': '∓',
    '\\\\times': '×',
    '\\\\cdot': '·',
    '\\\\div': '÷',
    '\\\\neq': '≠',
    '\\\\leq': '≤',
    '\\\\le': '≤',
    '\\\\geq': '≥',
    '\\\\ge': '≥',
    '\\\\approx': '≈',
    '\\\\infty': '∞',
    '\\\\pi': 'π',
    '\\\\theta': 'θ',
    '\\\\alpha': 'α',
    '\\\\beta': 'β',
    '\\\\Delta': 'Δ',
    '\\\\delta': 'δ',
    '\\\\Sigma': 'Σ',
    '\\\\sigma': 'σ',
    '\\\\rightarrow': '➔',
    '\\\\to': '➔',
    '\\\\leftarrow': '⬅',
    '\\\\Rightarrow': '⇒',
    '\\\\Leftarrow': '⇐',
    '\\\\in': '∈',
    '\\\\notin': '∉',
    '\\\\subset': '⊂',
    '\\\\subseteq': '⊆',
    '\\\\cup': '∪',
    '\\\\cap': '∩',
    '\\\\forall': '∀',
    '\\\\exists': '∃'
  };

  for (const [latexSymbol, unicodeChar] of Object.entries(symbolMap)) {
    const regex = new RegExp(latexSymbol + '(?![a-zA-Z])', 'g');
    cleaned = cleaned.replace(regex, unicodeChar);
  }

  // 4. Limpiar superíndices comunes x^2 -> x², x^3 -> x³
  cleaned = cleaned
    .replace(/\^2(?!\d)/g, '²')
    .replace(/\^3(?!\d)/g, '³')
    .replace(/\^0(?!\d)/g, '⁰')
    .replace(/\^1(?!\d)/g, '¹')
    .replace(/\^4(?!\d)/g, '⁴')
    .replace(/\^5(?!\d)/g, '⁵')
    .replace(/\^6(?!\d)/g, '⁶')
    .replace(/\^7(?!\d)/g, '⁷')
    .replace(/\^8(?!\d)/g, '⁸')
    .replace(/\^9(?!\d)/g, '⁹')
    .replace(/\^n(?![a-zA-Z])/g, 'ⁿ')
    .replace(/\^x(?![a-zA-Z])/g, 'ˣ');

  // 5. Limpiar subíndices comunes x_1 -> x₁, x_2 -> x₂, x_0 -> x₀
  cleaned = cleaned
    .replace(/_0(?!\d)/g, '₀')
    .replace(/_1(?!\d)/g, '₁')
    .replace(/_2(?!\d)/g, '₂')
    .replace(/_3(?!\d)/g, '₃')
    .replace(/_4(?!\d)/g, '₄')
    .replace(/_n(?![a-zA-Z])/g, 'ₙ')
    .replace(/_i(?![a-zA-Z])/g, 'ᵢ');

  // 6. Eliminar delimitadores de LaTeX ($$ y $)
  cleaned = cleaned.replace(/\$\$/g, '').replace(/\$/g, '');

  return cleaned;
}

/**
 * Convierte texto en línea con formato básico Markdown (**negrita**, *cursiva*, `código`) a elementos React
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Negrita **texto**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    // Código `código`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);
    // Cursiva *texto*
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)/s);

    // Encontrar la coincidencia más temprana
    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch[1].length, match: boldMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch[1].length, match: codeMatch } : null,
      italicMatch ? { type: 'italic', index: italicMatch[1].length, match: italicMatch } : null
    ]
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0];
    const before = first.match[1];
    const content = first.match[2];
    const after = first.match[3];

    if (before) {
      parts.push(before);
    }

    if (first.type === 'bold') {
      parts.push(<strong key={`b-${keyIdx++}`} className={styles.bold}>{content}</strong>);
    } else if (first.type === 'code') {
      parts.push(<code key={`c-${keyIdx++}`} className={styles.inlineCode}>{content}</code>);
    } else if (first.type === 'italic') {
      parts.push(<em key={`i-${keyIdx++}`} className={styles.italic}>{content}</em>);
    }

    remaining = after;
  }

  return parts;
}

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Componente ligero para renderizar Markdown estructurado y limpiar fórmulas matemáticas
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  if (!content) return null;

  // 1. Limpieza de LaTeX crudo y caracteres matemáticos
  const sanitized = cleanMathAndLatex(content);

  // 2. Dividir por líneas para procesar bloques estructurados
  const lines = sanitized.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  let isNumberedList = false;
  let elemKey = 0;

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${elemKey++}`} className={styles.orderedList}>
            {currentListItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elemKey++}`} className={styles.unorderedList}>
            {currentListItems}
          </ul>
        );
      }
      currentListItems = [];
      isNumberedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Línea vacía -> separa párrafos
    if (!trimmed) {
      flushList();
      continue;
    }

    // Encabezados H1 - H4 (### Título)
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const inline = renderInlineMarkdown(text);

      if (level === 1) {
        elements.push(<h3 key={`h1-${elemKey++}`} className={styles.heading1}>{inline}</h3>);
      } else if (level === 2) {
        elements.push(<h4 key={`h2-${elemKey++}`} className={styles.heading2}>{inline}</h4>);
      } else {
        elements.push(<h5 key={`h3-${elemKey++}`} className={styles.heading3}>{inline}</h5>);
      }
      continue;
    }

    // Listas con viñetas (- o * o •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      const inline = renderInlineMarkdown(bulletMatch[1]);
      currentListItems.push(
        <li key={`li-${elemKey++}`} className={styles.listItem}>
          {inline}
        </li>
      );
      continue;
    }

    // Listas numeradas (1. o 1))
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      if (!isNumberedList && currentListItems.length > 0) flushList();
      isNumberedList = true;
      const inline = renderInlineMarkdown(numMatch[2]);
      currentListItems.push(
        <li key={`nli-${elemKey++}`} className={styles.listItem}>
          {inline}
        </li>
      );
      continue;
    }

    // Párrafo de texto regular
    flushList();
    const inline = renderInlineMarkdown(trimmed);
    elements.push(
      <p key={`p-${elemKey++}`} className={styles.paragraph}>
        {inline}
      </p>
    );
  }

  flushList();

  return <div className={`${styles.markdownContainer} ${className || ''}`}>{elements}</div>;
};
