// Shared isomorphic ZK prover and verifier using BigInt modular arithmetic and Pedersen commitments.

// Domain Parameters
// Standard 256-bit prime modulus (secp256k1 field prime)
export const p = 115792089237316195423570985008687907853269984665640564039457584007908834671663n;

// Multiplicative group order
export const q = p - 1n;

// Generator base points (chosen as small primes for performance and simplicity)
export const g = 2n;
export const h = 3n;

// Isomorphic crypto object resolver (resolves Web Crypto API or Node.js webcrypto)
function getCrypto(): any {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  try {
    // Dynamic require to prevent client-side bundler errors
    return require("crypto").webcrypto;
  } catch {
    throw new Error("No cryptographic provider found");
  }
}

// Modular Exponentiation: (base^exponent) % modulus
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = ((base % modulus) + modulus) % modulus;
  let exp = exponent;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % modulus;
    }
    base = (base * base) % modulus;
    exp = exp / 2n;
  }
  return result;
}

// Convert data string to a bigint modulo q
export async function sha256ToBigInt(dataStr: string): Promise<bigint> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(dataStr);
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return BigInt("0x" + hashHex) % q;
}

// Generate cryptographically secure random bigint less than max
export function randomBigInt(max: bigint): bigint {
  const cryptoObj = getCrypto();
  const byteLength = 32;
  const array = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const val = BigInt("0x" + hex);
  return (val % (max - 1n)) + 1n; // range [1, max-1]
}

// Formats a bigint as a 64-character left-padded hex string
export function bigIntToHex64(val: bigint): string {
  return val.toString(16).padStart(64, "0");
}

// Generate client-side private secrets and public commitments
export async function generateZkKeys(): Promise<{
  secret: string;
  nullifier: string;
  commitment: string;
  nullifierHash: string;
}> {
  // Generate random 256-bit secret and nullifier
  const s = randomBigInt(q);
  const n = randomBigInt(q);

  // C = (g^s * h^n) % p (Pedersen Commitment)
  const gS = modPow(g, s, p);
  const hN = modPow(h, n, p);
  const C = (gS * hN) % p;

  // N = g^n % p (Nullifier Hash)
  const N = modPow(g, n, p);

  return {
    secret: bigIntToHex64(s),
    nullifier: bigIntToHex64(n),
    commitment: bigIntToHex64(C),
    nullifierHash: bigIntToHex64(N),
  };
}

// Generate mathematical zero-knowledge proof of knowledge for (secret, nullifier)
export async function generateZkProof(
  secretHex: string,
  nullifierHex: string
): Promise<string> {
  const s = BigInt("0x" + secretHex);
  const n = BigInt("0x" + nullifierHex);

  // Compute public parameters C and N from secrets
  const gS = modPow(g, s, p);
  const hN = modPow(h, n, p);
  const C = (gS * hN) % p;
  const N = modPow(g, n, p);

  // Generate random blinding factors
  const r_s = randomBigInt(q);
  const r_n = randomBigInt(q);

  // Compute commitment values (A_C, A_N)
  const A_C = (modPow(g, r_s, p) * modPow(h, r_n, p)) % p;
  const A_N = modPow(g, r_n, p);

  // Compute Fiat-Shamir challenge c
  const challengeInput = `${g}:${h}:${C}:${N}:${A_C}:${A_N}`;
  const c = await sha256ToBigInt(challengeInput);

  // Compute responses z_s and z_n
  const z_s = (r_s + c * s) % q;
  const z_n = (r_n + c * n) % q;

  // Serialize proof: A_C (32B) + A_N (32B) + z_s (32B) + z_n (32B) = 128B (256 hex characters)
  return (
    bigIntToHex64(A_C) +
    bigIntToHex64(A_N) +
    bigIntToHex64(z_s) +
    bigIntToHex64(z_n)
  );
}

// Verify mathematical zero-knowledge proof of commitment and nullifier hash
export async function verifyZkProof(
  commitmentHex: string,
  nullifierHashHex: string,
  proofHex: string
): Promise<boolean> {
  try {
    if (!proofHex || proofHex.length !== 256) {
      return false;
    }

    const C = BigInt("0x" + commitmentHex);
    const N = BigInt("0x" + nullifierHashHex);

    // Deserialize proof parameters
    const A_C = BigInt("0x" + proofHex.substring(0, 64));
    const A_N = BigInt("0x" + proofHex.substring(64, 128));
    const z_s = BigInt("0x" + proofHex.substring(128, 192));
    const z_n = BigInt("0x" + proofHex.substring(192, 256));

    // Recompute Fiat-Shamir challenge c
    const challengeInput = `${g}:${h}:${C}:${N}:${A_C}:${A_N}`;
    const c = await sha256ToBigInt(challengeInput);

    // Verify equation 1: g^z_s * h^z_n == A_C * C^c (mod p)
    const lhs1 = (modPow(g, z_s, p) * modPow(h, z_n, p)) % p;
    const rhs1 = (A_C * modPow(C, c, p)) % p;

    // Verify equation 2: g^z_n == A_N * N^c (mod p)
    const lhs2 = modPow(g, z_n, p);
    const rhs2 = (A_N * modPow(N, c, p)) % p;

    return lhs1 === rhs1 && lhs2 === rhs2;
  } catch (err) {
    console.error("ZK verification error:", err);
    return false;
  }
}
