import { Ratio } from "@bits.ts/all";
import { UiComponent } from "../Lib/Ui/Component";

interface UiButtonParameters {
	readonly onClick?: () => void; // todo -- better
	readonly active?: boolean;
}

export const Button: UiComponent<UiButtonParameters> = ({
	onClick = () => {},
	active = false,
}, ...children) => {
	// const isBeingPressed = clickable(area, onclick);
	// active = active || isBeingPressed;
	const [fillColor, textColor] = active ? ['white', 'black'] : ['black', 'white'];
	return (
		['fill', { color: 'white' },
			['pad', { x: Ratio.Clamp(0.05), y: Ratio.Clamp(0.2) },
				['fill', { color: fillColor},
					['pad', { y: Ratio.Half },
						['text', { color: textColor },
							...children.filter( child => typeof child === 'string') as string[],
						],
					],
				],
			],
		]
	);
}