const GROUPS_ENDPOINT = "https://api.pinata.cloud/v3/groups/public";
const FILES_ENDPOINT = "https://uploads.pinata.cloud/v3/files";
const MANAGE_ENDPOINT = "https://api.pinata.cloud/v3/files/public";

function authorization() {
	const jwt = process.env.PINATA_JWT;
	if (!jwt) throw new Error("Missing PINATA_JWT");
	return `Bearer ${jwt}`;
}

async function readJson<T>(response: Response, label: string) {
	if (!response.ok) {
		throw new Error(
			`${label} ${response.status}: ${await response.text()}`,
		);
	}
	return (await response.json()) as { data?: T };
}

export async function createGroup(name: string) {
	const response = await fetch(GROUPS_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: authorization(),
		},
		body: JSON.stringify({ name }),
	});

	const { data } = await readJson<{ id: string }>(response, "Pinata groups");
	if (!data?.id) throw new Error("Pinata returned no group id");

	return data.id;
}

/** One directory, because uri() resolves `<cid>/<index>.json`. */
export async function uploadDirectory(
	files: File[],
	name: string,
	group: string,
) {
	const form = new FormData();
	for (const file of files) form.append("file", file);
	form.append("network", "public");
	form.append("name", name);
	form.append("group_id", group);

	const response = await fetch(FILES_ENDPOINT, {
		method: "POST",
		headers: { Authorization: authorization() },
		body: form,
	});

	const { data } = await readJson<{ cid: string }>(response, "Pinata upload");
	if (!data?.cid) throw new Error("Pinata returned no CID");

	return data.cid;
}

/** Deposited before the metadata directory: its cid goes inside the json. */
export async function uploadDocument(file: File, name: string, group: string) {
	const form = new FormData();
	form.append("file", file);
	form.append("network", "public");
	form.append("name", name);
	form.append("group_id", group);

	const response = await fetch(FILES_ENDPOINT, {
		method: "POST",
		headers: { Authorization: authorization() },
		body: form,
	});

	const { data } = await readJson<{ id: string; cid: string }>(
		response,
		"Pinata upload",
	);
	if (!data?.cid || !data.id) throw new Error("Pinata returned no CID");

	return { cid: data.cid, pinataId: data.id };
}

export async function deleteFile(pinataId: string) {
	const response = await fetch(`${MANAGE_ENDPOINT}/${pinataId}`, {
		method: "DELETE",
		headers: { Authorization: authorization() },
	});

	if (!response.ok) {
		throw new Error(`Pinata delete ${response.status}`);
	}
}

export function jsonFile(name: string, content: unknown) {
	return new File([JSON.stringify(content, null, 2)], name, {
		type: "application/json",
	});
}
