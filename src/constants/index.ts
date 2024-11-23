export const BIND_DIRECTIVE_VALUES = ["value", "href", "src"] as const;
export const ON_DIRECTIVE_VALUES = ["click", "change", "input"] as const;
export const NOT_ALLOWED_PATTERNS = [
    /=>/,
    /\bfunction\b/,
    /\bnew\b/,
    /\beval\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bXMLHttpRequest\b/,
    /\bfetch\b/,
    /\bsetTimeout\b/,
    /\bsetInterval\b/,
    /\bPromise\b/,
    /\basync\b/,
    /\bawait\b/,
    /\bimport\b/,
    /\bexport\b/,
];
