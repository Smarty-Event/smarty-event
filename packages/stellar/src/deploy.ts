import {
  Keypair,
  TransactionBuilder,
  Networks,
  Horizon,
  Operation,
  xdr,
  Address,
  StrKey,
  rpc,
  Transaction,
  scValToNative
} from "stellar-sdk";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

async function fundAccount(publicKey: string): Promise<void> {
  const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fund account: ${response.statusText}`);
  }
}

async function ensureAccountActive(publicKey: string): Promise<void> {
  try {
    await server.loadAccount(publicKey);
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      console.log(`Funding deployer account ${publicKey} via Friendbot...`);
      await fundAccount(publicKey);
      await new Promise((resolve) => setTimeout(resolve, 4000));
    } else {
      throw err;
    }
  }
}

async function sendAndWait(tx: Transaction): Promise<string> {
  const sendResponse = await rpcServer.sendTransaction(tx);
  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction send failed: ${JSON.stringify(sendResponse)}`);
  }
  console.log(`Submitted Tx Hash: ${sendResponse.hash}. Polling status...`);
  for (let i = 0; i < 30; i++) {
    const rawTxStatus = await rpcServer._getTransaction(sendResponse.hash);
    if (rawTxStatus.status === "SUCCESS") {
      if (!rawTxStatus.resultXdr) {
        throw new Error("Transaction succeeded but resultXdr is missing!");
      }
      return rawTxStatus.resultXdr;
    } else if (rawTxStatus.status === "FAILED") {
      throw new Error(`Transaction failed: ${JSON.stringify(rawTxStatus)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Transaction polling timed out.");
}

async function deploy() {
  let deployerSecret = process.env.DEPLOYER_SECRET;
  let deployerKey: Keypair;
  if (!deployerSecret) {
    console.log("No DEPLOYER_SECRET provided. Generating a fresh deployer keypair...");
    deployerKey = Keypair.random();
  } else {
    deployerKey = Keypair.fromSecret(deployerSecret);
  }
  const deployerPublic = deployerKey.publicKey();
  console.log(`Deployer Public Key: ${deployerPublic}`);

  await ensureAccountActive(deployerPublic);

  const wasmPath = path.join(
    __dirname,
    "../../soroban/target/wasm32-unknown-unknown/release/zk_ticket_verifier.wasm"
  );
  if (!fs.existsSync(wasmPath)) {
    console.error(`WASM file not found at ${wasmPath}. Please run cargo build first.`);
    process.exit(1);
  }

  const wasmBytes = fs.readFileSync(wasmPath);
  console.log(`Loaded WASM bytes: ${wasmBytes.length} bytes`);

  // Local calculation of WASM ID hash (SHA-256 of bytecode)
  const wasmIdHash = crypto.createHash("sha256").update(wasmBytes).digest("hex");
  console.log(`WASM ID Hash (SHA-256): ${wasmIdHash}`);

  const deployerAccount = await server.loadAccount(deployerPublic);

  // 1. Upload WASM Bytecode
  console.log("Uploading WASM bytecode to Testnet...");
  const uploadOp = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmBytes),
    auth: []
  });

  const uploadTx = new TransactionBuilder(deployerAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(uploadOp)
    .setTimeout(180)
    .build();

  // Simulate transaction to get footprint and resource fees
  const uploadSim = await rpcServer.simulateTransaction(uploadTx);
  if (!rpc.Api.isSimulationSuccess(uploadSim)) {
    throw new Error(`Upload simulation failed: ${JSON.stringify(uploadSim)}`);
  }

  const uploadResultTx = rpc.assembleTransaction(uploadTx, uploadSim).build() as Transaction;
  uploadResultTx.sign(deployerKey);
  
  console.log("Submitting upload transaction...");
  await sendAndWait(uploadResultTx);
  console.log("WASM bytecode uploaded successfully.");

  // Reload account sequence
  const updatedAccount = await server.loadAccount(deployerPublic);

  // 2. Create Contract Instance
  console.log("Instantiating contract on Testnet...");
  const salt = crypto.randomBytes(32);
  
  const createArgs = new xdr.CreateContractArgs({
    contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
      new xdr.ContractIdPreimageFromAddress({
        address: Address.fromString(deployerPublic).toScAddress(),
        salt: salt
      })
    ),
    executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.from(wasmIdHash, "hex"))
  });

  const createOp = Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeCreateContract(createArgs),
    auth: []
  });

  const createTx = new TransactionBuilder(updatedAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(createOp)
    .setTimeout(180)
    .build();

  const createSim = await rpcServer.simulateTransaction(createTx);
  if (!rpc.Api.isSimulationSuccess(createSim)) {
    throw new Error(`Create simulation failed: ${JSON.stringify(createSim)}`);
  }

  // Extract the deterministic Contract ID from simulation result
  if (!createSim.result) {
    throw new Error("Create simulation succeeded but result is missing");
  }
  const contractId = scValToNative(createSim.result.retval);
  console.log(`Derived Contract ID from simulation: ${contractId}`);

  const createResultTx = rpc.assembleTransaction(createTx, createSim).build() as Transaction;
  createResultTx.sign(deployerKey);

  console.log("Submitting instantiate transaction...");
  await sendAndWait(createResultTx);
  
  console.log(`\n🎉 Success! Soroban Contract Deployed!`);
  console.log(`CONTRACT_ID: ${contractId}\n`);
}

deploy().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
