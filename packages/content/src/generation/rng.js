const UINT32_MAX = 0x100000000;

function hashStringToUint32(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDeterministicRng(seed) {
  if (!/^[0-9a-f]{32}$/.test(seed)) {
    throw new Error(`Invalid generation_seed. Expected 32 lowercase hex chars, got: ${seed}`);
  }

  let state = hashStringToUint32(seed);
  if (state === 0) {
    state = 0x6d2b79f5;
  }

  return {
    nextUint32() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state;
    },
    nextFloat() {
      return this.nextUint32() / UINT32_MAX;
    },
    pickOne(values) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Cannot pick from an empty collection.');
      }
      const index = Math.floor(this.nextFloat() * values.length);
      return values[index];
    },
    pickIntInclusive(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new Error(`Invalid pickIntInclusive bounds: min=${min}, max=${max}`);
      }
      const span = max - min + 1;
      return min + (this.nextUint32() % span);
    }
  };
}
