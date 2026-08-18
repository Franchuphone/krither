// Forwards JSON-RPC to the node so RPC_SEPOLIA never reaches the browser.
export async function POST(request: Request) {
	const response = await fetch(process.env.RPC_SEPOLIA as string, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: await request.text(),
	});

	return new Response(await response.text(), {
		headers: { "content-type": "application/json" },
	});
}
