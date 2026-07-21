// The generated card's pixel dimensions. This is not a runtime setting: the
// SVG layout in server/card/generate.ts (badge position, column centers,
// divider lines, ...) is hand-tuned around these exact numbers, so changing
// them requires reworking that layout too. Shared here so the client-side
// crop target (client/compressPhoto.ts) can never drift from what the
// server actually renders and validates against.
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1440;
