import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MultiSigWallet', function () {
  let multiSigWallet: any;
  let csrNFTTokenId: number;
  let turnstile: any;
  let owner1: any, owner2: any, owner3: any, executor: any, approver1: any, approver2: any, approver3: any;
  let erc20: any;

  before(async function () {
    // Deploy Turnstile contract
    const Turnstile = await ethers.getContractFactory('Turnstile');
    turnstile = await Turnstile.deploy();

    // Deploy MultiSigWallet contract
    const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    multiSigWallet = await MultiSigWallet.deploy('MultiSigWallet', turnstile.address);

    // Deploy ERC20 token contract
    const ERC20 = await ethers.getContractFactory('ERC20Mock');
    erc20 = await ERC20.deploy('Test Token', 'TST', 1000000);

    // Get test accounts
    [owner1, owner2, owner3, executor, approver1, approver2, approver3] = await ethers.getSigners();

    // Register MultiSigWallet contract with Turnstile
    csrNFTTokenId = await turnstile.register(multiSigWallet.address);

    // Initialize MultiSigWallet contract with owners and signatures required
    await multiSigWallet.init([owner1.address, owner2.address, owner3.address], 2);

    // Allocate ERC20 tokens to MultiSigWallet contract
    await erc20.transfer(multiSigWallet.address, 1000);
  });

  it('should distribute fees to the approvers and executor', async function () {
    // Execute a transaction that requires approval from 2 owners
    const value = 0;
    const data = '0x';
    const to = executor.address;
    const nonce = await multiSigWallet.nonce();
    const signatures = [
      await owner1.signMessage(ethers.utils.arrayify(multiSigWallet.getTransactionHash(nonce, to, value, data))),
      await owner2.signMessage(ethers.utils.arrayify(multiSigWallet.getTransactionHash(nonce, to, value, data))),
      await approver1.signMessage(ethers.utils.arrayify(multiSigWallet.getTransactionHash(nonce, to, value, data))),
      await approver2.signMessage(ethers.utils.arrayify(multiSigWallet.getTransactionHash(nonce, to, value, data))),
    ];
    const result = await multiSigWallet.executeTransaction(to, value, data, signatures);

    // Check that the approvers and executor received the appropriate fees
    const totalFee = await turnstile.balances(csrNFTTokenId);
    const feePercentage = await multiSigWallet.feePercentage();
    const feeFirstApprover = Math.floor((totalFee * feePercentage) / 100);
    const feeExecutor = Math.floor((totalFee * feePercentage) / 100);
    const remainingFee = totalFee - feeFirstApprover - feeExecutor;
    const feePerApprover = Math.floor(remainingFee / (signatures.length - 2));

    expect(await erc20.balanceOf(approver1.address)).to.equal(feeFirstApprover + feePerApprover);
    expect(await erc20.balanceOf(approver2.address)).to.equal(feePerApprover);
    expect(await erc20.balanceOf(approver3.address)).to.equal(0);
    expect(await erc20.balanceOf(executor.address)).to
