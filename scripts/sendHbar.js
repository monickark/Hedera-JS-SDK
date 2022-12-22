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

const hb_treasury_id = process.env.HBAR_TREASURY_ID;
const hb_treasury_pk = process.env.HBAR_TREASURY_PRIVATE_KEY;
let treasuryKey = PrivateKey.fromString(hb_treasury_pk);

const hb_marketplace_id = process.env.HBAR_MARKETPLACE_ID;
const hb_marketplace_pk = process.env.HBAR_MARKETPLACE_PRIVATE_KEY;
let marketplaceKey = PrivateKey.fromString(hb_marketplace_pk);

const hb_seller_id = process.env.HBAR_SELLER_ID;
const hb_seller_pk = process.env.HBAR_SELLER_PRIVATE_KEY;
let sellerKey = PrivateKey.fromString(hb_seller_pk);

const hb_buyer_id = process.env.HBAR_BUYER_ID;
const hb_buyer_pk = process.env.HBAR_BUYER_PRIVATE_KEY;
let buyerKey = PrivateKey.fromString(hb_buyer_pk);


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
       let client = response.client;

	console.log("***************************************   PAYMENT FROM BUYER TO ADMIN WALLET    **********************************************")
	console.log("balance b4 txion");

	const bb = await new AccountBalanceQuery().setAccountId(hb_buyer_id).execute(client);
	console.log("The account balance of buyer before the transfer is: " +bb.hbars.toTinybars() +" tinybar.")

	const tb = await new AccountBalanceQuery().setAccountId(hb_treasury_id).execute(client);
	console.log("The account balance of treasury before the transfer is: " +tb.hbars.toTinybars() +" tinybar.")
	
	const sendHbar = await new TransferTransaction()
	.addHbarTransfer(hb_buyer_id, Hbar.fromTinybars(-100)) //person buying the resell asset
	.addHbarTransfer(hb_treasury_id, Hbar.fromTinybars(100)) //admin wallet address
	.execute(client);

	const transactionReceipt = await sendHbar.getReceipt(client);
	console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

	console.log("balance after txion");

	const bba = await new AccountBalanceQuery().setAccountId(hb_buyer_id).execute(client);
	console.log("The account balance of buyer after the transfer is: " +bba.hbars.toTinybars() +" tinybar.")

	const tba = await new AccountBalanceQuery().setAccountId(hb_treasury_id).execute(client);
	console.log("The account balance of treasury after the transfer is: " +tba.hbars.toTinybars() +" tinybar.")
	
	console.log("***************************************   HBAR TESTING    **********************************************")
//v2.0.7
}
main();