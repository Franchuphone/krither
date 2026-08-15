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
				internalType: "address",
				name: "producer",
				type: "address",
			},
			{
				indexed: true,
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
				name: "",
				type: "uint256",
			},
		],
		name: "lifecycleChanges",
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
				internalType: "address",
				name: "",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		name: "lotIds",
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
				name: "",
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
				name: "",
				type: "address",
			},
		],
		name: "producerByAddr",
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
				name: "",
				type: "uint256",
			},
		],
		name: "producerById",
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
	"0x608060405234801561000f575f5ffd5b506004361061023e575f3560e01c80638cebf93f11610135578063bce07794116100b4578063d547741f11610079578063d547741f146105a0578063e63ab1e9146105b3578063e985e9c5146105da578063f1648e8414610615578063f242432a14610637575f5ffd5b8063bce0779414610534578063bd85b03914610547578063bd9671b814610566578063ca15c87314610579578063cb3e1fe71461058c575f5ffd5b8063a22cb465116100fa578063a22cb465146104a7578063a3246ad3146104ba578063a9fc0b7e146104da578063ae65a353146104ed578063b5cb22bb14610515575f5ffd5b80638cebf93f146104255780639010d07c1461044f57806391ac7e651461047a57806391d148541461048d578063a217fddf146104a0575f5ffd5b80633d42ed51116101c157806352aa758f1161018657806352aa758f146103cd5780635c975abb146103ec578063781d88f2146103f75780638456cb591461040a5780638c303e5214610412575f5ffd5b80633d42ed51146103365780633f4ba83a1461035d5780634bc02da6146103655780634e1273f41461038c5780634f558e79146103ac575f5ffd5b806318160ddd1161020757806318160ddd146102d1578063248a9ca3146102d95780632eb2c2d6146102fb5780632f2ff15d1461031057806336568abe14610323575f5ffd5b8062fdd58e1461024257806301ffc9a714610268578063083c82a81461028b5780630ad1aae31461029e5780630e89341c146102b1575b5f5ffd5b6102556102503660046120dd565b61064a565b6040519081526020015b60405180910390f35b61027b61027636600461211a565b610671565b604051901515815260200161025f565b610255610299366004612135565b61067b565b6102556102ac36600461214c565b610686565b6102c46102bf366004612135565b610696565b60405161025f919061219a565b600754610255565b6102556102e7366004612135565b5f9081526003602052604090206001015490565b61030e6103093660046122e7565b610752565b005b61030e61031e366004612393565b610771565b61030e610331366004612393565b61079b565b6102557f8c4e4c886839ee31dab229250456aff85262ae8b6d18d22e78b99daedc77490a81565b61030e6107b1565b6102557f9d56108290ea0bc9c5c59c3ad357dca9d1b29ed7f3ae1443bef2fa2159bdf5e881565b61039f61039a3660046123bd565b6107e6565b60405161025f91906124b8565b61027b6103ba366004612135565b5f90815260066020526040902054151590565b6102556103db3660046124ca565b60096020525f908152604090205481565b60055460ff1661027b565b610255610405366004612527565b6108b5565b61030e610b10565b61030e6104203660046125c6565b610b42565b6102556104333660046120dd565b600d60209081525f928352604080842090915290825290205481565b61046261045d36600461214c565b610c10565b6040516001600160a01b03909116815260200161025f565b610255610488366004612135565b610c27565b61027b61049b366004612393565b610c37565b6102555f81565b61030e6104b536600461260d565b610c61565b6104cd6104c8366004612135565b610c73565b60405161025f9190612646565b61030e6104e8366004612691565b610c8c565b6104626104fb366004612135565b600a6020525f90815260409020546001600160a01b031681565b610255610523366004612135565b600e6020525f908152604090205481565b61039f610542366004612135565b610d7f565b610255610555366004612135565b5f9081526006602052604090205490565b61030e610574366004612708565b610e58565b610255610587366004612135565b610ff5565b6102555f516020612c015f395f51905f5281565b61030e6105ae366004612393565b61100b565b6102557f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a81565b61027b6105e8366004612708565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205460ff1690565b610628610623366004612135565b61102f565b60405161025f93929190612730565b61030e61064536600461276b565b6110ed565b5f818152602081815260408083206001600160a01b03861684529091529020545b92915050565b5f61066b82611103565b5f61066b8260801c90565b5f608083901b82175b9392505050565b60605f600c5f6106a68560801c90565b815260208101919091526040015f2080549091506001600160a01b03166106e057604051632fa05a2d60e21b815260040160405180910390fd5b80546001600160801b03841690600160a01b90046001600160601b0316811061071c5760405163d3ed043d60e01b815260040160405180910390fd5b8160010161072982611127565b60405160200161073a9291906127f6565b60405160208183030381529060405292505050919050565b61075d335b866111b6565b61076a858585858561122e565b5050505050565b5f8281526003602052604090206001015461078b8161128e565b6107958383611298565b50505050565b6107a361133a565b6107ad8282611360565b5050565b7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a6107db8161128e565b6107e3611398565b50565b6060815183511461081c5781518351604051635b05999160e01b8152600481019290925260248201526044015b60405180910390fd5b5f83516001600160401b03811115610836576108366121ac565b60405190808252806020026020018201604052801561085f578160200160208202803683370190505b5090505f5b84518110156108ad576020808202860101516108889060208084028701015161064a565b82828151811061089a5761089a612891565b6020908102919091010152600101610864565b509392505050565b5f6108be61133a565b5f516020612c015f395f51905f526108d58161128e565b85806108f4576040516308a15feb60e01b815260040160405180910390fd5b85855f819003610917576040516339b4b30960e01b815260040160405180910390fd5b335f908152600d602090815260408083208984529091529020541561094f576040516368cd03cd60e01b815260040160405180910390fd5b600b80545f90610967906001600160801b03166128b9565b91906101000a8154816001600160801b0302191690836001600160801b0316021790556001600160801b031694506040518060600160405280336001600160a01b031681526020018b8b90506001600160601b0316815260200189898080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920182905250939094525050878152600c60209081526040918290208451918501516001600160601b0316600160a01b026001600160a01b03909216919091178155908301519091506001820190610a449082612927565b5050335f818152600d602090815260408083208b84529091529020879055610ab89150610a72878d8d6113ea565b8c8c808060200260200160405190810160405280939291908181526020018383602002808284375f9201829052506040805160208101909152908152925061149f915050565b85336001600160a01b0316867f5504609f316cc63de3b7cbd203eee653cdde7d288c95382820238f4c691bd09e8b8b8f8f42604051610afb959493929190612a09565b60405180910390a45050505095945050505050565b7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a610b3a8161128e565b6107e36114d7565b610b4a61133a565b81815f819003610b6d576040516339b4b30960e01b815260040160405180910390fd5b84610b78338261064a565b5f03610b9757604051633b11fda960e11b815260040160405180910390fd5b5f868152600e60205260408120805491610bb083612a5c565b90915550339050610bc18760801c90565b877fed3d0f8d0f4b09718c1a90741e8de9a4ab5491104b3c6c6b3a586fc2101e3762610bed338b61064a565b898942604051610c009493929190612a74565b60405180910390a4505050505050565b5f82815260046020526040812061068f9083611514565b5f6001600160801b03821661066b565b5f9182526003602090815260408084206001600160a01b0393909316845291905290205460ff1690565b610c6961133a565b6107ad828261151f565b5f81815260046020526040902060609061066b9061152a565b610c9461133a565b5f610c9e8161128e565b5f868152600c602052604090205486906001600160a01b0316610cd457604051632fa05a2d60e21b815260040160405180910390fd5b85855f819003610cf7576040516339b4b30960e01b815260040160405180910390fd5b85855f819003610d1a576040516339b4b30960e01b815260040160405180910390fd5b8989604051610d2a929190612a9e565b60405180910390208b7f91dad2ed57220b752174debd64ceb1194e857a2715ea4b56d082719c9186d5828c8c8c8c42604051610d6a959493929190612aad565b60405180910390a35050505050505050505050565b5f818152600c602052604090205460609082906001600160a01b0316610db857604051632fa05a2d60e21b815260040160405180910390fd5b5f838152600c6020526040902054600160a01b90046001600160601b0316806001600160401b03811115610dee57610dee6121ac565b604051908082528060200260200182016040528015610e17578160200160208202803683370190505b5092505f5b81811015610e5057608085901b8117848281518110610e3d57610e3d612891565b6020908102919091010152600101610e1c565b505050919050565b610e6061133a565b5f610e6a8161128e565b816001600160a01b038116610e92576040516339b190bb60e11b815260040160405180910390fd5b826001600160a01b0316846001600160a01b031603610ec4576040516326c9a72360e11b815260040160405180910390fd5b610edb5f516020612c015f395f51905f5285610c37565b610ef8576040516371bedc0960e11b815260040160405180910390fd5b610f0f5f516020612c015f395f51905f5284610c37565b15610f2d5760405163e4ff959160e01b815260040160405180910390fd5b6001600160a01b038085165f90815260096020908152604080832054938716808452818420859055848452600a90925290912080546001600160a01b0319169091179055610f885f516020612c015f395f51905f5285611298565b50610fa05f516020612c015f395f51905f5286611536565b50836001600160a01b0316856001600160a01b03167ff07418439ada79976e2aad4b0fda92056cdf3e62853f55e220d2b018797b6c3542604051610fe691815260200190565b60405180910390a35050505050565b5f81815260046020526040812061066b90611561565b5f828152600360205260409020600101546110258161128e565b6107958383611536565b600c6020525f9081526040902080546001820180546001600160a01b03831693600160a01b9093046001600160601b031692919061106c906127be565b80601f0160208091040260200160405190810160405280929190818152602001828054611098906127be565b80156110e35780601f106110ba576101008083540402835291602001916110e3565b820191905f5260205f20905b8154815290600101906020018083116110c657829003601f168201915b5050505050905083565b6110f633610757565b61076a858585858561156a565b5f6001600160e01b03198216635a05180f60e01b148061066b575061066b826115f7565b60605f6111338361161b565b60010190505f816001600160401b03811115611151576111516121ac565b6040519080825280601f01601f19166020018201604052801561117b576020820181803683370190505b5090508181016020015b5f19016f181899199a1a9b1b9c1cb0b131b232b360811b600a86061a8153600a850494508461118557509392505050565b816001600160a01b0316816001600160a01b0316141580156111fd57506001600160a01b038082165f9081526001602090815260408083209386168352929052205460ff16155b156107ad5760405163711bec9160e11b81526001600160a01b03808416600483015282166024820152604401610813565b6001600160a01b03841661125757604051632bfa23e760e11b81525f6004820152602401610813565b6001600160a01b03851661127f57604051626a0d4560e21b81525f6004820152602401610813565b61076a858585858560016116f2565b6107e3813361174b565b5f5f6112a48484611784565b90508080156112bf57505f516020612c015f395f51905f5284145b80156112e057506001600160a01b0383165f90815260096020526040902054155b1561068f575f60085f81546112f490612a5c565b91829055506001600160a01b0385165f818152600960209081526040808320859055938252600a90529190912080546001600160a01b0319169091179055509392505050565b60055460ff161561135e5760405163d93c066560e01b815260040160405180910390fd5b565b6001600160a01b03811633146113895760405163334bd91960e11b815260040160405180910390fd5b6113938282611536565b505050565b6113a06117af565b6005805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b6060816001600160401b03811115611404576114046121ac565b60405190808252806020026020018201604052801561142d578160200160208202803683370190505b5090505f5b81518110156108ad575f84848381811061144e5761144e612891565b9050602002013511611473576040516308a15feb60e01b815260040160405180910390fd5b608085901b811782828151811061148c5761148c612891565b6020908102919091010152600101611432565b6001600160a01b0384166114c857604051632bfa23e760e11b81525f6004820152602401610813565b6107955f8585858560016116f2565b6114df61133a565b6005805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586113cd3390565b5f61068f83836117d2565b6107ad3383836117f8565b60605f61068f836118b5565b5f5f611542848461190e565b9050801561068f575f8481526004602052604090206108ad9084611980565b5f61066b825490565b6001600160a01b03841661159357604051632bfa23e760e11b81525f6004820152602401610813565b6001600160a01b0385166115bb57604051626a0d4560e21b81525f6004820152602401610813565b604080516001808252602082018690528183019081526060820185905260808201909252906115ee87878484875f6116f2565b50505050505050565b5f6001600160e01b03198216637965db0b60e01b148061066b575061066b82611994565b5f8072184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b83106116595772184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b830492506040015b6d04ee2d6d415b85acef81000000008310611685576d04ee2d6d415b85acef8100000000830492506020015b662386f26fc1000083106116a357662386f26fc10000830492506010015b6305f5e10083106116bb576305f5e100830492506008015b61271083106116cf57612710830492506004015b606483106116e1576064830492506002015b600a831061066b5760010192915050565b6116fe868686866119e3565b6001600160a01b0385161561174357338115611727576117228188888888886119ef565b6115ee565b6020858101519085015161173f838a8a85858a611b10565b5050505b505050505050565b6117558282610c37565b6107ad5760405163e2517d3f60e01b81526001600160a01b038216600482015260248101839052604401610813565b5f5f6117908484611bf7565b9050801561068f575f8481526004602052604090206108ad9084611c81565b60055460ff1661135e57604051638dfc202b60e01b815260040160405180910390fd5b5f825f0182815481106117e7576117e7612891565b905f5260205f200154905092915050565b6001600160a01b03831661182157604051631f18c42760e11b81525f6004820152602401610813565b6001600160a01b0382166118495760405162ced3e160e81b81525f6004820152602401610813565b6001600160a01b038381165f81815260016020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6060815f0180548060200260200160405190810160405280929190818152602001828054801561190257602002820191905f5260205f20905b8154815260200190600101908083116118ee575b50505050509050919050565b5f6119198383610c37565b15611979575f8381526003602090815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a450600161066b565b505f61066b565b5f61068f836001600160a01b038416611c95565b5f6001600160e01b03198216636cdb3d1360e11b14806119c457506001600160e01b031982166303a24d0760e21b145b8061066b57506301ffc9a760e01b6001600160e01b031983161461066b565b61079584848484611d78565b6001600160a01b0384163b156117435760405163bc197c8160e01b81526001600160a01b0385169063bc197c8190611a339089908990889088908890600401612ae6565b6020604051808303815f875af1925050508015611a6d575060408051601f3d908101601f19168201909252611a6a91810190612b43565b60015b611ad4573d808015611a9a576040519150601f19603f3d011682016040523d82523d5f602084013e611a9f565b606091505b5080515f03611acc57604051632bfa23e760e11b81526001600160a01b0386166004820152602401610813565b805160208201fd5b6001600160e01b0319811663bc197c8160e01b146115ee57604051632bfa23e760e11b81526001600160a01b0386166004820152602401610813565b6001600160a01b0384163b156117435760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e6190611b549089908990889088908890600401612b5e565b6020604051808303815f875af1925050508015611b8e575060408051601f3d908101601f19168201909252611b8b91810190612b43565b60015b611bbb573d808015611a9a576040519150601f19603f3d011682016040523d82523d5f602084013e611a9f565b6001600160e01b0319811663f23a6e6160e01b146115ee57604051632bfa23e760e11b81526001600160a01b0386166004820152602401610813565b5f611c028383610c37565b611979575f8381526003602090815260408083206001600160a01b03861684529091529020805460ff19166001179055611c393390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a450600161066b565b5f61068f836001600160a01b038416611e5f565b5f8181526001830160205260408120548015611d6f575f611cb7600183612ba2565b85549091505f90611cca90600190612ba2565b9050808214611d29575f865f018281548110611ce857611ce8612891565b905f5260205f200154905080875f018481548110611d0857611d08612891565b5f918252602080832090910192909255918252600188019052604090208390555b8554869080611d3a57611d3a612bb5565b600190038181905f5260205f20015f90559055856001015f8681526020019081526020015f205f90556001935050505061066b565b5f91505061066b565b611d8484848484611ea4565b6001600160a01b038416611e01575f805b8351811015611de85760208181028481018201519086018201515f908152600690925260408220805491928392611dcd908490612bc9565b90915550611ddd90508184612bc9565b925050600101611d95565b508060075f828254611dfa9190612bc9565b9091555050505b6001600160a01b038316610795575f805b8351811015611e4e5760208181028481018201519086018201515f90815260069092526040909120805482900390559190910190600101611e12565b506007805491909103905550505050565b5f81815260018301602052604081205461197957508154600181810184555f84815260208082209093018490558454848252828601909352604090209190915561066b565b611eac61133a565b610795848484848051825114611ee25781518151604051635b05999160e01b815260048101929092526024820152604401610813565b335f5b8351811015611fe4576020818102858101820151908501909101516001600160a01b03881615611f96575f828152602081815260408083206001600160a01b038c16845290915290205481811015611f70576040516303dee4c560e01b81526001600160a01b038a166004820152602481018290526044810183905260648101849052608401610813565b5f838152602081815260408083206001600160a01b038d16845290915290209082900390555b6001600160a01b03871615611fda575f828152602081815260408083206001600160a01b038b16845290915281208054839290611fd4908490612bc9565b90915550505b5050600101611ee5565b5082516001036120645760208301515f906020840151909150856001600160a01b0316876001600160a01b0316846001600160a01b03167fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f628585604051612055929190918252602082015260400190565b60405180910390a4505061076a565b836001600160a01b0316856001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb86866040516120b3929190612bdc565b60405180910390a45050505050565b80356001600160a01b03811681146120d8575f5ffd5b919050565b5f5f604083850312156120ee575f5ffd5b6120f7836120c2565b946020939093013593505050565b6001600160e01b0319811681146107e3575f5ffd5b5f6020828403121561212a575f5ffd5b813561068f81612105565b5f60208284031215612145575f5ffd5b5035919050565b5f5f6040838503121561215d575f5ffd5b50508035926020909101359150565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f61068f602083018461216c565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b03811182821017156121e8576121e86121ac565b604052919050565b5f6001600160401b03821115612208576122086121ac565b5060051b60200190565b5f82601f830112612221575f5ffd5b813561223461222f826121f0565b6121c0565b8082825260208201915060208360051b860101925085831115612255575f5ffd5b602085015b8381101561227257803583526020928301920161225a565b5095945050505050565b5f82601f83011261228b575f5ffd5b81356001600160401b038111156122a4576122a46121ac565b6122b7601f8201601f19166020016121c0565b8181528460208386010111156122cb575f5ffd5b816020850160208301375f918101602001919091529392505050565b5f5f5f5f5f60a086880312156122fb575f5ffd5b612304866120c2565b9450612312602087016120c2565b935060408601356001600160401b0381111561232c575f5ffd5b61233888828901612212565b93505060608601356001600160401b03811115612353575f5ffd5b61235f88828901612212565b92505060808601356001600160401b0381111561237a575f5ffd5b6123868882890161227c565b9150509295509295909350565b5f5f604083850312156123a4575f5ffd5b823591506123b4602084016120c2565b90509250929050565b5f5f604083850312156123ce575f5ffd5b82356001600160401b038111156123e3575f5ffd5b8301601f810185136123f3575f5ffd5b803561240161222f826121f0565b8082825260208201915060208360051b850101925087831115612422575f5ffd5b6020840193505b8284101561244b5761243a846120c2565b825260209384019390910190612429565b945050505060208301356001600160401b03811115612468575f5ffd5b61247485828601612212565b9150509250929050565b5f8151808452602084019350602083015f5b828110156124ae578151865260209586019590910190600101612490565b5093949350505050565b602081525f61068f602083018461247e565b5f602082840312156124da575f5ffd5b61068f826120c2565b5f5f83601f8401126124f3575f5ffd5b5081356001600160401b03811115612509575f5ffd5b602083019150836020828501011115612520575f5ffd5b9250929050565b5f5f5f5f5f6060868803121561253b575f5ffd5b85356001600160401b03811115612550575f5ffd5b8601601f81018813612560575f5ffd5b80356001600160401b03811115612575575f5ffd5b8860208260051b8401011115612589575f5ffd5b6020918201965094508601356001600160401b038111156125a8575f5ffd5b6125b4888289016124e3565b96999598509660400135949350505050565b5f5f5f604084860312156125d8575f5ffd5b8335925060208401356001600160401b038111156125f4575f5ffd5b612600868287016124e3565b9497909650939450505050565b5f5f6040838503121561261e575f5ffd5b612627836120c2565b91506020830135801515811461263b575f5ffd5b809150509250929050565b602080825282518282018190525f918401906040840190835b818110156126865783516001600160a01b031683526020938401939092019160010161265f565b509095945050505050565b5f5f5f5f5f606086880312156126a5575f5ffd5b8535945060208601356001600160401b038111156126c1575f5ffd5b6126cd888289016124e3565b90955093505060408601356001600160401b038111156126eb575f5ffd5b6126f7888289016124e3565b969995985093965092949392505050565b5f5f60408385031215612719575f5ffd5b612722836120c2565b91506123b4602084016120c2565b6001600160a01b03841681526001600160601b03831660208201526060604082018190525f906127629083018461216c565b95945050505050565b5f5f5f5f5f60a0868803121561277f575f5ffd5b612788866120c2565b9450612796602087016120c2565b9350604086013592506060860135915060808601356001600160401b0381111561237a575f5ffd5b600181811c908216806127d257607f821691505b6020821081036127f057634e487b7160e01b5f52602260045260245ffd5b50919050565b5f5f8454612803816127be565b60018216801561281a576001811461282f5761285c565b60ff198316865281151582028601935061285c565b875f5260205f205f5b8381101561285457815488820152600190910190602001612838565b505081860193505b505050602f60f81b815283518060208601600184015e64173539b7b760d91b9101600181019182529050600601949350505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b5f6001600160801b0382166001600160801b0381036128da576128da6128a5565b60010192915050565b601f82111561139357805f5260205f20601f840160051c810160208510156129085750805b601f840160051c820191505b8181101561076a575f8155600101612914565b81516001600160401b03811115612940576129406121ac565b6129548161294e84546127be565b846128e3565b6020601f821160018114612986575f831561296f5750848201515b5f19600385901b1c1916600184901b17845561076a565b5f84815260208120601f198516915b828110156129b55787850151825560209485019460019092019101612995565b50848210156129d257868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b606081525f612a1c6060830187896129e1565b82810360208401528481526001600160fb1b03851115612a3a575f5ffd5b8460051b80876020840137604093909301939093525001602001949350505050565b5f60018201612a6d57612a6d6128a5565b5060010190565b848152606060208201525f612a8d6060830185876129e1565b905082604083015295945050505050565b818382375f9101908152919050565b606081525f612ac06060830187896129e1565b8281036020840152612ad38186886129e1565b9150508260408301529695505050505050565b6001600160a01b0386811682528516602082015260a0604082018190525f90612b119083018661247e565b8281036060840152612b23818661247e565b90508281036080840152612b37818561216c565b98975050505050505050565b5f60208284031215612b53575f5ffd5b815161068f81612105565b6001600160a01b03868116825285166020820152604081018490526060810183905260a0608082018190525f90612b979083018461216c565b979650505050505050565b8181038181111561066b5761066b6128a5565b634e487b7160e01b5f52603160045260245ffd5b8082018082111561066b5761066b6128a5565b604081525f612bee604083018561247e565b8281036020840152612762818561247e56fe8eb467f061ca67f42a2d2ca4a346fc9fb645efc0ba75056ee9f71c3a0ccc10a8a2646970667358221220415fcf42e2f6ef1f44c1d7b59f5c2ae826c08c2e87b184bb0c6757293415918164736f6c634300081f0033" as const;
