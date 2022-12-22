console.clear();
import { Client, AccountId, PrivateKey, Hbar, NftId } from "@hashgraph/sdk";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

import accountCreateFcn from "./utils/accountCreate.js";
import * as approvals from "./utils/allowanceApprovals.js";
import * as transfers from "./utils/allowanceTransfers.js";
import * as queries from "./utils/queries.js";
import * as htsTokens from "./utils/tokenOperations.js";

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Creating Hedera accounts and HTS token...\n`);

	const initBalance = new Hbar(10);
	const treasuryKey = PrivateKey.generateED25519();
	const [treasurySt, treasuryId] = await accountCreateFcn(treasuryKey, initBalance, client);
	console.log(`- Treasury's account: https://hashscan.io/#/testnet/account/${treasuryId}`);
	const aliceKey = PrivateKey.generateED25519();
	const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
	console.log(`- Alice's account: https://hashscan.io/#/testnet/account/${aliceId}`);
	const bobKey = PrivateKey.generateED25519();
	const [bobSt, bobId] = await accountCreateFcn(bobKey, initBalance, client);
	console.log(`- Bob's account: https://hashscan.io/#/testnet/account/${bobId}`);

	const [tokenId, tokenInfo] = await htsTokens.createMintNftFcn("HBAR ROCKS", "HROCK", 0, 1000, treasuryId, treasuryKey, client);
	console.log(`\n- Token ID: ${tokenId}`);
	console.log(`- Token supply after minting NFTs: ${tokenInfo.totalSupply.low}`);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Treasury approving NFT allowance for Alice...\n`);

	// Can approve all serials under a NFT collection
	// Or can approve individual serials under a NFT collection
	const nft1 = new NftId(tokenId, 1);
	const nft2 = new NftId(tokenId, 2);
	const nft3 = new NftId(tokenId, 3);
	const nft2approve = [nft1, nft2, nft3];
	const allowanceApproveNftRx = await approvals.nftAllowanceFcn(tokenId, treasuryId, aliceId, nft2approve, treasuryKey, client);
	console.log(`- Allowance approval status: ${allowanceApproveNftRx.status}`);

	await queries.balanceCheckerFcn(treasuryId, tokenId, client);
	await queries.balanceCheckerFcn(aliceId, tokenId, client);
	await queries.balanceCheckerFcn(bobId, tokenId, client);

	// STEP 3 ===================================
	console.log(`\nSTEP 3 ===================================\n`);
	console.log(`- Alice performing allowance transfer from Treasury to Bob...\n`);
	const allowanceSendNftRx = await transfers.nftAllowanceFcn(treasuryId, bobId, nft3, aliceId, aliceKey, client);
	console.log(`- Allowance transfer status: ${allowanceSendNftRx.status} \n`);

	await queries.balanceCheckerFcn(treasuryId, tokenId, client);
	await queries.balanceCheckerFcn(aliceId, tokenId, client);
	await queries.balanceCheckerFcn(bobId, tokenId, client);

	// STEP 4 ===================================
	console.log(`\nSTEP 4 ===================================\n`);
	console.log(`- Treasury deleting NFT allowance for Alice...\n`);

	const nft2disallow = [nft1, nft2];
	const allowanceDeleteNftRx = await approvals.nftAllowanceDeleteFcn(treasuryId, nft2disallow, treasuryKey, client);
	console.log(`- Allowance deletion status: ${allowanceDeleteNftRx.status}`);

	console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);
}
main();