const VALID_OPERATORS = new Set(['+', '-', '*', '/']);

export function evaluateCalculatorTerms(terms) {
  if (!Array.isArray(terms) || terms.length === 0) return 0;

  let subtotal = 0;
  let product = Number(terms[0]?.amount);
  if (!Number.isFinite(product)) throw new Error('Enter a valid amount.');

  for (let index = 0; index < terms.length - 1; index += 1) {
    const operator = terms[index]?.operatorAfter || '+';
    const next = Number(terms[index + 1]?.amount);
    if (!VALID_OPERATORS.has(operator) || !Number.isFinite(next)) throw new Error('Invalid calculation.');

    if (operator === '*') product *= next;
    else if (operator === '/') {
      if (next === 0) throw new Error('Cannot divide by zero.');
      product /= next;
    } else {
      subtotal += product;
      product = operator === '-' ? -next : next;
    }
  }

  const result = subtotal + product;
  if (!Number.isFinite(result)) throw new Error('Calculation is too large.');
  return Math.round((result + Math.sign(result) * Number.EPSILON) * 100) / 100;
}

export function calculatorExpression(terms, currentAmount = '') {
  const parts = [];
  for (const term of terms || []) {
    const amount = Number(term.amount);
    if (!Number.isFinite(amount)) continue;
    parts.push(String(amount));
    if (VALID_OPERATORS.has(term.operatorAfter)) parts.push(term.operatorAfter);
  }
  if (currentAmount !== '' && Number.isFinite(Number(currentAmount))) parts.push(String(Number(currentAmount)));
  return parts.join(' ');
}
