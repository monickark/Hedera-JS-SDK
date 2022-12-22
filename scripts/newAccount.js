const {
    Client,
    PrivateKey,
    Hbar,
    AccountId,
    AccountCreateTransaction,
    AccountBalanceQuery
} = require('@hashgraph/sdk');
require("dotenv").config();

async function main(){
    try {
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;
    console.log("myAccountId: "+ myAccountId);
    console.log("myPrivateKey: "+ myPrivateKey);
    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }    
    // create your local machine
    console.log('..........create your local machine..............')
    const client = Client.forTestnet();
    
    // set the txion fee paying account
    console.log('...........set the txion fee paying account..........')
    client.setOperator(myAccountId, myPrivateKey);
   // console.log('client: ' + JSON.stringify(client))

    // submit a tx to your local node
    console.log('...........submit a tx to your local node..........')
    const newAccountPrivateKey = await PrivateKey.generateECDSA();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;
    console.log("newAccountPrivateKey = " + newAccountPrivateKey);
    console.log("newAccountPublicKey = " + newAccountPublicKey);
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(12000000000))
        .execute(client);

    // get receipt
    console.log('...........get receipt..........')
    const receipt = await newAccount.getReceipt(client);

    // get the account id
    console.log('...........get the account id..........')
    const newAccountId = receipt.accountId;    
    console.log(newAccountId);
    console.log("The solidity address from the account ID", newAccountId.toSolidityAddress());
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);
    console.log("accountBalance: "+accountBalance);
    } catch(err) {
        console.log('error: '+ err);
    }
}
void main();