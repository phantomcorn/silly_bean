// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract DiscreteBean is ERC20, ERC20Burnable, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(address => bool) public hasClaim;

    uint8 public constant FREE_REDEMPTION_LIMIT = 3;

    constructor() ERC20("Bean", "BEAN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function decimals() public pure override returns(uint8) {
        return 0; //Beans should not have any decimals. Base unit always one.
    }

    function mint(address to, uint amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function setMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    function claimFreeBean() external {
        require(!hasClaim[msg.sender], "You have already redeemed your free bean.");
        hasClaim[msg.sender] = true;
        _mint(msg.sender, FREE_REDEMPTION_LIMIT);
    }
}