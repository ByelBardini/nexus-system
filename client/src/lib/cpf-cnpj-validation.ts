/**
 * Returns true only when VITE_VALIDATE_CPF_CNPJ is absent or any value other
 * than the literal string "false". Setting it to "false" disables the check
 * in development so testers don't need real documents.
 */
export function isCpfCnpjValidationEnabled(): boolean {
  const raw = import.meta.env.VITE_VALIDATE_CPF_CNPJ;
  return raw !== "false";
}

/** Standard mod-11 CPF check. Expects raw digits (no formatting). */
export function validarCPF(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const calc = (len: number) => {
    const sum = d
      .slice(0, len)
      .split("")
      .reduce((acc, n, i) => acc + Number(n) * (len + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

/** Standard mod-11 CNPJ check. Expects raw digits (no formatting). */
export function validarCNPJ(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const calc = (w: number[]) => {
    const sum = w.reduce((acc, weight, i) => acc + Number(d[i]) * weight, 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  return calc(weights1) === Number(d[12]) && calc(weights2) === Number(d[13]);
}

/** Validates a string that may hold either a CPF (11 digits) or CNPJ (14 digits). */
export function validarCPFouCNPJ(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return validarCPF(d);
  if (d.length === 14) return validarCNPJ(d);
  return false;
}
