export default async function VerifyPage({
	params,
}: {
	params: Promise<{ producerId: string; ref: string }>;
}) {
	const { producerId, ref } = await params;

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<p className="text-sm text-muted-foreground tabular-nums">
				{producerId} / {ref}
			</p>
		</div>
	);
}
