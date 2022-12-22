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

const myAccountId = "0.0.19053020";
const myPrivateKey = "e563e25da29c40acedb7a7f6fe3ddfb502d33feb4cfae7aa7b4564b8ec834b4f";

const aliceId = AccountId.fromString("0.0.48664980");
const aliceKey = PrivateKey.fromString("3030020100300706052b8104000a0422042045f9e756269572da3fda5f414b27b48b22015f81bbd1b7e8365e6cd61de13abe");
const supplyKey = PrivateKey.fromString("3030020100300706052b8104000a042204203b28b7b961201b3aab7a2f274b49b0c4f5b5b58bc79a37c9715855b84b0bd2e7");
const bobId = AccountId.fromString("0.0.48636188")
const bobKey = PrivateKey.fromString("3030020100300706052b8104000a04220420a5055df9ef8fd5078af992c6d44504e20ad7dc86a42125b85e5b835642eabaef");

const adminId = AccountId.fromString("0.0.48636172")
let treasuryId = AccountId.fromString(myAccountId)
let treasuryKey = PrivateKey.fromString(myPrivateKey);

async function main() {
    let response = await createClient(myAccountId, myPrivateKey);
        if (response.err) {
            console.log("response.err", response.err);
            let outpuJSON = {
                message: "Client creation Failed",
                err: response.err
            };
            return outpuJSON;
        }
        let client = response.client;
        console.log("client called....")

		// treasury id to receive royalty
		let nftCustomFee = await new CustomRoyaltyFee()
		.setNumerator(1)
		.setDenominator(10)
		.setFeeCollectorAccountId(treasuryId)
		.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));

		// treasury id to receive royalty
		let nftCustomFee1 = await new CustomRoyaltyFee()
		.setNumerator(20)
		.setDenominator(100)
		.setFeeCollectorAccountId(adminId)	
		.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(3)));

	//Create the NFT
	let nftCreate = new TokenCreateTransaction()
		.setTokenName("ANISEED")
		.setTokenSymbol("AND")
		.setTokenType(TokenType.NonFungibleUnique)
		.setDecimals(0)
		.setInitialSupply(0)
		.setTreasuryAccountId(treasuryId)
		.setSupplyType(TokenSupplyType.Finite)
		.setMaxSupply(250)
		.setCustomFees([nftCustomFee, nftCustomFee1])
		.setMaxTransactionFee(new Hbar(50))
		.setSupplyKey(supplyKey)
		.freezeWith(client);
		console.log("b4 client");
	//Sign the transaction with the treasury key
	let nftCreateTxSign = await nftCreate.sign(treasuryKey);
	console.log("b4 execute");
	//Submit the transaction to a Hedera network
	let nftCreateSubmit = await nftCreateTxSign.execute(client);
	console.log("b4 receipt");
	//Get the transaction receipt
	let nftCreateRx = await nftCreateSubmit.getReceipt(client);

	//Get the token ID
	let tokenId = nftCreateRx.tokenId;

	//Log the token ID
	console.log(`- Created NFT with Token ID: ${tokenId} \n`);
	
	console.log("****************************************************************")

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
	// client show invalid_signature
	let mintTxSubmit = await mintTxSign.execute(client);

	//Get the transaction receipt
	let mintRx = await mintTxSubmit.getReceipt(client);

	//Log the serial number
	console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);

	console.log("****************************************************************")
	//Create the associate transaction and sign with Alice's key 
	let associateAliceTx = await new TokenAssociateTransaction()
		.setAccountId(aliceId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(PrivateKey.fromString("3030020100300706052b8104000a0422042045f9e756269572da3fda5f414b27b48b22015f81bbd1b7e8365e6cd61de13abe"));

	//Submit the transaction to a Hedera network
	let associateAliceTxSubmit = await associateAliceTx.execute(client);

	//Get the transaction receipt
	let associateAliceRx = await associateAliceTxSubmit.getReceipt(client);

	//Confirm the transaction was successful
	console.log(`- NFT association with Alice's account: ${associateAliceTxSubmit.transactionId}\n`);

	console.log("****************************************************************")
	let tokenTransferTx = await new TransferTransaction()
	.addNftTransfer(tokenId, 1, treasuryId, aliceId)
	.freezeWith(client)
	.sign(treasuryKey);

	let tokenTransferSubmit = await tokenTransferTx.execute(client);
	let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

	console.log(`\n- NFT transfer from Treasury to Alice: ${tokenTransferSubmit.transactionId} \n`);

	console.log("****************************************************************")
	//Create the associate transaction and sign with Alice's key 
	let associateAliceTx1 = await new TokenAssociateTransaction()
		.setAccountId(bobId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(PrivateKey.fromString("3030020100300706052b8104000a04220420a5055df9ef8fd5078af992c6d44504e20ad7dc86a42125b85e5b835642eabaef"));

	//Submit the transaction to a Hedera network
	let associateAliceTxSubmit1 = await associateAliceTx1.execute(client);

	//Get the transaction receipt
	let associateAliceRx1 = await associateAliceTxSubmit1.getReceipt(client);

	//Confirm the transaction was successful
	console.log(`- NFT association with bob's account: ${associateAliceTxSubmit1.transactionId}\n`);

	
	console.log("****************************************************************")
	let tokenTransferTx1 = new TransferTransaction()
	.addNftTransfer(tokenId, 1, aliceId, bobId)	
    .addHbarTransfer(aliceId, new Hbar(-50))
	.addHbarTransfer(bobId, new Hbar(50))
	.freezeWith(client);
	console.log("b4 sign");
	await tokenTransferTx1.sign(aliceKey);
	await tokenTransferTx1.sign(bobKey);
	console.log("b4 execute");
	let tokenTransferSubmit1 = await tokenTransferTx1.execute(client);
	console.log("b4 getReceipt");
	let tokenTransferRx1 = await tokenTransferSubmit1.getReceipt(client);

	console.log(`\n- NFT Secondary sale transfer from alice to Bob: ${tokenTransferSubmit1.transactionId} \n`);

		
	console.log("****************************************************************")
	let tokenTransferTx2 = new TransferTransaction()
	.addNftTransfer(tokenId, 1, bobId, aliceId)	
    .addHbarTransfer(aliceId, new Hbar(40))
	.addHbarTransfer(bobId, new Hbar(-40))
	.freezeWith(client);
	console.log("b4 sign");
	await tokenTransferTx2.sign(aliceKey);
	await tokenTransferTx2.sign(bobKey);
	console.log("b4 execute");
	let tokenTransferSubmit2 = await tokenTransferTx2.execute(client);
	console.log("b4 getReceipt");
	let tokenTransferRx2 = await tokenTransferSubmit2.getReceipt(client);

	console.log(`\n- NFT Secondary sale transfer from bob to alice: ${tokenTransferSubmit2.transactionId} \n`);

}

async function createClient(myAccountId, myPrivateKey) {

    let client;
    try {
    console.log("myAccountId: "+ myAccountId);
    console.log("myPrivateKey: "+ myPrivateKey);
    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }    
    // create your local machine
    console.log('..........create your local machine..............')
    client = Client.forTestnet();
    
    // set the txion fee paying account
    console.log('...........set the txion fee paying account..........')
    console.log("myAccountId  myPrivateKey"+ myAccountId, myPrivateKey);
    client.setOperator(myAccountId, myPrivateKey);
  
        let outputJson = {
            client: client
        };
      //  console.log("client return json: "+ JSON.stringify(outputJson));
        return outputJson;

    } catch (error) {
        //console.log("err3", error);
        let outpuJSON = {
            message: "client creation Error",
            err: error
        };
        return outpuJSON;
    }

}

main();