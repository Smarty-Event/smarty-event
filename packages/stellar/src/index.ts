import {
  Asset,
  Keypair,
  TransactionBuilder,
  Networks,
  Horizon,
  Operation,
} from "stellar-sdk";

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
