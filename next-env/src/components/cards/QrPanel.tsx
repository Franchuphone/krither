/** Renders a server-generated QR SVG above the link it encodes. */
const QrPanel = ({
	svg,
	url,
	label,
	className,
}: {
	svg: string;
	url: string;
	label: string;
	className?: string;
}) => (
	<div className={className}>
		<div className="flex flex-col items-center gap-2">
			<div
				className="size-40 rounded-md bg-white p-2 [&_svg]:size-full"
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
			<span className="text-xs break-all text-muted-foreground">
				<a href={url} target="_blank" rel="noopener noreferrer">
					{label}
				</a>
			</span>
		</div>
	</div>
);

export default QrPanel;
