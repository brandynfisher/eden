/* --------------------------------------------------------------
 * cost-helpers.ts (≈ 45 LOC instead of ~130)
 * ------------------------------------------------------------*/
import { Expression, Parser } from 'expr-eval'

/** ------------------------------------------------------------
 * 1. One parser instance = one grammar
 *    (conditional operator enabled by default in expr-eval ≥2.0)
 * ------------------------------------------------------------ */
const parser = new Parser()

/** ------------------------------------------------------------
 * 2. Detect param == "literal" or param != 'literal'
 * ------------------------------------------------------------ */
const hasDirectStringComparison = (formula: string, param: string) =>
  new RegExp(`${param}\\s*[=!]=\\s*(['"]).*?\\1`).test(formula)

/** ------------------------------------------------------------
 * 3. Normalise a single variable so that expr-eval
 *     sees the right type/shape.
 * ------------------------------------------------------------ */
function normaliseValue(param: string, raw: unknown, formula: string): unknown {
  if (raw == null) return '' // undefined/null → ''
  if (hasDirectStringComparison(formula, param)) {
    // keep raw for == / !=
    if (Array.isArray(raw)) return raw[0] ?? ''
    return typeof raw === 'string' ? raw : String(raw)
  }

  if (typeof raw === 'boolean') return raw ? 1 : 0
  if (Array.isArray(raw)) return raw.length
  if (typeof raw === 'string') return raw.length
  return raw // number or anything else
}

/** ------------------------------------------------------------
 * 4. Main entry point: same signature, same return type.
 * ------------------------------------------------------------ */
export function calculateCost(
  formula: string,
  formValues: Record<string, unknown>,
): number {
  // 4-A. Legacy ".length" → "_length" swap (unchanged)
  const rewritten = formula.replace(/\.length\b/g, '_length')

  // 4-B. Parse once → get the variable list from the AST
  let expr: Expression
  try {
    expr = parser.parse(rewritten)
  } catch (err) {
    console.error('Could not parse cost_estimate', err)
    return Infinity
  }
  const vars = expr.variables() // e.g. ['prompt', 'prompt_length', 'n']

  // 4-C. Build the eval-context
  const context: Record<string, unknown> = {}
  for (const name of vars) {
    if (name.endsWith('_length')) {
      // "foo_length" always means len(foo)
      const base = name.slice(0, -7) // drop '_length'
      const v = formValues[base]
      context[name] =
        Array.isArray(v) || typeof v === 'string' ? v.length : v ?? 0
      continue
    }
    context[name] = normaliseValue(name, formValues[name], rewritten)
  }

  // 4-D. Evaluate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = expr.evaluate(context as any)
  return typeof result === 'number' && isFinite(result) ? result : Infinity
}
