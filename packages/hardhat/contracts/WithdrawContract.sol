// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface Turnstile {
    function register(address) external returns(uint256);
    function withdraw(uint256, address payable, uint256) external returns (uint256);
    function balances(uint256 _tokenId) external view returns (uint256);
}

contract MyContract is Ownable {
    Turnstile turnstile = Turnstile(0xEcf044C5B4b867CFda001101c617eCd347095B44);
    uint256 private csrNFTTokenId;
        mapping (address => uint256) balancio;

    constructor() {
        // Register the smart contract with Turnstile
        // Mint the CSR NFT to the contract itself
        csrNFTTokenId = turnstile.register(address(this));
    }

    receive() external payable {

    }

        function paycontract () external payable {
        balancio[msg.sender] += msg.value;
    }

    function withdrawFees(uint256 amount) external onlyOwner {
        // Withdraw fees accrued on the Turnstile contract
        turnstile.withdraw(csrNFTTokenId, payable(tx.origin), amount);
    }

    function getCSRNFTTokenId() external view returns (uint256, uint256) {

        return (csrNFTTokenId, turnstile.balances(csrNFTTokenId));
    }
}
