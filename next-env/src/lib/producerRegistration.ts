export const PRODUCER_FIELD_NAMES = [
	"companyName",
	"legalForm",
	"siret",
	"apeCode",
	"representativeName",
	"email",
	"phone",
	"street",
	"postalCode",
	"city",
	"country",
] as const;

export type ProducerFieldName = (typeof PRODUCER_FIELD_NAMES)[number];

export type ProducerSubmission = Record<ProducerFieldName, string>;

export type RegistrationField = {
	name: ProducerFieldName;
	label: string;
	placeholder?: string;
	autoComplete?: string;
	options?: readonly { value: string; label: string }[];
	fixed?: boolean;
	wide?: boolean;
};

export const LEGAL_FORM_OPTIONS = [
	{ value: "EI", label: "Entreprise individuelle" },
	{ value: "EURL", label: "EURL" },
	{ value: "SARL", label: "SARL" },
	{ value: "SAS", label: "SAS" },
	{ value: "SASU", label: "SASU" },
	{ value: "SA", label: "SA" },
	{ value: "SNC", label: "SNC" },
	{ value: "SCOP", label: "SCOP" },
	{ value: "SCIC", label: "SCIC" },
	{ value: "GAEC", label: "GAEC" },
	{ value: "EARL", label: "EARL" },
	{ value: "SCEA", label: "SCEA" },
	{ value: "ASSO", label: "Association" },
] as const;

export const SUPPORTED_COUNTRY = "FR";

export const REGISTRATION_FIELDS: readonly RegistrationField[] = [
	{
		name: "companyName",
		label: "Raison sociale",
		placeholder: "Ferme des Trois Chênes",
		autoComplete: "organization",
		wide: true,
	},
	{
		name: "legalForm",
		label: "Forme juridique",
		placeholder: "Sélectionner",
		options: LEGAL_FORM_OPTIONS,
	},
	{
		name: "siret",
		label: "SIRET",
		placeholder: "14 chiffres",
	},
	{
		name: "apeCode",
		label: "Code APE",
		placeholder: "01.13Z",
	},
	{
		name: "representativeName",
		label: "Représentant légal",
		placeholder: "Prénom Nom",
		autoComplete: "name",
	},
	{
		name: "email",
		label: "Email",
		placeholder: "contact@exemple.fr",
		autoComplete: "email",
	},
	{
		name: "phone",
		label: "Téléphone",
		placeholder: "+33 6 12 34 56 78",
		autoComplete: "tel",
	},
	{
		name: "street",
		label: "Adresse du siège social",
		placeholder: "12 route des Vignes",
		autoComplete: "street-address",
		wide: true,
	},
	{
		name: "postalCode",
		label: "Code postal",
		placeholder: "33000",
		autoComplete: "postal-code",
	},
	{
		name: "city",
		label: "Ville",
		placeholder: "Bordeaux",
		autoComplete: "address-level2",
	},
	{
		name: "country",
		label: "Pays",
		fixed: true,
	},
];

export const EMPTY_SUBMISSION: ProducerSubmission = {
	companyName: "",
	legalForm: "",
	siret: "",
	apeCode: "",
	representativeName: "",
	email: "",
	phone: "",
	street: "",
	postalCode: "",
	city: "",
	country: SUPPORTED_COUNTRY,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const APE_CODE = /^\d{2}\.\d{2}[A-Z]$/;
const PHONE = /^\+?\d{9,15}$/;

function hasValidLuhn(digits: string) {
	let sum = 0;
	for (let index = 0; index < digits.length; index++) {
		let digit = Number(digits[digits.length - 1 - index]);
		if (index % 2 === 1) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
	}
	return sum % 10 === 0;
}

/** Same values reach validation and storage, so a SIRET is stored one way only. */
export function normalizeSubmission(
	raw: Partial<ProducerSubmission>,
): ProducerSubmission {
	const value = (name: ProducerFieldName) => (raw[name] ?? "").trim();

	return {
		companyName: value("companyName").replace(/\s+/g, " "),
		legalForm: value("legalForm").toUpperCase(),
		siret: value("siret").replace(/\D/g, ""),
		apeCode: value("apeCode").replace(/\s/g, "").toUpperCase(),
		representativeName: value("representativeName").replace(/\s+/g, " "),
		email: value("email").toLowerCase(),
		phone: value("phone").replace(/[\s.-]/g, ""),
		street: value("street").replace(/\s+/g, " "),
		postalCode: value("postalCode").replace(/\s/g, ""),
		city: value("city").replace(/\s+/g, " "),
		country: value("country").toUpperCase(),
	};
}

const VALIDATORS: Record<ProducerFieldName, (value: string) => string | null> = {
	companyName: (value) =>
		value.length >= 2 && value.length <= 120 ?
			null
		:	"Entre 2 et 120 caractères",
	legalForm: (value) =>
		LEGAL_FORM_OPTIONS.some((option) => option.value === value) ?
			null
		:	"Forme juridique inconnue",
	siret: (value) =>
		!/^\d{14}$/.test(value) ? "14 chiffres attendus"
		: !hasValidLuhn(value) ? "Numéro invalide"
		: null,
	apeCode: (value) => (APE_CODE.test(value) ? null : "Format attendu : 01.13Z"),
	representativeName: (value) =>
		value.length >= 2 && value.length <= 120 ?
			null
		:	"Entre 2 et 120 caractères",
	email: (value) => (EMAIL.test(value) ? null : "Email invalide"),
	phone: (value) => (PHONE.test(value) ? null : "Numéro invalide"),
	street: (value) =>
		value.length >= 4 && value.length <= 160 ?
			null
		:	"Entre 4 et 160 caractères",
	postalCode: (value) => (/^\d{5}$/.test(value) ? null : "5 chiffres attendus"),
	city: (value) =>
		value.length >= 2 && value.length <= 80 ?
			null
		:	"Entre 2 et 80 caractères",
	country: (value) => (value === SUPPORTED_COUNTRY ? null : "Pays non desservi"),
};

export function validateField(
	name: ProducerFieldName,
	submission: ProducerSubmission,
) {
	return VALIDATORS[name](submission[name]);
}

export function validateSubmission(submission: ProducerSubmission) {
	const errors: Partial<Record<ProducerFieldName, string>> = {};
	for (const name of PRODUCER_FIELD_NAMES) {
		const error = validateField(name, submission);
		if (error) errors[name] = error;
	}
	return errors;
}

export type ProducerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ProducerRequest = {
	status: ProducerStatus;
	companyName: string;
	createdAt: string;
};

export type ProducerDossier = ProducerSubmission & {
	id: string;
	account: `0x${string}`;
	status: ProducerStatus;
	createdAt: string;
};
