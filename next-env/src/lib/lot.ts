export type LotItemInput = {
	name: string;
	description: string;
	quantity: string;
};

export type LotInput = {
	name: string;
	description: string;
	ref: string;
	zone: string;
	producedAt: string;
	items: LotItemInput[];
};

export type LotItemErrors = Partial<Record<keyof LotItemInput, string>>;

export type LotErrors = {
	name?: string;
	ref?: string;
	zone?: string;
	producedAt?: string;
	items?: Record<number, LotItemErrors>;
};

export const EMPTY_ITEM: LotItemInput = {
	name: "",
	description: "",
	quantity: "",
};

export const EMPTY_LOT: LotInput = {
	name: "",
	description: "",
	ref: "",
	zone: "",
	producedAt: "",
	items: [EMPTY_ITEM],
};

export const MAX_ITEMS = 50;

export function normalizeLot(input: LotInput): LotInput {
	return {
		name: input.name.trim().replace(/\s+/g, " "),
		description: input.description.trim(),
		ref: input.ref.trim().replace(/\D/g, ""),
		zone: input.zone.trim().replace(/\s+/g, " "),
		producedAt: input.producedAt.trim(),
		items: input.items.map((item) => ({
			name: item.name.trim().replace(/\s+/g, " "),
			description: item.description.trim(),
			quantity: item.quantity.trim().replace(/\D/g, ""),
		})),
	};
}

export function validateLot(input: LotInput): LotErrors {
	const errors: LotErrors = {};

	if (input.name.length < 2 || input.name.length > 120)
		errors.name = "Entre 2 et 120 caractères";

	if (!/^\d+$/.test(input.ref)) errors.ref = "Uniquement des chiffres";
	else if (input.ref === "0") errors.ref = "La référence 0 est réservée";

	if (input.zone.length < 2 || input.zone.length > 120)
		errors.zone = "Entre 2 et 120 caractères";

	if (Number.isNaN(Date.parse(input.producedAt)))
		errors.producedAt = "Date invalide";

	const items: Record<number, LotItemErrors> = {};
	input.items.forEach((item, index) => {
		const itemErrors: LotItemErrors = {};

		if (item.name.length < 2 || item.name.length > 120)
			itemErrors.name = "Entre 2 et 120 caractères";

		if (!/^\d+$/.test(item.quantity))
			itemErrors.quantity = "Uniquement des chiffres";
		else if (item.quantity === "0") itemErrors.quantity = "1 unité minimum";

		if (Object.keys(itemErrors).length > 0) items[index] = itemErrors;
	});

	if (input.items.length === 0) items[0] = { name: "1 unité minimum" };
	if (Object.keys(items).length > 0) errors.items = items;

	return errors;
}

export function isLotValid(errors: LotErrors) {
	return Object.keys(errors).length === 0;
}

export type ItemMetadata = {
	name: string;
	description?: string;
	properties: Record<string, string | number>;
};

export type LotRecord = {
	name: string;
	description: string | null;
	ref: bigint;
	zone: string | null;
	producedAt: Date | null;
};

const lotProperties = (lot: LotRecord, producer: string) => ({
	ref: lot.ref.toString(),
	producer,
	zone: lot.zone ?? "",
	producedAt: lot.producedAt?.toISOString().slice(0, 10) ?? "",
});

/** Index 0 carries the lot, its quantity being the total units minted. */
export function buildLotMetadata(
	lot: LotRecord,
	producer: string,
	units: number,
): ItemMetadata {
	return {
		name: lot.name,
		description: lot.description ?? undefined,
		properties: { ...lotProperties(lot, producer), quantity: units },
	};
}

/** One `<index>.json` per item: uri() appends the index to the directory CID. */
export function buildItemMetadata(
	lot: LotRecord,
	item: { name: string; description: string | null; quantity: number },
	producer: string,
): ItemMetadata {
	return {
		name: item.name,
		description: item.description ?? lot.description ?? undefined,
		properties: {
			lot: lot.name,
			...lotProperties(lot, producer),
			quantity: item.quantity,
		},
	};
}
