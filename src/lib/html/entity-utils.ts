/**
 * HTML Entity Encoding/Decoding Utilities
 *
 * Provides functions to encode and decode HTML entities, handling:
 * - Named entities (&amp;, &lt;, &gt;, &quot;, &apos;, &#39;)
 * - Decimal numeric entities (&#123;)
 * - Hexadecimal numeric entities (&x1F600;)
 */

/**
 * Encodes HTML special characters to their entity equivalents.
 *
 * @param input - The string to encode
 * @returns The HTML-encoded string
 *
 * @example
 * encodeEntities('<div>Hello & "World"</div>')
 * // => '&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;'
 */
export const encodeEntities = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Decodes HTML entities back to their character equivalents.
 *
 * Handles:
 * - Named entities: &amp;, &lt;, &gt;, &quot;, &apos;, &#39;
 * - Decimal numeric references: &#123;
 * - Hexadecimal numeric references: &#x1F600;
 *
 * @param input - The string with HTML entities to decode
 * @returns The decoded string
 *
 * @example
 * decodeEntities('&lt;a href=&quot;url&quot;&gt;Link&lt;/a&gt;')
 * // => '<a href="url">Link</a>'
 */
export const decodeEntities = (input: string): string => {
  return (
    input
      // Decode hexadecimal character references first (e.g., &#x1F600; -> 😀)
      .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
        const codePoint = Number.parseInt(hex, 16);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _match;
      })
      // Decode decimal character references (e.g., &#123; -> {)
      .replace(/&#(\d+);/g, (_match, dec) => {
        const codePoint = Number.parseInt(dec, 10);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _match;
      })
      // Decode named entities in correct order (&amp; must be last)
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
  );
};
