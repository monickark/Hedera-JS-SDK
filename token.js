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
const treasuryId = AccountId.fromString("0.0.19053020");
const supplyKey = PrivateKey.fromString("3030020100300706052b8104000a042204203b28b7b961201b3aab7a2f274b49b0c4f5b5b58bc79a37c9715855b84b0bd2e7");
const privateKey = process.env.MY_PRIVATE_KEY;
let treasuryKey = PrivateKey.fromString(privateKey);

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
		.setCustomFees([nftCustomFee])
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
}
main();