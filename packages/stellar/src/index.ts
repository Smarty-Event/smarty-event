import {
  Asset,
  Keypair,
  TransactionBuilder,
  Networks,
  Horizon,
  Operation,
  rpc,
  Contract,
  xdr,
  scValToNative,
  Transaction
} from "stellar-sdk";

export const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const server = new Horizon.Server(HORIZON_URL);

export interface StellarWallet {
  publicKey: string;
  secret: string;
}

export function generateKeypair(): StellarWallet {
  const pair = Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secret: pair.secret(),
  };
}

// Helper to fund account via Friendbot
async function fundAccount(publicKey: string): Promise<void> {
  const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fund account via Friendbot: ${response.statusText}`);
  }
}

// Ensure account is funded on Testnet
export async function ensureAccountActive(publicKey: string): Promise<void> {
  try {
    await server.loadAccount(publicKey);
  } catch (err: any) {
    // If account not found (404), fund it
    if (err.response && err.response.status === 404) {
      await fundAccount(publicKey);
      // Wait a short duration for the ledger to close and activate
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      throw err;
    }
  }
}

export async function createTicketAsset(params: {
  issuerSecret: string;
  distributorSecret: string;
  assetCode: string;
  limit: string;
}) {
  const issuerKey = Keypair.fromSecret(params.issuerSecret);
  const distKey = Keypair.fromSecret(params.distributorSecret);
  const asset = new Asset(params.assetCode, issuerKey.publicKey());

  // Ensure both accounts are active
  await ensureAccountActive(issuerKey.publicKey());
  await ensureAccountActive(distKey.publicKey());

  // 1. Establish Trustline from Distributor to Issuer for the custom asset
  const distAccount = await server.loadAccount(distKey.publicKey());
  const trustTx = new TransactionBuilder(distAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        limit: params.limit,
      })
    )
    .setTimeout(180)
    .build();

  trustTx.sign(distKey);
  await server.submitTransaction(trustTx);

  // 2. Mint (Pay) asset supply from Issuer to Distributor
  const issuerAccount = await server.loadAccount(issuerKey.publicKey());
  const mintTx = new TransactionBuilder(issuerAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: distKey.publicKey(),
        asset: asset,
        amount: params.limit,
      })
    )
    .setTimeout(180)
    .build();

  mintTx.sign(issuerKey);
  const result = await server.submitTransaction(mintTx);

  return {
    assetCode: params.assetCode,
    txHash: result.hash,
  };
}

export async function mintTicket(params: {
  distributorSecret: string;
  destinationSecret: string;
  destinationPublicKey: string;
  assetCode: string;
  issuerPublicKey: string;
  amount: string;
}) {
  const distKey = Keypair.fromSecret(params.distributorSecret);
  const destKey = Keypair.fromSecret(params.destinationSecret);
  const asset = new Asset(params.assetCode, params.issuerPublicKey);

  // Ensure accounts are active (especially the new attendee account)
  await ensureAccountActive(distKey.publicKey());
  await ensureAccountActive(destKey.publicKey());

  // 1. Attendee sets trustline for the asset
  const destAccount = await server.loadAccount(destKey.publicKey());
  const trustTx = new TransactionBuilder(destAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: asset,
      })
    )
    .setTimeout(180)
    .build();

  trustTx.sign(destKey);
  await server.submitTransaction(trustTx);

  // 2. Distributor transfers 1 ticket asset to the attendee
  const distAccount = await server.loadAccount(distKey.publicKey());
  const paymentTx = new TransactionBuilder(distAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: destKey.publicKey(),
        asset: asset,
        amount: params.amount,
      })
    )
    .setTimeout(180)
    .build();

  paymentTx.sign(distKey);
  const result = await server.submitTransaction(paymentTx);

  return {
    txHash: result.hash,
  };
}

export async function verifyTicketOwnership(params: {
  publicKey: string;
  assetCode: string;
  issuerPublicKey: string;
}): Promise<boolean> {
  try {
    const account = await server.loadAccount(params.publicKey);
    const balance = account.balances.find((b: any) => {
      return (
        b.asset_code === params.assetCode &&
        b.asset_issuer === params.issuerPublicKey
      );
    });

    if (balance) {
      return parseFloat(balance.balance) >= 1.0;
    }
    return false;
  } catch (err) {
    // If account doesn't exist or load failed, return false
    return false;
  }
}

export async function transferTicket(params: {
  distributorSecret: string;
  destinationPublicKey: string;
  assetCode: string;
  issuerPublicKey: string;
  amount: string;
}) {
  const distKey = Keypair.fromSecret(params.distributorSecret);
  const asset = new Asset(params.assetCode, params.issuerPublicKey);

  // Ensure distributor account is active
  await ensureAccountActive(distKey.publicKey());

  // Distributor transfers 1 ticket asset to the attendee
  const distAccount = await server.loadAccount(distKey.publicKey());
  const paymentTx = new TransactionBuilder(distAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: params.destinationPublicKey,
        asset: asset,
        amount: params.amount,
      })
    )
    .setTimeout(180)
    .build();

  paymentTx.sign(distKey);
  const result = await server.submitTransaction(paymentTx);

  return {
    txHash: result.hash,
  };
}

export async function prepareTrustlineTx(params: {
  publicKey: string;
  assetCode: string;
  issuerPublicKey: string;
}): Promise<string> {
  // Ensure account is funded on testnet
  await ensureAccountActive(params.publicKey);

  // Load account sequence
  const destAccount = await server.loadAccount(params.publicKey);
  const asset = new Asset(params.assetCode, params.issuerPublicKey);

  // Build Transaction
  const tx = new TransactionBuilder(destAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: asset,
      })
    )
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

export async function isNullifierSpentOnChain(params: {
  contractId: string;
  nullifierHash: string;
  callerPublicKey: string;
}): Promise<boolean> {
  await ensureAccountActive(params.callerPublicKey);
  const callerAccount = await server.loadAccount(params.callerPublicKey);

  const contract = new Contract(params.contractId);
  const op = contract.call(
    "is_spent",
    xdr.ScVal.scvBytes(Buffer.from(params.nullifierHash, "hex"))
  );

  const tx = new TransactionBuilder(callerAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim)}`);
  }

  if (!sim.result) {
    throw new Error("Simulation result is missing");
  }

  return scValToNative(sim.result.retval) as boolean;
}

export async function verifyZkTicketOnChain(params: {
  contractId: string;
  proof: string;
  commitment: string;
  nullifierHash: string;
  distributorSecret: string;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const deployerKey = Keypair.fromSecret(params.distributorSecret);
  const deployerPublic = deployerKey.publicKey();

  await ensureAccountActive(deployerPublic);
  const deployerAccount = await server.loadAccount(deployerPublic);

  const contract = new Contract(params.contractId);
  const op = contract.call(
    "verify_and_claim",
    xdr.ScVal.scvBytes(Buffer.from(params.proof, "hex")),
    xdr.ScVal.scvBytes(Buffer.from(params.commitment, "hex")),
    xdr.ScVal.scvBytes(Buffer.from(params.nullifierHash, "hex"))
  );

  const tx = new TransactionBuilder(deployerAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  // 1. Simulate first to see if it is valid (which returns the boolean value of verify_and_claim)
  const sim = await rpcServer.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    return { success: false, error: `Simulation failed: ${sim.error}` };
  }

  if (!sim.result) {
    return { success: false, error: "Simulation succeeded but result is missing" };
  }

  const isVal = scValToNative(sim.result.retval) as boolean;
  if (!isVal) {
    return { success: false, error: "Invalid proof or ticket nullifier already spent on-chain" };
  }

  // 2. Assemble, sign and submit
  const resultTx = rpc.assembleTransaction(tx, sim).build() as Transaction;
  resultTx.sign(deployerKey);

  const sendResponse = await rpcServer.sendTransaction(resultTx);
  if (sendResponse.status === "ERROR") {
    return { success: false, error: `Transaction send failed: ${JSON.stringify(sendResponse)}` };
  }

  // 3. Poll for inclusion
  for (let i = 0; i < 30; i++) {
    const rawTxStatus = await rpcServer._getTransaction(sendResponse.hash);
    if (rawTxStatus.status === "SUCCESS") {
      return { success: true, txHash: sendResponse.hash };
    } else if (rawTxStatus.status === "FAILED") {
      return { success: false, error: "Transaction execution failed on-chain" };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { success: false, error: "Transaction polling timed out" };
}

export * from "./zk";

