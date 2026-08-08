// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IErrors {
    error InputNumberNull();
    error InputStringEmpty();
    error InputAddressZero();
    error InputSimilar();
    error NotHolder();
    error NotProducer();
    error LotNotFound();
    error ItemNotFound();
    error AlreadyProducer();
}
