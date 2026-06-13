use super::*;
use soroban_sdk::{Env, Bytes, BytesN};

#[test]
fn test_verify_and_claim_flow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZkTicketVerifier);
    let client = ZkTicketVerifierClient::new(&env, &contract_id);

    let proof = Bytes::from_slice(&env, &[1, 2, 3, 4]);
    let commitment = BytesN::from_array(&env, &[7; 32]);
    let nullifier_hash = BytesN::from_array(&env, &[9; 32]);

    // Nullifier should initially not be marked spent
    assert_eq!(client.is_spent(&nullifier_hash), false);

    // Verify and claim ticket
    let claim_result = client.verify_and_claim(&proof, &commitment, &nullifier_hash);
    assert_eq!(claim_result, true);

    // Nullifier should now be marked spent
    assert_eq!(client.is_spent(&nullifier_hash), true);

    // Try to claim again (double-spend attempt)
    let double_claim_result = client.verify_and_claim(&proof, &commitment, &nullifier_hash);
    assert_eq!(double_claim_result, false);
}

#[test]
fn test_empty_proof_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZkTicketVerifier);
    let client = ZkTicketVerifierClient::new(&env, &contract_id);

    let empty_proof = Bytes::new(&env);
    let commitment = BytesN::from_array(&env, &[7; 32]);
    let nullifier_hash = BytesN::from_array(&env, &[9; 32]);

    // Verification with empty proof should return false
    let claim_result = client.verify_and_claim(&empty_proof, &commitment, &nullifier_hash);
    assert_eq!(claim_result, false);
    assert_eq!(client.is_spent(&nullifier_hash), false);
}
