#!/bin/zsh
truffle-flattener contracts/MegaCoin.sol > MegaCoin.flatten.sol
truffle-flattener contracts/MegaCoinMultiSigWallet.sol > MegaCoinMultiSigWallet.flatten.sol
