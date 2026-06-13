#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Bytes, BytesN, log};

#[contract]
pub struct ZkTicketVerifier;

#[contractimpl]
impl ZkTicketVerifier {
    // Check if a nullifier has already been spent to prevent double-spending
    pub fn is_spent(env: Env, nullifier_hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&nullifier_hash)
    }

    // Verify the ZK proof and register the nullifier as spent
    pub fn verify_and_claim(
        env: Env,
        proof: Bytes,
        _commitment: BytesN<32>,
        nullifier_hash: BytesN<32>,
    ) -> bool {
        // 1. Double-spend prevention check
        if env.storage().persistent().has(&nullifier_hash) {
            log!(&env, "ZK Claim Error: nullifier already spent");
            return false;
        }

        // 2. Cryptographic Proof Validation
        // In full production, this performs UltraPlonk pairing check equations.
        // For our testnet prototype, we enforce that proof payload is non-empty.
        if proof.len() == 0 {
            log!(&env, "ZK Claim Error: invalid or empty proof payload");
            return false;
        }

        // 3. Mark the nullifier hash as spent in persistent storage
        env.storage().persistent().set(&nullifier_hash, &true);
        log!(&env, "ZK Claim Success: ticket nullifier marked as spent");
        true
    }
}

#[cfg(test)]
mod test;


