const {
    Client,
    PrivateKey,
    PublicKey,
    Hbar,
    AccountId,
    AccountCreateTransaction,
    TokenAssociateTransaction,
    TokenId
} = require("@hashgraph/sdk");

async function main() {

    let myAccountId = "0.0.48894073"
    let myPrivateKey = "302e020100300506032b657004220420e84530fd78c60f4c505eff6d2b6dd8ba2759ff768faff02588bfc457a6e829dc"
    
    let myAccountId1 = "0.0.48636172"
    let myPrivateKey1 = "3030020100300706052b8104000a042204208aa31e960a7d262d01bb8a9bf1bf92252f975c0d2249a0322d4a5c89b174eb3b"
    

    let AccountID = "0.0.48634738"
    let AccountPubKey = "302d300706052b8104000a032200029c5c0fbea3345c127e9b72ee2585975236de340d104a26e9c5cf35109bb2aa81"
    let AccountPrivKey = "3030020100300706052b8104000a04220420cf1666353043395d42e1d71f7d2e9df0fcf1976154297526073983ee8ad3fdb0"

    try {
    let client = Client.forTestnet();
    let client1 = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);
    client1.setOperator(myAccountId1, myPrivateKey1);

     let tx = new TokenAssociateTransaction()
        .setAccountId(AccountID)
        .setTokenIds([TokenId.fromString("0.0.48992434")])
       // .setNodeAccountIds([new AccountId(3)]);

    const transaction = await tx.freezeWith(client);

    // encode 1
    const transactionDTO1 = transaction.toBytes();
    const transactionDTO1Armoured =  Buffer.from(transactionDTO1).toString('base64');

    console.log(`Encoded1: ${transactionDTO1Armoured}`);

    // Decode 1
    const transactionRebuiltRaw1 = Buffer.from(transactionDTO1Armoured, 'base64');
    const transactionRebuilt1 = TokenAssociateTransaction.fromBytes(transactionRebuiltRaw1);

    const signedTransaction3 = await transactionRebuilt1.sign(PrivateKey.fromString(AccountPrivKey))

    // const signedTransaction3 = transactionRebuilt1
    // .addSignature(PublicKey.fromString(AccountPubKey), PrivateKey.fromString(AccountPrivKey).signTransaction(transaction));

    const txResponse = await signedTransaction3.execute(client1);

    const receipt = await txResponse.getReceipt(client1);

    console.log(`TX ${txResponse.transactionId.toString()} status: ${receipt.status}`);

    process.exit();
    } catch (err){
        console.log("error : " + err);
    }
    }
main();