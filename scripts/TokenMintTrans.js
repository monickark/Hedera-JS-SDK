const {
    Client,
    PrivateKey,
    Hbar,
    AccountId,
    AccountCreateTransaction,
    AccountBalanceQuery,
    CustomRoyaltyFee,
    CustomFixedFee,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TokenAssociateTransaction,
	TransferTransaction
} = require('@hashgraph/sdk');
const { createClient } = require('./services/client');
require("dotenv").config();
const treasuryId = "0.0.19053020";
const supplyKey = PrivateKey.generate();
const privateKey = process.env.MY_PRIVATE_KEY;
let treasuryKey = PrivateKey.fromString(privateKey);


const aliceId = "0.0.48634738";
const alicePK = process.env.ALICE_PRIVATE_KEY;
let aliceKey = PrivateKey.fromString(alicePK);
async function main() {
    let response = await createClient();
        if (response.err) {
            console.log("response.err", response.err);
            let outpuJSON = {
                message: "Client creation Failed",
                err: response.err
            };
            return outpuJSON;
        }
        client = response.client;
        console.log("client called....")

	let nftCustomFee = await new CustomRoyaltyFee()
	.setNumerator(5)
	.setDenominator(10)
	.setFeeCollectorAccountId(treasuryId)
	.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));

	let nftCustomFee1 = await new CustomRoyaltyFee()
	.setNumerator(5)
	.setDenominator(20)
	.setFeeCollectorAccountId(treasuryId)
	.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));

	let nftCustomFee2 = await new CustomRoyaltyFee()
	.setNumerator(5)
	.setDenominator(40)
	.setFeeCollectorAccountId(treasuryId)
	.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));

	/***************************************   HBAR TESTING    **********************************************/
	console.log("***************************************   HBAR TESTING    **********************************************")
	const sendHbar = await new TransferTransaction()
	.addHbarTransfer(treasuryId, Hbar.fromTinybars(-100)) //person buying the resell asset
	.addHbarTransfer(aliceId, Hbar.fromTinybars(100)) //admin wallet address
	.execute(client);

	const transactionReceipt = await sendHbar.getReceipt(client);
	console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

	//Request the cost of the query
	const queryCost = await new AccountBalanceQuery()
	.setAccountId(aliceId)
	.getCost(client);

	console.log("The cost of query is: " +queryCost);

	//Check the new account's balance
	const getNewBalance = await new AccountBalanceQuery()
		.setAccountId(aliceId)
		.execute(client);

	console.log("The account balance after the transfer is: " +getNewBalance.hbars.toTinybars() +" tinybar.")
	
	console.log("***************************************   HBAR TESTING    **********************************************")

	/***************************************   HBAR TESTING    **********************************************/

	//Create the NFT
	let nftCreate = await new TokenCreateTransaction()
		.setTokenName("ANISEED")
		.setTokenSymbol("AND")
		.setTokenType(TokenType.NonFungibleUnique)
		.setDecimals(0)
		.setInitialSupply(0)
		.setTreasuryAccountId(treasuryId)
		.setSupplyType(TokenSupplyType.Finite)
		.setMaxSupply(250)
		.setCustomFees([nftCustomFee,nftCustomFee1,nftCustomFee2])
		.setSupplyKey(supplyKey)
		.freezeWith(client);

	//Sign the transaction with the treasury key
	let nftCreateTxSign = await nftCreate.sign(treasuryKey);

	//Submit the transaction to a Hedera network
	let nftCreateSubmit = await nftCreateTxSign.execute(client);

	//Get the transaction receipt
	let nftCreateRx = await nftCreateSubmit.getReceipt(client);

	//Get the token ID
	let tokenId = nftCreateRx.tokenId;

	//Log the token ID
	console.log(`- Created NFT with Token ID: ${tokenId} \n`);

	//IPFS content identifiers for which we will create a NFT
	let CID = ["QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa"];

	// Mint new NFT
	let mintTx = await new TokenMintTransaction()
		.setTokenId(tokenId)		
		.setMetadata([Buffer.from(CID)])		
		.freezeWith(client);

	//Sign the transaction with the supply key
	let mintTxSign = await mintTx.sign(supplyKey);

	//Submit the transaction to a Hedera network
	let mintTxSubmit = await mintTxSign.execute(client);

	//Get the transaction receipt
	let mintRx = await mintTxSubmit.getReceipt(client);

	//Log the serial number
	console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);
	
	//Create the associate transaction and sign with Alice's key 
	let associateAliceTx = await new TokenAssociateTransaction()
		.setAccountId(aliceId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(aliceKey);

	//Submit the transaction to a Hedera network
	let associateAliceTxSubmit = await associateAliceTx.execute(client);

	//Get the transaction receipt
	let associateAliceRx = await associateAliceTxSubmit.getReceipt(client);

	//Confirm the transaction was successful
	console.log(`- NFT association with Alice's account: ${associateAliceRx.status}\n`);


	// Check the balance before the transfer for the treasury account
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);

	// Check the balance before the transfer for Alice's account
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(aliceId).execute(client);
	console.log(`- Alice's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);

	// Transfer the NFT from treasury to Alice
	// Sign with the treasury key to authorize the transfer
	let tokenTransferTx = await new TransferTransaction()
		.addNftTransfer(tokenId, 1, treasuryId, aliceId)
		.freezeWith(client)
		.sign(treasuryKey);

	let tokenTransferSubmit = await tokenTransferTx.execute(client);
	let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

	console.log(`\n- NFT transfer from Treasury to Alice: ${tokenTransferRx.status} \n`);

	// Check the balance of the treasury account after the transfer
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log("Balance Transaction of Treasury Account:",balanceCheckTx.tokens.toString());

	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);

	// Check the balance of Alice's account after the transfer
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(aliceId).execute(client);
	console.log("Balance Transaction of ALice Account:",balanceCheckTx.tokens.toString());
	console.log(`- Alice's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);
	//Create the query



//v2.0.7
}
main();