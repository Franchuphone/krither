import type { SVGProps } from "react";

const MarkPaths = ({ bold = false }: { bold?: boolean }) => (
	<g
		fillRule="evenodd"
		clipRule="evenodd"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeMiterlimit={1.5}
		strokeWidth={bold ? 30 : 0}
	>
		<path
			d="M1205.2,42.971c163.195,42.037 319.524,132.294 437.527,252.606c45.192,162.35 45.192,342.863 -0,505.213c-118.003,120.312 -274.332,210.568 -437.527,252.606c-163.195,-42.038 -319.524,-132.294 -437.527,-252.606c-45.192,-162.35 -45.192,-342.863 -0,-505.213c118.003,-120.312 274.332,-210.569 437.527,-252.606Z"
			fill="none"
			strokeWidth={bold ? 72 : 38.89}
		/>
		<path d="M918.87,152.933c109.43,99.916 171.774,241.261 171.774,389.444c0,148.183 -62.344,289.529 -171.774,389.445l-32.003,-35.05c99.582,-90.924 156.315,-219.548 156.315,-354.395c0,-134.846 -56.733,-263.471 -156.315,-354.394l32.003,-35.05Z" />
		<path d="M1573.81,210.929c-78.943,186.331 -257.549,311.055 -459.67,320.996l-2.331,-47.405c183.929,-9.046 346.461,-122.545 418.3,-292.107l43.701,18.516Z" />
		<path d="M1573.81,873.826c-78.943,-186.331 -257.549,-311.055 -459.67,-320.996l-2.331,47.405c183.929,9.046 346.461,122.545 418.3,292.106l43.701,-18.515Z" />
	</g>
);

const BOLD_MARK_FIT = "translate(39.44 17.94) scale(0.9673)";

const WordPaths = () => (
	<g fillRule="evenodd" clipRule="evenodd">
		<path
			d="M96.164,1238.71l-51.315,-0l0,505.212l51.315,0l-0,-505.212Zm16.677,252.246l-0,2.883l167.414,250.083l65.426,0l-174.47,-252.966l159.717,-252.246l-59.654,-0l-158.433,252.246Z"
			fillRule="nonzero"
		/>
		<path
			d="M415.597,1238.71l-0,505.212l51.314,0l0,-209.724l35.279,-0c32.713,-0 52.597,15.135 69.916,48.287l81.462,161.437l60.936,0l-82.745,-157.833c-20.526,-38.918 -36.562,-55.495 -54.522,-64.864l0,-2.883c53.881,-6.486 101.347,-54.773 101.347,-137.654c-0,-100.898 -56.446,-141.978 -150.095,-141.978l-112.892,-0Zm51.314,51.17l54.522,-0c67.992,-0 104.553,26.666 104.553,97.295c0,69.908 -39.127,97.294 -101.346,97.294l-57.729,0l0,-194.589Z"
			fillRule="nonzero"
		/>
		<rect
			x="803.663"
			y="1238.71"
			width="51.315"
			height="505.213"
			fillRule="nonzero"
		/>
		<path
			d="M1049.33,1743.92l51.315,0l-0,-454.042l119.306,-0l-0,-51.17l-290.569,-0l0,51.17l119.948,-0l0,454.042Z"
			fillRule="nonzero"
		/>
		<path
			d="M1556.7,1238.71l0,224.138l-217.445,0l0,-224.138l-51.314,-0l-0,505.212l51.314,0l0,-229.904l217.445,0l0,229.904l51.315,0l-0,-505.212l-51.315,-0Z"
			fillRule="nonzero"
		/>
		<path
			d="M1976.2,1743.92l-0,-51.169l-196.278,-0l-0,-179.455l164.848,-0l-0,-51.17l-164.848,-0l-0,-172.248l187.298,-0l-0,-51.17l-238.613,-0l0,505.212l247.593,0Z"
			fillRule="nonzero"
		/>
		<path
			d="M2066.64,1238.71l-0,505.212l51.314,0l0,-209.724l35.279,-0c32.713,-0 52.597,15.135 69.916,48.287l81.462,161.437l60.936,0l-82.745,-157.833c-20.526,-38.918 -36.562,-55.495 -54.522,-64.864l0,-2.883c53.881,-6.486 101.347,-54.773 101.347,-137.654c-0,-100.898 -56.446,-141.978 -150.095,-141.978l-112.892,-0Zm51.314,51.17l54.522,-0c67.992,-0 104.553,26.666 104.553,97.295c0,69.908 -39.127,97.294 -101.346,97.294l-57.729,0l0,-194.589Z"
			fillRule="nonzero"
		/>
	</g>
);

export const KritherMark = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="714.33 23.52 981.73 1049.32"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<MarkPaths />
	</svg>
);

export const KritherMarkBold = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="628.07 -28.95 1154.25 1154.25"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<MarkPaths bold />
	</svg>
);

export const KritherWordmark = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="44.85 1238.71 2320.70 505.21"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<WordPaths />
	</svg>
);

export const KritherLockupVertical = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="44.85 23.52 2320.70 1720.39"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<g transform={BOLD_MARK_FIT}>
			<MarkPaths bold />
		</g>
		<WordPaths />
	</svg>
);

export const KritherLockupHorizontal = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="714.33 23.52 3318.97 1049.32"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<g transform={BOLD_MARK_FIT}>
			<MarkPaths bold />
		</g>
		<g transform="translate(1773.21 -876.65) scale(0.95542)">
			<WordPaths />
		</g>
	</svg>
);
