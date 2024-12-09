export const DIRECTIVE_VALUES = {
    temp: "s-temp",
    cast: "s-cast",
    crate: "s-crate",
    delete: "s-delete",
    index: "s-index",
    sequence: "s-sequence",
    slot: "s-slot",
    preadd: "s-preadd",
    postadd: "s-postadd",
    predelete: "s-predelete",
    postdelete: "s-postdelete",
};

export const NOT_ALLOWED_PATTERNS = [
    /\bfunction\b/,
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
