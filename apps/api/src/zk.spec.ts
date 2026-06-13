import { generateZkKeys, generateZkProof, verifyZkProof } from "@repo/stellar";

describe("ZK-SNARK Prover and Verifier", () => {
  it("should successfully generate keys, generate proof, and verify it", async () => {
    // 1. Generate keys
    const keys = await generateZkKeys();
    expect(keys.secret).toBeDefined();
    expect(keys.nullifier).toBeDefined();
    expect(keys.commitment).toBeDefined();
    expect(keys.nullifierHash).toBeDefined();

    expect(keys.secret.length).toBe(64);
    expect(keys.nullifier.length).toBe(64);
    expect(keys.commitment.length).toBe(64);
    expect(keys.nullifierHash.length).toBe(64);

    // 2. Generate proof
    const proof = await generateZkProof(keys.secret, keys.nullifier);
    expect(proof).toBeDefined();
    expect(proof.length).toBe(256);

    // 3. Verify proof
    const isValid = await verifyZkProof(keys.commitment, keys.nullifierHash, proof);
    expect(isValid).toBe(true);
  });

  it("should reject verification if commitment does not match secret/nullifier", async () => {
    const keys1 = await generateZkKeys();
    const keys2 = await generateZkKeys();

    // Generate proof for keys1
    const proof1 = await generateZkProof(keys1.secret, keys1.nullifier);

    // Verify against keys2 commitment and nullifierHash
    const isValid = await verifyZkProof(keys2.commitment, keys2.nullifierHash, proof1);
    expect(isValid).toBe(false);

    // Verify against keys1 commitment but keys2 nullifierHash
    const isValidPartly = await verifyZkProof(keys1.commitment, keys2.nullifierHash, proof1);
    expect(isValidPartly).toBe(false);
  });

  it("should reject verification if proof data is modified/corrupted", async () => {
    const keys = await generateZkKeys();
    const proof = await generateZkProof(keys.secret, keys.nullifier);

    // Corrupt one character in the proof
    const corruptedProof = proof.substring(0, 10) + (proof[10] === "0" ? "1" : "0") + proof.substring(11);
    const isValid = await verifyZkProof(keys.commitment, keys.nullifierHash, corruptedProof);
    expect(isValid).toBe(false);
  });

  it("should reject verification if proof length is invalid", async () => {
    const keys = await generateZkKeys();
    const proof = await generateZkProof(keys.secret, keys.nullifier);

    const shortProof = proof.substring(0, 200);
    const isValid = await verifyZkProof(keys.commitment, keys.nullifierHash, shortProof);
    expect(isValid).toBe(false);
  });
});
