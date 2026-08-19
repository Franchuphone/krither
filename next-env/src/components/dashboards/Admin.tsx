"use client";

import {
	ArrowLeftRight,
	BadgePlus,
	Coins,
	HandCoins,
	Link2,
	PiggyBank,
	SlidersHorizontal,
	UserMinus,
	UserPlus,
	UserSearch,
} from "lucide-react";
import FundingSummary from "@/components/dashboards/FundingSummary";
import WriteCallCard from "@/components/reusable/WriteCallCard";
import { paymasterABI } from "@/lib/paymaster";
import { registryABI } from "@/lib/registry";
import { ROLE_OPTIONS } from "@/lib/roles";
import Section from "../reusable/Section";
import ReadCallCard from "../reusable/ReadCallCard";

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;
const paymasterAddress = process.env
	.NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS as `0x${string}`;

const roleField = {
	name: "role",
	label: "Role",
	type: "bytes32",
	placeholder: "Pick a role",
	options: ROLE_OPTIONS,
} as const;

const Admin = () => {
	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<FundingSummary />

			<Section title="Accreditation">
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="grantRole"
					title="Grant a role"
					description="Accredits an account. Granting Producer also assigns it a producer id."
					icon={UserPlus}
					fields={[
						roleField,
						{
							name: "account",
							label: "Account",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Grant"
					successMessage="Role granted"
				/>
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="revokeRole"
					title="Revoke a role"
					description="Withdraws an accreditation. The paymaster stops sponsoring the account."
					icon={UserMinus}
					fields={[
						roleField,
						{
							name: "account",
							label: "Account",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Revoke"
					successMessage="Role revoked"
				/>
				<ReadCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="hasRole"
					title="Contrôler un utilisateur"
					description={"Contrôle le statut d'un utilisateur"}
					icon={UserSearch}
					fields={[
						roleField,
						{
							name: "account",
							label: "Account",
							type: "address",
							placeholder: "0x…",
						},
					]}
				/>
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="reassignProducer"
					title="Reassign a producer"
					description="Moves a producer id to a new wallet. Past lots keep pointing at the same producer."
					icon={ArrowLeftRight}
					fields={[
						{
							name: "oldAddress",
							label: "Current wallet",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "newAddress",
							label: "New wallet",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Reassign"
					successMessage="Producer reassigned"
				/>
			</Section>

			<Section title="Lots">
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="addLocator"
					title="Add a locator"
					description="Anchors an alternative storage pointer for a lot alongside its CID."
					icon={Link2}
					fields={[
						{
							name: "idLot",
							label: "Lot id",
							type: "uint",
							placeholder: "1",
						},
						{
							name: "service",
							label: "Service",
							type: "string",
							placeholder: "arweave",
						},
						{
							name: "pointer",
							label: "Pointer",
							type: "string",
							placeholder: "Transaction id, URL…",
						},
					]}
					submitLabel="Anchor"
					successMessage="Locator anchored"
				/>
			</Section>

			<Section title="Subscription plans">
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="addPlan"
					title="Add a plan"
					description="Creates a sponsorship plan for one role. Quota is operations per period."
					icon={BadgePlus}
					fields={[
						roleField,
						{
							name: "price",
							label: "Price (ETH)",
							type: "ether",
							placeholder: "0.01",
						},
						{
							name: "quota",
							label: "Quota (ops)",
							type: "uint",
							placeholder: "100",
						},
						{
							name: "period",
							label: "Period (seconds)",
							type: "uint",
							placeholder: "2592000",
						},
					]}
					submitLabel="Create plan"
					successMessage="Plan created"
				/>
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="setPlan"
					title="Update a plan"
					description="Reprices an existing plan or takes it off sale. Its role cannot change."
					icon={SlidersHorizontal}
					fields={[
						{
							name: "planId",
							label: "Plan id",
							type: "uint",
							placeholder: "0",
						},
						{
							name: "price",
							label: "Price (ETH)",
							type: "ether",
							placeholder: "0.01",
						},
						{
							name: "quota",
							label: "Quota (ops)",
							type: "uint",
							placeholder: "100",
						},
						{
							name: "period",
							label: "Period (seconds)",
							type: "uint",
							placeholder: "2592000",
						},
						{ name: "enabled", label: "On sale", type: "bool" },
					]}
					submitLabel="Update plan"
					successMessage="Plan updated"
				/>
			</Section>

			<Section title="Treasury">
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawRevenue"
					title="Withdraw revenue"
					description="Sends what subscriptions paid the paymaster out of the contract."
					icon={Coins}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "amount",
							label: "Amount (ETH)",
							type: "ether",
							placeholder: "0.1",
						},
					]}
					submitLabel="Withdraw"
					successMessage="Revenue withdrawn"
					danger
				/>
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawFromEntryPoint"
					title="Withdraw deposit"
					description="Pulls gas deposit back from the EntryPoint. Sponsorship stops once it is empty."
					icon={HandCoins}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "amount",
							label: "Amount (ETH)",
							type: "ether",
							placeholder: "0.1",
						},
					]}
					submitLabel="Withdraw"
					successMessage="Deposit withdrawn"
					danger
				/>
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawStake"
					title="Withdraw stake"
					description="Sends the whole stake out. It must have been unlocked and the delay elapsed."
					icon={PiggyBank}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Withdraw"
					successMessage="Stake withdrawn"
					danger
				/>
			</Section>
		</div>
	);
};

export default Admin;
