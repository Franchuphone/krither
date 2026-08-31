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
	quantity: string;
	items: LotItemInput[];
};

export type LotItemErrors = Partial<Record<keyof LotItemInput, string>>;

export type LotErrors = {
	name?: string;
	ref?: string;
	zone?: string;
	producedAt?: string;
	quantity?: string;
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
	quantity: "",
	items: [EMPTY_ITEM],
};

export const MAX_ITEMS = 50;

/** Lot-level only: each item keeps its own single document on top. */
export const MAX_LOT_DOCUMENTS = 5;

export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export function normalizeLot(input: LotInput): LotInput {
	return {
		name: input.name.trim().replace(/\s+/g, " "),
		description: input.description.trim(),
		ref: input.ref.trim().replace(/\D/g, ""),
		zone: input.zone.trim().replace(/\s+/g, " "),
		producedAt: input.producedAt.trim(),
		quantity: input.quantity.trim().replace(/\D/g, ""),
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

	if (!/^\d+$/.test(input.quantity))
		errors.quantity = "Uniquement des chiffres";
	else if (input.quantity === "0") errors.quantity = "1 unité minimum";

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

export type LotDocument = { name: string; cid: string };

export type ItemMetadata = {
	name: string;
	description?: string;
	properties: Record<string, string | number>;
	documents: LotDocument[];
};

const documentsOf = (documents: { name: string; cid: string }[]) =>
	documents.map(({ name, cid }) => ({ name, cid }));

export type LotRecord = {
	name: string;
	description: string | null;
	ref: bigint;
	zone: string | null;
	producedAt: Date | null;
	quantity: number;
};

const lotProperties = (lot: LotRecord, producer: string) => ({
	ref: lot.ref.toString(),
	producer,
	zone: lot.zone ?? "",
	producedAt: lot.producedAt?.toISOString().slice(0, 10) ?? "",
});

/** Index 0 carries the lot, whose quantity is declared, not summed from items. */
export function buildLotMetadata(
	lot: LotRecord & { documents: LotDocument[] },
	producer: string,
): ItemMetadata {
	return {
		name: lot.name,
		description: lot.description ?? undefined,
		properties: { ...lotProperties(lot, producer), quantity: lot.quantity },
		documents: documentsOf(lot.documents),
	};
}

/** One `<index>.json` per item: uri() appends the index to the directory CID. */
export function buildItemMetadata(
	lot: LotRecord,
	item: {
		name: string;
		description: string | null;
		quantity: number;
		document: LotDocument | null;
	},
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
		documents: documentsOf(item.document ? [item.document] : []),
	};
}

export const MAX_STEP_DESCRIPTION = 500;

/** Pinned on its own, outside the frozen mint directory. */
export function buildStepMetadata(
	lot: { ref: bigint },
	producer: string,
	title: string,
	description: string,
	documents: LotDocument[],
): ItemMetadata {
	return {
		name: title,
		description: description || undefined,
		properties: {
			ref: lot.ref.toString(),
			producer,
			recordedAt: new Date().toISOString(),
		},
		documents: documentsOf(documents),
	};
}
