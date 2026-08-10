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
    error NotEntryPoint();
    error NotAccredited();
    error PlanUnknown();
    error PlanDisabled();
    error PlanLimitReached();
    error PriceMismatch();
    error QuotaExhausted();
    error SubscriptionExpired();
    error TargetNotAllowed();
    error CallShapeUnsupported();
    error CostTooHigh();
    error WithdrawFailed();
}
