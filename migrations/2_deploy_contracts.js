var MegaCoin = artifacts.require("./contracts/MegaCoin.sol");
var MegaCoinMultiSigWallet = artifacts.require("./contracts/MegaCoinMultiSigWallet.sol");
var MegaCoinMultiSigWalletWithMint = artifacts.require("./contracts/MegaCoinMultiSigWalletWithMint.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(MegaCoin, 'MEGA', 'MEGACoin', accounts[0], accounts[1], accounts[2]).then( () => {
    console.log(`MegaCoin deployed: address = ${MegaCoin.address}`);

    deployer.
      deploy(MegaCoinMultiSigWallet, [accounts[0], accounts[1], accounts[2]], 2, MegaCoin.address,
          "vault multisig wallet");

      deployer.
      deploy(MegaCoinMultiSigWalletWithMint, [accounts[0], accounts[1], accounts[2]], 2, MegaCoin.address,
          "vault multisig wallet with mint");

  });
};
