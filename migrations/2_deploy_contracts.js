 const SMS = artifacts.require('SMS');
  require('dotenv').config()
  
  module.exports = async function (deployer) {
    await deployer.deploy(SMS);
    const sms = await SMS.deployed();
    console.log("sms contract deployed at : "+ sms.address);
    
  }; 