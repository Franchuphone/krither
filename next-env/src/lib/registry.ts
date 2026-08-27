export const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;

export const registryABI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "admin",
				type: "address",
			},
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		inputs: [],
		name: "AccessControlBadConfirmation",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "neededRole",
				type: "bytes32",
			},
		],
		name: "AccessControlUnauthorizedAccount",
		type: "error",
	},
	{
		inputs: [],
		name: "AlreadyProducer",
		type: "error",
	},
	{
		inputs: [],
		name: "CallShapeUnsupported",
		type: "error",
	},
	{
		inputs: [],
		name: "CostTooHigh",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "sender",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "balance",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "needed",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
		],
		name: "ERC1155InsufficientBalance",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "approver",
				type: "address",
			},
		],
		name: "ERC1155InvalidApprover",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idsLength",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "valuesLength",
				type: "uint256",
			},
		],
		name: "ERC1155InvalidArrayLength",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "operator",
				type: "address",
			},
		],
		name: "ERC1155InvalidOperator",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "receiver",
				type: "address",
			},
		],
		name: "ERC1155InvalidReceiver",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "sender",
				type: "address",
			},
		],
		name: "ERC1155InvalidSender",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{
				internalType: "address",
				name: "owner",
				type: "address",
			},
		],
		name: "ERC1155MissingApprovalForAll",
		type: "error",
	},
	{
		inputs: [],
		name: "EnforcedPause",
		type: "error",
	},
	{
		inputs: [],
		name: "ExpectedPause",
		type: "error",
	},
	{
		inputs: [],
		name: "InputAddressZero",
		type: "error",
	},
	{
		inputs: [],
		name: "InputNumberNull",
		type: "error",
	},
	{
		inputs: [],
		name: "InputSimilar",
		type: "error",
	},
	{
		inputs: [],
		name: "InputStringEmpty",
		type: "error",
	},
	{
		inputs: [],
		name: "ItemNotFound",
		type: "error",
	},
	{
		inputs: [],
		name: "LotAlreadyExists",
		type: "error",
	},
	{
		inputs: [],
		name: "LotNotFound",
		type: "error",
	},
	{
		inputs: [],
		name: "NotAccredited",
		type: "error",
	},
	{
		inputs: [],
		name: "NotEntryPoint",
		type: "error",
	},
	{
		inputs: [],
		name: "NotHolder",
		type: "error",
	},
	{
		inputs: [],
		name: "NotProducer",
		type: "error",
	},
	{
		inputs: [],
		name: "PlanDisabled",
		type: "error",
	},
	{
		inputs: [],
		name: "PlanLimitReached",
		type: "error",
	},
	{
		inputs: [],
		name: "PlanUnknown",
		type: "error",
	},
	{
		inputs: [],
		name: "PriceMismatch",
		type: "error",
	},
	{
		inputs: [],
		name: "QuotaExhausted",
		type: "error",
	},
	{
		inputs: [],
		name: "SubscriptionExpired",
		type: "error",
	},
	{
		inputs: [],
		name: "TargetNotAllowed",
		type: "error",
	},
	{
		inputs: [],
		name: "WithdrawFailed",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{
				indexed: false,
				internalType: "bool",
				name: "approved",
				type: "bool",
			},
		],
		name: "ApprovalForAll",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "quantity",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address",
			},
			{
				indexed: false,
				internalType: "string",
				name: "cid",
				type: "string",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "changedAt",
				type: "uint256",
			},
		],
		name: "LifecycleChanged",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "bytes32",
				name: "serviceKey",
				type: "bytes32",
			},
			{
				indexed: false,
				internalType: "string",
				name: "service",
				type: "string",
			},
			{
				indexed: false,
				internalType: "string",
				name: "pointer",
				type: "string",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "addedAt",
				type: "uint256",
			},
		],
		name: "LocatorAdded",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "idProducer",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "address",
				name: "addrProducer",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "ref",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "string",
				name: "cid",
				type: "string",
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "quantities",
				type: "uint256[]",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "createdAt",
				type: "uint256",
			},
		],
		name: "LotCreated",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Paused",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "oldAddress",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newAddress",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "changedAt",
				type: "uint256",
			},
		],
		name: "ProducerReassigned",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				indexed: true,
				internalType: "bytes32",
				name: "previousAdminRole",
				type: "bytes32",
			},
			{
				indexed: true,
				internalType: "bytes32",
				name: "newAdminRole",
				type: "bytes32",
			},
		],
		name: "RoleAdminChanged",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				indexed: true,
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address",
			},
		],
		name: "RoleGranted",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				indexed: true,
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address",
			},
		],
		name: "RoleRevoked",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]",
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "values",
				type: "uint256[]",
			},
		],
		name: "TransferBatch",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "value",
				type: "uint256",
			},
		],
		name: "TransferSingle",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "string",
				name: "value",
				type: "string",
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "URI",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Unpaused",
		type: "event",
	},
	{
		inputs: [],
		name: "CONSUMER_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "DEFAULT_ADMIN_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "PAUSER_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "PRODUCER_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "RESELLER_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "USERS_ADMIN_ROLE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
			{
				internalType: "string",
				name: "cid",
				type: "string",
			},
		],
		name: "addLifecycleChange",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
			{
				internalType: "string",
				name: "service",
				type: "string",
			},
			{
				internalType: "string",
				name: "pointer",
				type: "string",
			},
		],
		name: "addLocator",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "balanceOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address[]",
				name: "accounts",
				type: "address[]",
			},
			{
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]",
			},
		],
		name: "balanceOfBatch",
		outputs: [
			{
				internalType: "uint256[]",
				name: "",
				type: "uint256[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "exists",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
		],
		name: "getRoleAdmin",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "index",
				type: "uint256",
			},
		],
		name: "getRoleMember",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
		],
		name: "getRoleMemberCount",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
		],
		name: "getRoleMembers",
		outputs: [
			{
				internalType: "address[]",
				name: "",
				type: "address[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "grantRole",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "hasRole",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
		],
		name: "indexOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "pure",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				internalType: "address",
				name: "operator",
				type: "address",
			},
		],
		name: "isApprovedForAll",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "index",
				type: "uint256",
			},
		],
		name: "itemId",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "pure",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
		],
		name: "itemsOf",
		outputs: [
			{
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
		],
		name: "lifecycleChanges",
		outputs: [
			{
				internalType: "uint256",
				name: "count",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idProducer",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "ref",
				type: "uint256",
			},
		],
		name: "lotIds",
		outputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
		],
		name: "lotOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "pure",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
		],
		name: "lots",
		outputs: [
			{
				internalType: "address",
				name: "producer",
				type: "address",
			},
			{
				internalType: "uint96",
				name: "itemCount",
				type: "uint96",
			},
			{
				internalType: "string",
				name: "cid",
				type: "string",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256[]",
				name: "quantities",
				type: "uint256[]",
			},
			{
				internalType: "string",
				name: "cid",
				type: "string",
			},
			{
				internalType: "uint256",
				name: "ref",
				type: "uint256",
			},
		],
		name: "mintLot",
		outputs: [
			{
				internalType: "uint256",
				name: "idLot",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "pause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "paused",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "producerByAddr",
		outputs: [
			{
				internalType: "uint256",
				name: "idProducer",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idProducer",
				type: "uint256",
			},
		],
		name: "producerById",
		outputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "oldAddress",
				type: "address",
			},
			{
				internalType: "address",
				name: "newAddress",
				type: "address",
			},
		],
		name: "reassignProducer",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				internalType: "address",
				name: "callerConfirmation",
				type: "address",
			},
		],
		name: "renounceRole",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "role",
				type: "bytes32",
			},
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "revokeRole",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]",
			},
			{
				internalType: "uint256[]",
				name: "values",
				type: "uint256[]",
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes",
			},
		],
		name: "safeBatchTransferFrom",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256",
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes",
			},
		],
		name: "safeTransferFrom",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "operator",
				type: "address",
			},
			{
				internalType: "bool",
				name: "approved",
				type: "bool",
			},
		],
		name: "setApprovalForAll",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes4",
				name: "interfaceId",
				type: "bytes4",
			},
		],
		name: "supportsInterface",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalSupply",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "totalSupply",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "unpause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "idItem",
				type: "uint256",
			},
		],
		name: "uri",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;

export const registryBytecode =
	"0x60806040523461032a57604051601f612f0338819003918201601f19168301916001600160401b038311848410176103165780849260209460405283398101031261032a57516001600160a01b0381169081810361032a5760405160208101906001600160401b03821181831017610316575f9160405252600254600181811c9116801561030c575b60208210146102f857601f81116102b0575b505f60028190557f8eb467f061ca67f42a2d2ca4a346fc9fb645efc0ba75056ee9f71c3a0ccc10a8808252600360209081527f530e47a70b806250f3b823d561fcebde7ef6c3957195f97a69850e6306fce40880545f516020612e835f395f51905f52918290559194939092905f516020612e635f395f51905f529080a45f516020612ee35f395f51905f525f52600382525f516020612e835f395f51905f52600160405f2001545f516020612ee35f395f51905f525f526003845281600160405f2001555f516020612ee35f395f51905f525f516020612e635f395f51905f525f80a45f516020612ea35f395f51905f525f52600382525f516020612e835f395f51905f52600160405f2001545f516020612ea35f395f51905f525f526003845281600160405f2001555f516020612ea35f395f51905f525f516020612e635f395f51905f525f80a482156102a1576101f39061032e565b80610287575b80610280575b8061026d575b610219575b604051612a3b90816104288239f35b600854905f198214610259576001600a920180600855835f52600982528060405f20555f525260405f209060018060a01b03198254161790555f8061020a565b634e487b7160e01b5f52601160045260245ffd5b50815f526009815260405f205415610205565b505f6101ff565b5f80526004825261029b8360405f206103b7565b506101f9565b6339b190bb60e11b5f5260045ffd5b60025f52601f0160051c7f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace908101905b8181106102ed575061009a565b5f81556001016102e0565b634e487b7160e01b5f52602260045260245ffd5b90607f1690610088565b634e487b7160e01b5f52604160045260245ffd5b5f80fd5b6001600160a01b0381165f9081525f516020612ec35f395f51905f52602052604090205460ff166103b2576001600160a01b03165f8181525f516020612ec35f395f51905f5260205260408120805460ff191660011790553391907f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d8180a4600190565b505f90565b6001810190825f528160205260405f2054155f1461042057805468010000000000000000811015610316576001810180835581101561040c578390825f5260205f20015554915f5260205260405f2055600190565b634e487b7160e01b5f52603260045260245ffd5b5050505f9056fe60806040526004361015610011575f80fd5b5f3560e01c8062fdd58e146102a357806301ffc9a71461029e578063083c82a8146102995780630ad1aae3146102945780630e89341c1461028f57806318160ddd1461028a578063248a9ca3146102855780632eb2c2d6146102805780632f2ff15d1461027b57806336568abe146102765780633d42ed51146102715780633f4ba83a1461026c5780634bc02da6146102675780634e1273f4146102625780634f558e791461025d57806352aa758f146102585780635c975abb14610253578063781d88f21461024e5780638456cb59146102495780638c303e52146102445780639010d07c1461023f57806391ac7e651461023a57806391d14854146102355780639873b7b114610230578063a217fddf1461022b578063a22cb46514610226578063a3246ad314610221578063a9fc0b7e1461021c578063ae65a35314610217578063b5cb22bb14610212578063bce077941461020d578063bd85b03914610208578063bd9671b814610203578063ca15c873146101fe578063cb3e1fe7146101f9578063cf7d01b8146101f4578063d547741f146101ef578063e63ab1e9146101ea578063e985e9c5146101e5578063f1648e84146101e05763f242432a146101db575f80fd5b61151a565b611437565b61137d565b611343565b611305565b6112cd565b6112a6565b61127c565b6110a6565b61107c565b610ffb565b610fd1565b610f9f565b610e98565b610e28565b610d0c565b610cf2565b610cb8565b610c69565b610c42565b610bfd565b610b0a565b610ab1565b610a1d565b6109ce565b610996565b61096a565b6108ab565b61082d565b6107c7565b61078d565b610741565b6106fe565b610672565b61050a565b6104ed565b610467565b61040a565b6103e9565b610346565b6102ec565b600435906001600160a01b03821682036102be57565b5f80fd5b602435906001600160a01b03821682036102be57565b35906001600160a01b03821682036102be57565b346102be5760403660031901126102be57602061032b61030a6102a8565b6024355f525f835260405f209060018060a01b03165f5260205260405f2090565b54604051908152f35b6001600160e01b03198116036102be57565b346102be5760203660031901126102be5760043561036381610334565b63ffffffff60e01b16635a05180f60e01b811490811561038c575b506040519015158152602090f35b637965db0b60e01b8114915081156103a6575b505f61037e565b636cdb3d1360e11b8114915081156103d8575b81156103c7575b505f61039f565b6301ffc9a760e01b1490505f6103c0565b6303a24d0760e21b811491506103b9565b346102be5760203660031901126102be5760206004356040519060801c8152f35b346102be5760403660031901126102be5760206004356024356040519160801b178152f35b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b90602061046492818152019061042f565b90565b346102be5760203660031901126102be576004358060801c5f52600c60205260405f20906001600160801b038254916104a960018060a01b03841615156115d9565b169060a01c8110156104de576104da9160016104c76104ce93611c17565b91016115ef565b60405191829182610453565b0390f35b63d3ed043d60e01b5f5260045ffd5b346102be575f3660031901126102be576020600754604051908152f35b346102be5760203660031901126102be5760206105356004355f526003602052600160405f20015490565b604051908152f35b634e487b7160e01b5f52604160045260245ffd5b90601f801991011681019081106001600160401b0382111761057257604052565b61053d565b60405190610586606083610551565b565b6001600160401b0381116105725760051b60200190565b9291906105ab81610588565b936105b96040519586610551565b602085838152019160051b81019283116102be57905b8282106105db57505050565b81358152602091820191016105cf565b9080601f830112156102be578160206104649335910161059f565b6001600160401b03811161057257601f01601f191660200190565b92919261062d82610606565b9161063b6040519384610551565b8294818452818301116102be578281602093845f960137010152565b9080601f830112156102be5781602061046493359101610621565b346102be5760a03660031901126102be5761068b6102a8565b6106936102c2565b906044356001600160401b0381116102be576106b39036906004016105eb565b6064356001600160401b0381116102be576106d29036906004016105eb565b90608435936001600160401b0385116102be576106f66106fc953690600401610657565b936116c3565b005b346102be5760403660031901126102be576106fc60043561071d6102c2565b9061073c610737825f526003602052600160405f20015490565b611eed565b612004565b346102be5760403660031901126102be5760043561075d6102c2565b610765612069565b336001600160a01b0382160361077e576106fc916121d7565b63334bd91960e11b5f5260045ffd5b346102be575f3660031901126102be5760206040517f8c4e4c886839ee31dab229250456aff85262ae8b6d18d22e78b99daedc77490a8152f35b346102be575f3660031901126102be576107df611dd3565b60055460ff81161561081e5760ff19166005557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa6020604051338152a1005b638dfc202b60e01b5f5260045ffd5b346102be575f3660031901126102be5760206040517f9d56108290ea0bc9c5c59c3ad357dca9d1b29ed7f3ae1443bef2fa2159bdf5e88152f35b90602080835192838152019201905f5b8181106108845750505090565b8251845260209384019390920191600101610877565b906020610464928181520190610867565b346102be5760403660031901126102be576004356001600160401b0381116102be57366023820112156102be578060040135906108e782610588565b916108f56040519384610551565b8083526024602084019160051b830101913683116102be57602401905b82821061095257836024356001600160401b0381116102be576104da916109406109469236906004016105eb565b90611764565b6040519182918261089a565b6020809161095f846102d8565b815201910190610912565b346102be5760203660031901126102be576004355f526006602052602060405f20541515604051908152f35b346102be5760203660031901126102be576001600160a01b036109b76102a8565b165f526009602052602060405f2054604051908152f35b346102be575f3660031901126102be57602060ff600554166040519015158152f35b9181601f840112156102be578235916001600160401b0383116102be57602083818601950101116102be57565b346102be5760603660031901126102be576004356001600160401b0381116102be57366023820112156102be578060040135906001600160401b0382116102be573660248360051b830101116102be57602435906001600160401b0382116102be576104da92610a94610aa19336906004016109f0565b91602460443594016117ee565b6040519081529081906020820190565b346102be575f3660031901126102be57610ac9611dd3565b610ad1612069565b600160ff1960055416176005557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586020604051338152a1005b346102be5760403660031901126102be576004356024356001600160401b0381116102be57610b3d9036906004016109f0565b9190610b47612069565b610b52831515611974565b5f8281526020818152604080832033845290915290205415610bee57610bb990825f52600e60205260405f20610b888154611bb5565b90555f8381526020818152604080832033845290915290205493604051948552606060208601526060850191611b49565b904260408401527fed3d0f8d0f4b09718c1a90741e8de9a4ab5491104b3c6c6b3a586fc2101e37623393808360801c940390a4005b633b11fda960e11b5f5260045ffd5b346102be5760403660031901126102be576020610c29600435602435905f526004835260405f20612321565b905460405160039290921b1c6001600160a01b03168152f35b346102be5760203660031901126102be5760206004356001600160801b0360405191168152f35b346102be5760403660031901126102be57602060ff610cac600435610c8c6102c2565b905f526003845260405f209060018060a01b03165f5260205260405f2090565b54166040519015158152f35b346102be575f3660031901126102be5760206040517fd867f7b5ac7a38d68c871410e11ed3f4ad7f40748eb52c5fc067138004f1ad378152f35b346102be575f3660031901126102be5760206040515f8152f35b346102be5760403660031901126102be57610d256102a8565b60243580151581036102be57610d39612069565b3315610dd3576001600160a01b038216918215610dc15781610d79610d8a92335f52600160205260405f209060018060a01b03165f5260205260405f2090565b9060ff801983541691151516179055565b604051901515815233907f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c319080602081015b0390a3005b62ced3e160e81b5f525f60045260245ffd5b631f18c42760e11b5f525f60045260245ffd5b60206040818301928281528451809452019201905f5b818110610e095750505090565b82516001600160a01b0316845260209384019390920191600101610dfc565b346102be5760203660031901126102be576004355f52600460205260405f206040519081602082549182815201915f5260205f20905f5b818110610e82576104da85610e7681870382610551565b60405191829182610de6565b8254845260209093019260019283019201610e5f565b346102be5760603660031901126102be576004356024356001600160401b0381116102be57610ecb9036906004016109f0565b9190604435906001600160401b0382116102be57610f9493610f127f91dad2ed57220b752174debd64ceb1194e857a2715ea4b56d082719c9186d5829336906004016109f0565b9590610f1c612069565b610f24611e42565b5f868152600c6020526040902054610f46906001600160a01b031615156115d9565b610f51831515611974565b610f5c871515611974565b610f67368486610621565b6020815191012096610f86604051958695606087526060870191611b49565b918483036020860152611b49565b4260408301520390a3005b346102be5760203660031901126102be576004355f52600a602052602060018060a01b0360405f205416604051908152f35b346102be5760203660031901126102be576004355f52600e602052602060405f2054604051908152f35b346102be5760203660031901126102be576004355f818152600c6020526040902054611031906001600160a01b031615156115d9565b805f52600c60205260405f205460a01c61104a81611705565b9160801b5f5b82811061106557604051806104da868261089a565b806001918317611075828761174b565b5201611050565b346102be5760203660031901126102be576004355f526006602052602060405f2054604051908152f35b346102be5760403660031901126102be576110bf6102a8565b6110c76102c2565b906110d0612069565b6110d8611e42565b6001600160a01b03821691821561126d576001600160a01b0382169183831461125e575f5160206129e65f395f51905f525f52600360205261122b9161122590611165611160611159857f530e47a70b806250f3b823d561fcebde7ef6c3957195f97a69850e6306fce4075b9060018060a01b03165f5260205260405f2090565b5460ff1690565b611bc3565b5f5160206129e65f395f51905f525f5260036020526111b66111b16111ad611159847f530e47a70b806250f3b823d561fcebde7ef6c3957195f97a69850e6306fce407611144565b1590565b611bd9565b611220816112016111d78660018060a01b03165f52600960205260405f2090565b546001600160a01b0383165f90815260096020526040902081905b555f52600a60205260405f2090565b80546001600160a01b0319166001600160a01b03909216919091179055565b611f27565b5061216a565b506040514281527ff07418439ada79976e2aad4b0fda92056cdf3e62853f55e220d2b018797b6c35908060208101610dbc565b6326c9a72360e11b5f5260045ffd5b6339b190bb60e11b5f5260045ffd5b346102be5760203660031901126102be576004355f526004602052602060405f2054604051908152f35b346102be575f3660031901126102be5760206040515f5160206129e65f395f51905f528152f35b346102be5760403660031901126102be57600435602435905f52600d60205260405f20905f52602052602060405f2054604051908152f35b346102be5760403660031901126102be576106fc6004356113246102c2565b9061133e610737825f526003602052600160405f20015490565b6121d7565b346102be575f3660031901126102be5760206040517f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a8152f35b346102be5760403660031901126102be57602060ff610cac61139d6102a8565b6113a56102c2565b6001600160a01b039182165f9081526001865260408082209290931681526020919091522090565b90600182811c921680156113fb575b60208310146113e757565b634e487b7160e01b5f52602260045260245ffd5b91607f16916113dc565b6bffffffffffffffffffffffff610464949360609360018060a01b03168352166020820152816040820152019061042f565b346102be5760203660031901126102be576004355f52600c60205260405f206001815491019060405191825f82549261146f846113cd565b80845293600181169081156114f857506001146114b4575b5061149492500383610551565b6040519182916104da919060a081901c906001600160a01b031684611405565b90505f9291925260205f20905f915b8183106114dc575050906020611494928201015f611487565b60209193508060019154838589010152019101909184926114c3565b90506020925061149494915060ff191682840152151560051b8201015f611487565b346102be5760a03660031901126102be576115336102a8565b61153b6102c2565b6064356044356084356001600160401b0381116102be57611560903690600401610657565b9261156b8533611d6d565b6001600160a01b038116156115c6576001600160a01b038516156115b4576106fc946040519260018452602084015260408301936001855260608401526080830160405261220d565b626a0d4560e21b5f525f60045260245ffd5b632bfa23e760e11b5f525f60045260245ffd5b156115e057565b632fa05a2d60e21b5f5260045ffd5b919060405180935f90805490611604826113cd565b916001811690811561169f575060011461165f575b505060059160208261058695602f60f81b600195528051928391018583015e0161164f8382015f815264173539b7b760d91b9052565b0301601a19810185520183610551565b9091505f5260205f205f905b82821061168357505081016020908101908290611619565b602091929350806001915483858a01015201910185929161166b565b60ff1916602086810191909152831515909302850183019350849291506116199050565b939291906116d18533611d6d565b6001600160a01b038116156115c6576001600160a01b038516156115b457846116ff8484846105869961280c565b3361258a565b9061170f82610588565b61171c6040519182610551565b828152809261172d601f1991610588565b0190602036910137565b634e487b7160e01b5f52603260045260245ffd5b805182101561175f5760209160051b010190565b611737565b919091805183518082036117d957505061177e8151611705565b905f5b81518110156117d257806117c060019260051b602080828701015191890101515f525f60205260405f209060018060a01b03165f5260205260405f2090565b546117cb828661174b565b5201611781565b5090925050565b635b05999160e01b5f5260045260245260445ffd5b7f07b0b9733f5f6ace9dbe041c6199fb510032b5c9c7e0dd3ad95aafb433a43f899093929361181b612069565b611823611e91565b61182e83151561195e565b611839841515611974565b335f908152600960205260409020549361187661186f88611862885f52600d60205260405f2090565b905f5260205260405f2090565b541561198a565b6119586001600160801b0361189b611896600b546001600160801b031690565b6119b4565b6118bb816001600160801b03166001600160801b0319600b541617600b55565b169788956119086118ca610577565b3381526bffffffffffffffffffffffff831660208201526118ec36878d610621565b6040820152611903895f52600c60205260405f2090565b611a42565b8661191f836118628b5f52600d60205260405f2090565b5561194861192e82878a612084565b61193936848961059f565b611941611b35565b91336120d6565b604051948594339a429487611b69565b0390a490565b1561196557565b6308a15feb60e01b5f5260045ffd5b1561197b57565b6339b4b30960e01b5f5260045ffd5b1561199157565b6368cd03cd60e01b5f5260045ffd5b634e487b7160e01b5f52601160045260245ffd5b6001600160801b03166001600160801b0381146119d15760010190565b6119a0565b916119ef9183549060031b91821b915f19901b19161790565b9055565b601f8211611a0057505050565b5f5260205f20906020601f840160051c83019310611a38575b601f0160051c01905b818110611a2d575050565b5f8155600101611a22565b9091508190611a19565b8151602083015160a01b6001600160a01b0319166001600160a01b039091161781556040909101518051909291600101906001600160401b03811161057257611a9581611a8f84546113cd565b846119f3565b6020601f8211600114611ad05781906119ef9394955f92611ac5575b50508160011b915f199060031b1c19161790565b015190505f80611ab1565b601f19821690611ae3845f5260205f2090565b915f5b818110611b1d57509583600195969710611b05575b505050811b019055565b01515f1960f88460031b161c191690555f8080611afb565b9192602060018192868b015181550194019201611ae6565b60405190611b44602083610551565b5f8252565b908060209392818452848401375f828201840152601f01601f1916010190565b96959492611b8592918852608060208901526080880191611b49565b8581036040870152818152916001600160fb1b0382116102be5760609260209260051b8092848301370101930152565b5f1981146119d15760010190565b15611bca57565b6371bedc0960e11b5f5260045ffd5b15611be057565b63e4ff959160e01b5f5260045ffd5b90611bf982610606565b611c066040519182610551565b828152809261172d601f1991610606565b805f9172184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b821015611d4a575b806d04ee2d6d415b85acef8100000000600a921015611d2e575b662386f26fc10000811015611d19575b6305f5e100811015611d07575b612710811015611cf7575b6064811015611ce8575b1015611cdd575b611cc86021611c9d60018501611bef565b938401015b5f1901916f181899199a1a9b1b9c1cb0b131b232b360811b600a82061a8353600a900490565b8015611cd857611cc89091611ca2565b505090565b600190910190611c8c565b60029060649004930192611c85565b6004906127109004930192611c7b565b6008906305f5e1009004930192611c70565b601090662386f26fc100009004930192611c63565b6020906d04ee2d6d415b85acef81000000009004930192611c53565b506040915072184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b8104611c39565b6001600160a01b0391821691811690828214159081611da5575b50611d90575050565b63711bec9160e11b5f5260045260245260445ffd5b5f8481526001602090815260408083206001600160a01b0390941683529290522060ff91505416155f611d87565b335f9081527f30adeb818ef77f204f5a603c30fa5332397b6e28fb3b7f9d937ae6a6914716de602052604090205460ff1615611e0b57565b63e2517d3f60e01b5f52336004527f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a60245260445ffd5b335f9081527f3617319a054d772f909f7c479a2cebe5066e836a939412e32403c99029b92eff602052604090205460ff1615611e7a57565b63e2517d3f60e01b5f52336004525f60245260445ffd5b335f9081527f530e47a70b806250f3b823d561fcebde7ef6c3957195f97a69850e6306fce407602052604090205460ff1615611ec957565b63e2517d3f60e01b5f52336004525f5160206129e65f395f51905f5260245260445ffd5b5f81815260036020908152604080832033845290915290205460ff1615611f115750565b63e2517d3f60e01b5f523360045260245260445ffd5b611f3e815f5160206129e65f395f51905f52612628565b9081611fb6575b8180611fae575b80611f8f575b611f5a575090565b61046490611201611f6c600854611bb5565b60088190556001600160a01b0383165f90815260096020526040902081906111f2565b506001600160a01b0381165f9081526009602052604090205415611f52565b506001611f4c565b5f5160206129e65f395f51905f525f526004602052611ffe6001600160a01b0382167f397a1da6ad3dcba6b36e9b4d959f8ee01109fd2a6194266c74f735279d96405e61279d565b50611f45565b9061200f8183612628565b809281612042575b8161202b575b5080611f8f57611f5a575090565b5f5160206129e65f395f51905f529150145f61201d565b5f818152600460205260409020612063906001600160a01b0385169061279d565b50612017565b60ff6005541661207557565b63d93c066560e01b5f5260045ffd5b92919061209082611705565b915f5b83518110156120cf578181101561175f57806120b860019260051b850135151561195e565b808760801b176120c8828761174b565b5201612093565b5050509150565b92939091906001600160a01b038416156115c6576120f68284865f61280c565b5f94855b84518710156121465761213e6001918860051b9061212c602080848a010151938a0101515f52600660205260405f2090565b612137838254612790565b9055612790565b9601956120fa565b61058695919492965061215e61216391600754612790565b600755565b5f3361258a565b612181815f5160206129e65f395f51905f52612336565b908161218b575090565b5f5160206129e65f395f51905f525f5260046020526121d3906001600160a01b03167f397a1da6ad3dcba6b36e9b4d959f8ee01109fd2a6194266c74f735279d96405e6126ed565b5090565b6121e18282612336565b91826121ec57505090565b5f918252600460205260409091206121d3916001600160a01b0316906126ed565b9193929061221d8286838661280c565b6001600160a01b038316156122c6575b6001600160a01b0381161580612268575b1561224b575b5050505050565b60208061225e9601519201519233612441565b5f80808080612244565b94935f939091845b86518610156122ae576001908660051b9061229f602080848a010151938b0101515f52600660205260405f2090565b82815403905501950194612270565b6122c19193969792955060075403600755565b61223e565b93925f92835b8551851015612306576122fe6001918660051b9061212c602080848a010151938b0101515f52600660205260405f2090565b9401936122cc565b61231c91945061215e9096929596600754612790565b61222d565b805482101561175f575f5260205f2001905f90565b5f8181526003602090815260408083206001600160a01b038616845290915290205460ff16156123be575f8181526003602090815260408083206001600160a01b03861684529091529020805460ff1916905533916001600160a01b0316907ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b5f80a4600190565b50505f90565b908160209103126102be575161046481610334565b6001600160a01b039182168152911660208201526040810191909152606081019190915260a0608082018190526104649291019061042f565b3d1561243c573d9061242382610606565b916124316040519384610551565b82523d5f602084013e565b606090565b9091949293853b612455575b505050505050565b60209361247791604051968795869563f23a6e6160e01b8752600487016123d9565b03815f6001600160a01b0387165af15f9181612506575b506124c8575061249c612412565b80519190826124c157632bfa23e760e11b5f526001600160a01b03821660045260245ffd5b6020915001fd5b6001600160e01b031916630dc5919f60e01b016124eb57505f808080808061244d565b632bfa23e760e11b5f526001600160a01b031660045260245ffd5b61252991925060203d602011612530575b6125218183610551565b8101906123c4565b905f61248e565b503d612517565b6001600160a01b0391821681529116602082015260a060408201819052610464949193919261257c929161256e9190860190610867565b908482036060860152610867565b91608081840391015261042f565b9091949293853b61259d57505050505050565b6020936125bf91604051968795869563bc197c8160e01b875260048701612537565b03815f6001600160a01b0387165af15f9181612607575b506125e4575061249c612412565b6001600160e01b0319166343e6837f60e01b016124eb57505f808080808061244d565b61262191925060203d602011612530576125218183610551565b905f6125d6565b5f8181526003602090815260408083206001600160a01b038616845290915290205460ff166123be575f8181526003602090815260408083206001600160a01b03861684529091529020805460ff1916600117905533916001600160a01b0316907f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d5f80a4600190565b805480156126d9575f1901906126c88282612321565b8154905f199060031b1b1916905555565b634e487b7160e01b5f52603160045260245ffd5b6001810191805f528260205260405f2054928315155f14612788575f1984018481116119d15783545f198101949085116119d1575f95858361273b976118629503612741575b5050506126b2565b55600190565b61277161276b9161276261275861277f9588612321565b90549060031b1c90565b92839187612321565b906119d6565b85905f5260205260405f2090565b555f8080612733565b505050505f90565b919082018092116119d157565b6001810190825f528160205260405f2054155f1461280557805468010000000000000000811015610572576127f26127dc826001879401855584612321565b819391549060031b91821b915f19901b19161790565b905554915f5260205260405f2055600190565b5050505f90565b939192612817612069565b83518151908181036129ab5750506001600160a01b03858116948515159491841680151592905f5b8351811015612920578060051b90888887602080868a010151958b0101519261289f575b93600194612875575b5050500161283f565b6128959161114461288d925f525f60205260405f2090565b918254612790565b90555f888161286c565b505090916128b88c611144835f525f60205260405f2090565b548281106128e9578291888e6128e0600197968e950391611144855f525f60205260405f2090565b55909450612863565b6040516303dee4c560e01b81526001600160a01b038e16600482015260248101919091526044810183905260648101829052608490fd5b5096955096509192505060018151145f146129785760209081015191810151604080519384529183015233917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f6291819081015b0390a4565b60405133927f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb92829161297391836129c0565b635b05999160e01b5f5260045260245260445ffd5b90916129d761046493604084526040840190610867565b91602081840391015261086756fe8eb467f061ca67f42a2d2ca4a346fc9fb645efc0ba75056ee9f71c3a0ccc10a8a26469706673582212202b4937582de3fff74772af21584242cfedc7fc35aca8df1583f42214182d521164736f6c634300081f0033bd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ffd867f7b5ac7a38d68c871410e11ed3f4ad7f40748eb52c5fc067138004f1ad379d56108290ea0bc9c5c59c3ad357dca9d1b29ed7f3ae1443bef2fa2159bdf5e83617319a054d772f909f7c479a2cebe5066e836a939412e32403c99029b92eff8c4e4c886839ee31dab229250456aff85262ae8b6d18d22e78b99daedc77490a" as const;
