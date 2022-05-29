import { Ratio } from "@bits.ts/all";
import { UiElement } from "../Lib/Ui/Element/Element";
import { UiEvent } from "../Lib/Ui/Event";

export interface HeaderClickedEvent
	extends UiEvent<'HeaderClicked', {}> { }


export function Header(): UiElement {

	const headerClickedEvent: HeaderClickedEvent = {
		name: 'HeaderClicked',
		payload: {},
	};

	return (
		['touchable', { onClickEvent: headerClickedEvent },
			['fill', { color: '#333' },
				['pad', { y: Ratio.Clamp(0.2) },
					['split', { ratio: Ratio.Clamp(2 / 3) },
						['text', { color: 'white' },
							'Green or Yellow?',
						],
						['text', { color: 'white' },
							'A Colorblindness Game/Experiment',
						],
					],
				],
			],
		]
	);
}
