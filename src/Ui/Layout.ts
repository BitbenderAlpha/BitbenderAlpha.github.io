import { Ratio } from "@bits.ts/all";
import { UiComponent } from "../Lib/Ui/Component";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout: UiComponent<void> =
	(_, ...children) =>
		['split', { ratio: Ratio.Clamp(0.1) },
			[Header, {}],
			['split', { ratio: Ratio.Clamp(1 - 1/30) },
				['fixed-aspect-ratio', { longDimension: 'y', ratio: Ratio.Clamp(2/3) },
					children[0],
				],
				[Footer, {}],
			],
		];