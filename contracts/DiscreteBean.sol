// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DiscreteBean is ERC20, ERC20Burnable, Ownable {

    constructor() ERC20("Bean", "BEAN") Ownable(msg.sender) {
        _mint(msg.sender, 3);
    }

    function decimals() public pure override returns(uint8) {
        return 0; //Beans should not have any decimals. Base unit always one.
    }
}