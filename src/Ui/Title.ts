import { Ratio } from "@bits.ts/all";
import { UiComponent } from "../Lib/Ui/Component";
import { UiElement } from "../Lib/Ui/Element/Element";
import { Button } from "./Button";
import { Layout } from "./Layout";

export const Title: UiComponent<void> = () =>
	[Layout, {},
		['split', { ratio: Ratio.Clamp(0.1) },
			['split', {},
				null,
				['text', { color: 'white' },
					'How many samples?',
				]
			],
			['split-y', {},
				...[4, 6, 8, 10].map<UiElement>( root => 
					['pad', { x: Ratio.Clamp(0.1), y: Ratio.Clamp(0.3) },
						[Button, {},
							`${root*root} (${root}x${root})`,
						],
					]
				),
			],
		],
	];