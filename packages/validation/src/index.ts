/**
 * @words-n-wands/validation
 *
 * Ownership boundary:
 * - Canonical word normalization, lookup, and element-tagging behavior belongs here.
 * - UI code should consume validation APIs from this package, not duplicate
 *   acceptance logic in screens/components.
 */
export * from "./contracts/index.js";
