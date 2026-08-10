// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {IKritherPaymaster} from "../interfaces/IKritherPaymaster.sol";
import {KritherSubscriptions} from "../abstracts/KritherSubscriptions.sol";

contract KritherPaymaster is KritherSubscriptions {
    constructor(address registry_) KritherSubscriptions(registry_) {}
}
