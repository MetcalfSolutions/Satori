/**
 * The result shapes SatoriWeb's model-facing tools return: text as content
 * blocks, and errors as the same blocks flagged with `isError`.
 */

/** A tool result the model sees: the text as content blocks. */
export function textResult(text) {
  return { output: [{ type: "text", text }] };
}

/** A tool error result the model sees. */
export function errorResult(message) {
  return { output: [{ type: "text", text: message }], isError: true };
}
