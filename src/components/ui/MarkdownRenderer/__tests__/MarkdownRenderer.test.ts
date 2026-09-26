import { describe, it, expect } from 'vitest';
import { cleanMathAndLatex } from '../MarkdownRenderer';

describe('MarkdownRenderer — cleanMathAndLatex', () => {
  it('convierte fracciones de LaTeX a formato plano legible', () => {
    const input = '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$';
    const output = cleanMathAndLatex(input);

    expect(output).not.toContain('\\frac');
    expect(output).not.toContain('$$');
    expect(output).not.toContain('\\pm');
    expect(output).not.toContain('\\sqrt');
    expect(output).toContain('±');
    expect(output).toContain('√');
    expect(output).toContain('b²');
  });

  it('elimina los delimitadores de LaTeX $ y $$', () => {
    const input = 'El valor de $a$ es $2$ y el de $b$ es $5$.';
    const output = cleanMathAndLatex(input);

    expect(output).toBe('El valor de a es 2 y el de b es 5.');
  });

  it('convierte flechas y operadores lógicos a símbolos Unicode', () => {
    const input = '$a = 2$ $\\rightarrow$ $x \\neq 0$ $\\approx 5$';
    const output = cleanMathAndLatex(input);

    expect(output).toContain('➔');
    expect(output).toContain('≠');
    expect(output).toContain('≈');
    expect(output).not.toContain('$');
  });

  it('convierte potencias y subíndices a Unicode', () => {
    const input = '2x^2 + 3x^3 = x_1 + x_2';
    const output = cleanMathAndLatex(input);

    expect(output).toBe('2x² + 3x³ = x₁ + x₂');
  });
});
