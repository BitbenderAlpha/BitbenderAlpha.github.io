import { UiComponent } from "../Lib/Ui/Component";

export const Footer: UiComponent<void> = () =>
	['fill', { color: 'black' },
		['text', { color: 'white' },
			'Hacked Together by Bitbender'
		]
	];