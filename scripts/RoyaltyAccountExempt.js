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
import dotenv from 'dotenv'

import path, { dirname } from 'path'
import { env } from "process";
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })


const envClient = Client.forTestnet();
envClient.setOperator(AccountId.fromString(process.env.OPERATOR_ID), PrivateKey.fromString(process.env.OPERATOR_KEY));

let tokenId;
async function main() {
    // create a client for Seller which will create a token too
    const sellerKey = PrivateKey.generateED25519();
    const sellerAccount = await createAccount(sellerKey.publicKey)
    // create a client for Buyer who will associate with the token
    const BuyerKey = PrivateKey.generateED25519();
    const BuyerAccount = await createAccount(BuyerKey.publicKey)

    // create a client for Admin who will associate with the token
    const adminKey = PrivateKey.generateED25519();
    const adminAccount = await createAccount(adminKey.publicKey)


    // create a client for Treasury who will associate with the token
    const treasuryKey = PrivateKey.generateED25519();
    const treasuryAccount = await createAccount(treasuryKey.publicKey)

    // create a client for Treasury who will associate with the token
    const royaltyCollectorKey = PrivateKey.generateED25519();
    const royaltyCollectorAccount = await createAccount(royaltyCollectorKey.publicKey)

    // create a client for Treasury who will associate with the token
    const userKey = PrivateKey.generateED25519();
    const userAccount = await createAccount(userKey.publicKey)


    console.log("SellerAccount", sellerAccount.toString());
    console.log("Buyer Account", BuyerAccount.toString());
    console.log("Admin Account", adminAccount.toString());
    console.log("Treasury Account", treasuryAccount.toString());
    console.log("Royalty collector Account", royaltyCollectorAccount.toString())
    console.log("userAccount", userAccount.toString());

    let nftCustomFee = await new CustomRoyaltyFee()
        .setNumerator(10)
        .setDenominator(100)
        .setFeeCollectorAccountId(royaltyCollectorAccount)
        .setAllCollectorsAreExempt(true)
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(2)));

    let nftCustomFee1 = await new CustomRoyaltyFee()
        .setNumerator(10)
        .setDenominator(100)
        .setFeeCollectorAccountId(adminAccount)
        .setAllCollectorsAreExempt(false)

    // create clients for Alice and Bob
    const sellerClient = Client.forTestnet();
    sellerClient.setOperator(sellerAccount, sellerKey);
    const buyerClient = Client.forTestnet();
    buyerClient.setOperator(BuyerAccount, BuyerKey);

    const supplyKey = PrivateKey.generate();
    // create the token 
    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("Test Royalty")
        .setTokenSymbol("TR")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryAccount)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(250)
        .setAdminKey(PrivateKey.fromString(process.env.OPERATOR_KEY).publicKey)
        .setCustomFees([nftCustomFee, nftCustomFee1])
        .setMaxTransactionFee(new Hbar(50))
        .setSupplyKey(supplyKey)
        .freezeWith(envClient);

    //Sign the transaction with the treasury key
    let nftCreateTxSign = await nftCreate.sign(treasuryKey);

    //Submit the transaction to a Hedera network
    let nftCreateSubmit = await nftCreateTxSign.execute(envClient);

    //Get the transaction receipt
    let nftCreateRx = await nftCreateSubmit.getReceipt(envClient);

    //Get the token ID
    tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log(`- Created NFT with Token ID: ${tokenId} \n`);


//Token association for all the parties involved
    await tokenAssociate(BuyerAccount, BuyerKey);
    await tokenAssociate(adminAccount, adminKey);
    await tokenAssociate(sellerAccount, sellerKey);
    await tokenAssociate(userAccount, userKey);


    let CID = ["QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa"];
    let mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(CID)])
        .freezeWith(envClient);
    let mintTxSign = await mintTx.sign(supplyKey);
    //Submit the transaction to a Hedera network
    let mintTxSubmit = await mintTxSign.execute(envClient);
    //Get the transaction receipt
    let mintRx = await mintTxSubmit.getReceipt(envClient);
    console.log(`- Minted NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);


    //Intitial transfer of token from Treasuty to seller Account
    let tokenTransferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, treasuryAccount, sellerAccount)
        .freezeWith(envClient)
        .sign(treasuryKey);

    let tokenTransferSubmit = await tokenTransferTx.execute(envClient);
    let tokenTransferReceipt = await tokenTransferSubmit.getReceipt(envClient);

    console.log(`\n- NFT transfer from Treasury to Seller Account: ${tokenTransferReceipt.status} \n`);

    //Transfer of token from Seller Account to Admin Account
    //In this functionality no fungible values are exchanged 
    //Havent set any fallback fee for the custom fee involving the admin 
    tokenTransferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, sellerAccount, adminAccount)
        .freezeWith(envClient)
        .sign(sellerKey);

    await tokenTransferTx.sign(adminKey);

    tokenTransferSubmit = await tokenTransferTx.execute(envClient);
    tokenTransferReceipt = await tokenTransferSubmit.getReceipt(envClient);

    console.log(`\n- NFT transfer from seller to Admin: ${tokenTransferReceipt.status} \n`);
    console.log("Transaction ID", tokenTransferSubmit.transactionId.toString());


    //Token transfer from admin account to Buyer account
    //Buyer pays 30 Hbars
    //Admin takes 3 Hbars as platform fee
    //27 hbars are transferred to seller account
    //No Royalties are charged 
    let secondarytokenTransferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, adminAccount, BuyerAccount)
        .addHbarTransfer(adminAccount, 3)
        .addHbarTransfer(sellerAccount, 27)
        .addHbarTransfer(BuyerAccount, -30)
        .freezeWith(envClient)
        .sign(adminKey);

    //Another scenario where additional fallback fee is charged (30+2 hbars)
    // let secondarytokenTransferTx = await new TransferTransaction()
    //     .addNftTransfer(tokenId, 1, adminAccount, BuyerAccount)
    //     .addHbarTransfer(sellerAccount, 30)
    //     .addHbarTransfer(BuyerAccount, -30)
    //     .freezeWith(envClient)
    //     .sign(adminKey);

    await secondarytokenTransferTx.sign(BuyerKey);

    tokenTransferSubmit = await secondarytokenTransferTx.execute(envClient);
    tokenTransferReceipt = await tokenTransferSubmit.getReceipt(envClient);

    console.log(`\n- NFT transfer from Admin to Buyer: ${tokenTransferReceipt.status} \n`);
    console.log("Transaction ID", tokenTransferSubmit.transactionId.toString());

//token transfer from Buyer account to a new user
//Royalties are charged and sent to both admin and the Royalty fee collector account 
    let secondarytokenTransferTxtoUser = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, BuyerAccount, userAccount)
        .addHbarTransfer(BuyerAccount, 30)
        .addHbarTransfer(userAccount, -30)
        .freezeWith(envClient)
        .sign(BuyerKey);

    await secondarytokenTransferTxtoUser.sign(userKey);

    tokenTransferSubmit = await secondarytokenTransferTxtoUser.execute(envClient);
    tokenTransferReceipt = await tokenTransferSubmit.getReceipt(envClient);

    console.log(`\n- NFT transfer from Buyer to user: ${tokenTransferReceipt.status} \n`);
    console.log("Transaction ID", tokenTransferSubmit.transactionId.toString());
}

main();

async function createAccount(public_Key) {
    let response = await new AccountCreateTransaction()
        .setInitialBalance(new Hbar(100)) // 10 h
        .setKey(public_Key)
        .execute(envClient);

    let receipt = await response.getReceipt(envClient);

    return receipt.accountId;

}

async function tokenAssociate(AccountId, key) {
    let associate = await new TokenAssociateTransaction()
        .setAccountId(AccountId)
        .setTokenIds([tokenId])
        .freezeWith(envClient)
        .sign(key);

    //Submit the transaction to a Hedera network
    let associateTxSubmit = await associate.execute(envClient);

    //Get the transaction receipt
    let associateReceipt = await associateTxSubmit.getReceipt(envClient);

    //Confirm the transaction was successful
    console.log(`- NFT association with ${AccountId}'s account: ${associateReceipt.status}\n`);
}