import { NonNegativeInteger, PositiveInteger, Ratio, Result, SeedableRandomSource, UniformRandomIntegerDistribution } from "@bits.ts/all";
import { PixelRectangle } from "./PixelRectangle";
import { InputPointerEventComponent } from "./Input/PointerEvent/Component";
import { InMemoryEcsEntityManager } from "./Lib/Architecture/Ecs/EntityManager/InMemory";
import { makeInputPointerEventSystem } from "./Input/PointerEvent/System";
import { makeTimeSystem } from "./Time/System";
import { TimeComponent } from "./Time/Component";
import { EcsEngine } from "./Lib/Architecture/Ecs/Engine";
import { EcsSystem } from "./Lib/Architecture/Ecs/System";
import { EcsEntityManagerInterface } from "./Lib/Architecture/Ecs/EntityManager/Interface";
import { UiDimension } from "./Lib/Ui/Dimension";

type Entity = Partial<{
	time: TimeComponent,
	inputPointerEvent: InputPointerEventComponent,
	uiElement: UiElement,
}>;

const { setTimeExternally, updateTimeEntity } = makeTimeSystem();
const entityManager = new InMemoryEcsEntityManager<Entity>();

const engine =
	new EcsEngine({
		entityManager,
		systems: [
			updateTimeEntity,
			makeInputPointerEventSystem(),
			makeCanvasUiDrawingSystem({ canvasDomId: 'canvas' }),
		],
});

function loop(ms: number, msp: number) {
	setTimeExternally(ms);
	engine.tick();
	requestAnimationFrame(tick => loop(tick, ms));
}

requestAnimationFrame(tp => requestAnimationFrame(t => loop(t, tp)));

type UiComponent<T> =
	(params: T, ...children:UiElement[]) =>
		UiElement

type UiElement<T = any>
	= [ UiComponent<T>, T, ...UiElement[]]
	| [ 'text', PrimitiveTextUiElementParams, ...string[] ]
	| [ 'fill', PrimitiveFillUiElementParams, ...UiElement[] ]
	| [ 'split', PrimitiveSplitUiElementParams, ...UiElement[] ]
	| [ 'split-x', {}, ...UiElement[] ]
	| [ 'split-y', {}, ...UiElement[] ]
	| [ 'pad', PrimitivePaddedUiElementParams, ...UiElement[] ]
	| [ 'fixed-aspect-ratio', PrimitiveFixedAspectRatioUiElementParams, ...UiElement[] ]
	| [ 'touchable', PrimativeTouchableElementParams, ...UiElement[] ]
	| number
	| string
	| boolean
	| null

interface UiEvent<T = null> {
	readonly name: string;
	readonly payload: T;
}

interface PrimativeTouchableElementParams {
	onClickEvent: UiEvent,
}

interface PrimitiveFillUiElementParams {
	readonly color?: string,
}

interface PrimitiveSplitUiElementParams {
	readonly dimension?: UiDimension,
	readonly ratio?: Ratio,
}

interface PrimitivePaddedUiElementParams {
	readonly xPaddingRatio?: Ratio;
	readonly yPaddingRatio?: Ratio;
}

interface PrimitiveFixedAspectRatioUiElementParams {
	readonly ratio?: Ratio;
	readonly longDimension?: UiDimension;
}

interface PrimitiveTextUiElementParams {
	readonly text?: string,
	readonly color?: string,
}

interface UiElementEntity {
	uiElement?: UiElement,
}

function makeCanvasUiDrawingSystem({
	canvasDomId,
}: {
	canvasDomId: string,
}): EcsSystem<UiElementEntity> {
	// todo -- result?
	const canvas = document.getElementById(canvasDomId);
	if (!(canvas instanceof HTMLCanvasElement)) throw new Error(`Bad canvas id ${canvasDomId}`);
	const canvasContext = canvas.getContext('2d');
	if (canvasContext === null) throw new Error('Failed to get 2d canvas context');

	function drawUiElement(
		element: UiElement,
		region: PixelRectangle,
		canvasContext: CanvasRenderingContext2D,
	) {

		if (element === null) return;

		if (!Array.isArray(element)) {
			drawUiElement(['text', {}, String(element)], region, canvasContext);
			return;
		}

		const [ component, params, ...children ] = element;

		if (component === 'fill') {
			const {
				color = 'black',
			} = params;
			canvasContext.fillStyle = color;
			canvasContext.fillRect(
				region.x.value,
				region.y.value,
				region.width.value,
				region.height.value
			);
			if (children.length > 1) {
				throw new Error('todo: support any number of children');
			}
			const child = children[0] || null;
			drawUiElement(child, region, canvasContext);
			return;
		}

		if (component === 'split') {
			const {
				dimension = 'y',
				ratio = Ratio.Half,
			} = params;
			const [primaryRegion, secondaryRegion] =
				dimension === 'x' 
					? region.splitX(ratio)
					: region.splitY(ratio);

			if (children.length > 2) {
				throw new Error('todo: support any number of children');
			}

			const primaryChild = children[0] || null;
			const secondaryChild = children[1] || null;

			drawUiElement(primaryChild, primaryRegion, canvasContext);
			drawUiElement(secondaryChild, secondaryRegion, canvasContext);
			return;
		}

		if (component === 'split-x') {
			const N = children.length;
			let remainingRegion = region;
			let childRegion;
			children.forEach( (childElement, i) => {
				[childRegion, remainingRegion] = remainingRegion.splitX(Ratio.Clamp(1/(N-i)));
				drawUiElement(childElement, childRegion, canvasContext);
			});
			return;
		}

		if (component === 'split-y') {
			const N = children.length;
			let remainingRegion = region;
			let childRegion;
			children.forEach( (childElement, i) => {
				[childRegion, remainingRegion] = remainingRegion.splitY(Ratio.Clamp(1/(N-i)));
				drawUiElement(childElement, childRegion, canvasContext);
			});
			return;
		}

		if (component === 'pad') {
			// todo: move some of this complexity to the "Region" (pixelrectangle) class
			const {
				xPaddingRatio = Ratio.Min,
				yPaddingRatio = Ratio.Min,
			} = params;

			let paddedRegion = region;
			if (xPaddingRatio.gt(Ratio.Min)) {
				if (xPaddingRatio.lt(Ratio.Max)) {
					paddedRegion = paddedRegion.trimX(Ratio.Clamp(1 - xPaddingRatio.value));
				}
			}
			if (yPaddingRatio.gt(Ratio.Min)) {
				if (yPaddingRatio.lt(Ratio.Max)) {
					paddedRegion = paddedRegion.trimY(Ratio.Clamp(1 - yPaddingRatio.value));
				}
			}

			if (children.length > 1) {
				throw new Error('todo: support any number of children');
			}

			const child = children[0] || null;
			drawUiElement(child, paddedRegion, canvasContext);
			return;
		}

		if (component === 'fixed-aspect-ratio') {
			const {
				longDimension = 'y',
				ratio = Ratio.Max,
			} = params;
			let fixedRatioRegion: PixelRectangle;
			if (longDimension === 'x') {
				const heightCorrectionFactor = ratio.value * region.widthPerHeight;
				if (heightCorrectionFactor > 1) {
					// too wide and short -- trim along x dimension
					fixedRatioRegion = region.trimX(Ratio.Clamp(1.0 / heightCorrectionFactor))
				} else {
					// too tall -- cut off bottom
					fixedRatioRegion = region.splitY(Ratio.Clamp(heightCorrectionFactor))[0];
				}
			} else {
				const widthCorrectionFactor = ratio.value * region.heightPerWidth;
				if (widthCorrectionFactor < 1) {
					// too wide -- trim along x dimension
					fixedRatioRegion = region.trimX(Ratio.Clamp(widthCorrectionFactor));
				} else {
					// too tall -- cut off bottom
					fixedRatioRegion = region.splitY(Ratio.Clamp(1.0 / widthCorrectionFactor))[0];
				}
			}
			
			if (children.length > 1) {
				throw new Error('todo: support any number of children');
			}

			const child = children[0] || null;

			drawUiElement(child, fixedRatioRegion, canvasContext);
			return;
		}

		if (component === 'text') {
			const {
				color = 'white',
			} = params;
			canvasContext.fillStyle = color;
			canvasContext.textAlign = 'center';
			canvasContext.textBaseline = 'middle';
			canvasContext.font = `${region.height.value}px 'Ubuntu Mono'`;
			if (children.length > 1) {
				throw new Error('todo: support any number of children');
			}
			const text: unknown = children[0] || '';
			if (typeof text !== 'string') {
				// This shouldn't happen
				throw new Error('invalid text child');
			}
			canvasContext.fillText(
				text,
				region.x.value + region.width.value / 2,
				region.y.value + region.height.value / 2,
				region.width.value,
			);
			return;
		}

		if (component === 'touchable') {
			
			return;
		}

		drawUiElement(component(params, ...children), region, canvasContext);
	}

	return function drawUiToCanvas(em: EcsEntityManagerInterface<UiElementEntity>) {
		// Scale Appropriately
		const dpr = window.devicePixelRatio || 1.0;
		canvas.style.width = `${window.innerWidth}px`;
		canvas.style.height = `${window.innerHeight}px`;
		canvas.width = Math.floor(dpr * window.innerWidth);
		canvas.height = Math.floor(dpr * window.innerHeight);
		canvasContext.scale(dpr, dpr);

		const drawArea =
			new PixelRectangle(
				NonNegativeInteger.Zero,
				NonNegativeInteger.Zero,
				PositiveInteger.From(window.innerWidth).orDie(),
				PositiveInteger.From(window.innerHeight).orDie(),
			);

		// Reset Canvas -- todo: optimize?
		drawUiElement(['fill', { color: 'black' }], drawArea, canvasContext);

		// Draw each element
		for (const { uiElement } of em.find(['uiElement'])) {
			drawUiElement(uiElement, drawArea, canvasContext);
		}
	}
}


// todo: make clickable
const Header: UiComponent<void> = () =>
	['fill', { color: '#333' },
		['pad', { yPaddingRatio: Ratio.Clamp(0.2) },
			['split', { ratio: Ratio.Clamp(2/3) },
				['text', { color: 'white' },
					'Green or Yellow?',
				],
				['text', { color: 'white' },
					'A Colorblindness Game/Experiment',
				],
			],
		],
	];

// function drawQuizScene(state: State, area: PixelRectangle) {
	
// 	if (!(state.scene instanceof QuizScene)) return;

// 	drawUiElement(
// 		[
// 			'split', {
// 				ratio: Ratio.Clamp(0.1),
// 				primaryChild: [ Header ],
// 				secondaryChild: [
// 					'split', {
// 						ratio: Ratio.Clamp(1 - 1/30),
// 						secondaryChild: [
// 							'fill', {
// 								color: 'black',
// 								child: [
// 									'text', {
// 										text: 'Hacked Together by Bitbender',
// 										color: 'white',
// 									}
// 								],
// 							},
// 						],
// 					}
// 				],
// 			}
// 		],
// 		area,
// 	);

// 	const [bodyArea] =
// 		area.splitVertical(Ratio.From(0.1).orDie())[1].splitVertical(Ratio.From(1-1/30).orDie());
	

// 	// Guarantee Aspect Ratio of Main Section
// 	const mainHeightWidthRatio = 1.5
// 	const mainContentArea =
// 		bodyArea.heightPerWidth < mainHeightWidthRatio
// 			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
// 			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

// 	const [squareArea, controlsArea] =
// 		mainContentArea
// 			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

// 	const grayByte = Math.floor(state.scene.contextLightness.value * 256).toString(16);
// 	const contextColor = '#' + [0,0,0].map(() => grayByte).join('');
// 	drawUiElement(['fill', {color: contextColor }], squareArea);
// 	const paddingRatio = Ratio.Clamp(0.9);
// 	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

// 	drawUiElement(['fill', {color: state.scene.quiz.currentColor }], colorSampleArea);
// 	if ((new URLSearchParams(location.search)).get('debug') === 'true') {
// 		drawText(colorSampleArea.trimY(Ratio.Clamp(.1)), state.scene.quiz.currentColor);
// 	}

// 	const [progressBarArea, buttonsArea] = controlsArea.splitVertical(Ratio.Clamp(0.1));

// 	const progressBar = progressBarArea.trimY(Ratio.Half).splitHorizontal(state.scene.quiz.progress)[0];
// 	drawUiElement(['fill', { color: 'white' }], progressBar);

// 	const [ selectionButtonsArea ] =
// 		buttonsArea.trimX(paddingRatio).trimY(paddingRatio)
// 			.splitVertical(Ratio.Half);

// 	const [unpaddedGreenButtonArea, unpaddedYellowButtonArea] =
// 		selectionButtonsArea.splitHorizontal(Ratio.Half);

// 	const greenButtonArea = unpaddedGreenButtonArea.trimRight(paddingRatio);
// 	const yellowButtonArea = unpaddedYellowButtonArea.trimLeft(paddingRatio);

// 	function registerColorSelection(answeredYellow: boolean) {
// 		return function onClick(state: State): State {
// 			// This line exists for type inference
// 			if (!(state.scene instanceof QuizScene)) return state;
// 			const answerOutput = state.scene.quiz.answer(answeredYellow);
// 			return {
// 				...state, 
// 				scene:
// 				(answerOutput instanceof QuizState)
// 					? state.scene.butQuiz(answerOutput)
// 					: ResultScene.Make({answers: answerOutput})
// 			};
// 		}
// 	}

// 	drawButton(greenButtonArea, 'Green!', registerColorSelection(false));
// 	drawButton(yellowButtonArea, 'Yellow!', registerColorSelection(true));
// }


const Footer: UiComponent<void> = () =>
	['fill', { color: 'black' },
		['text', { color: 'white' },
			'Hacked Together by Bitbender'
		]
	];

const Layout: UiComponent<void> =
	(_, body) =>
		['split', { ratio: Ratio.Clamp(0.1) },
			[Header, {}],
			['split', { ratio: Ratio.Clamp(1 - 1/30) },
				['fixed-aspect-ratio', { longDimension: 'y', ratio: Ratio.Clamp(2/3) },
					body,
				],
				[Footer, {}],
			],
		];

const Title: UiComponent<void> = () =>
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
					['pad', { xPaddingRatio: Ratio.Clamp(0.1), yPaddingRatio: Ratio.Clamp(0.3) },
						[Button, {},
							`${root*root} (${root}x${root})`,
						],
					]
				),
			],
		],
	];

// function drawResult(state: State, area: PixelRectangle) {
// 	if (!(state.scene instanceof ResultScene)) return;

// 	const [headerArea, nonHeaderArea] = area.splitVertical(Ratio.Clamp(0.1));
// 	drawUiElement([ Header ], headerArea);
// 	const [bodyArea, footerArea] =
// 		nonHeaderArea.splitVertical(Ratio.From(1-1/30).orDie());
// 	drawUiElement(['fill', { color: 'black' }], footerArea);
// 	drawText(footerArea, 'Hacked Together by Bitbender');

// 	// Guarantee Aspect Ratio of Main Section
// 	const mainHeightWidthRatio = 1.5
// 	const mainContentArea =
// 		bodyArea.heightPerWidth < mainHeightWidthRatio
// 			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
// 			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

// 	const [squareArea, controlsArea] =
// 		mainContentArea
// 			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

// 	const paddingRatio = Ratio.Clamp(0.9);
// 	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

// 	const blockWidth = Math.floor(colorSampleArea.width.value / state.scene.answers.rowCount.value);
// 	const blockHeight = Math.floor(colorSampleArea.height.value / state.scene.answers.columnCount.value);
	
// 	for (const [i, j, [color, answeredYellow]] of state.scene.answers) {
// 		const x = colorSampleArea.x.value + i.value * blockWidth;
// 		const y = colorSampleArea.y.value + Math.floor(j.value * colorSampleArea.height.value / state.scene.answers.columnCount.value);
// 		const area = new PixelRectangle(
// 			NonNegativeInteger.From(x).orDie(),
// 			NonNegativeInteger.From(y).orDie(),
// 			PositiveInteger.From(blockWidth).orDie(),
// 			PositiveInteger.From(blockHeight).orDie(),
// 		);
// 		drawUiElement([
// 			'fill', { color }
// 		], area);
// 		drawText(area, answeredYellow ? 'Y' : 'G', 'black');
// 	}

// 	canvasContext.strokeStyle = 'white';
// 	canvasContext.lineWidth = window.innerWidth / 100;
// 	canvasContext.lineCap = 'butt';
// 	canvasContext.beginPath()
// 	canvasContext.moveTo(window.innerWidth / 2, squareArea.y.value);
// 	canvasContext.lineTo(window.innerWidth / 2, squareArea.y.value + 1.25*squareArea.height.value);
// 	canvasContext.stroke();

// 	const [labelsArea, buttonArea] = controlsArea.splitVertical(Ratio.Clamp(1/6));
// 	const [greenLabel, yellowLabel] = labelsArea.splitHorizontal(Ratio.Half);
// 	drawText(greenLabel, '< Green', 'green');
// 	drawText(yellowLabel, 'Yellow >', 'yellow');

// 	drawButton(
// 		buttonArea.trimX(Ratio.Clamp(0.8)).trimY(Ratio.Clamp(0.6)),
// 		'<<< Restart!',
// 		state => ({ ...state, scene: TitleScene.Make() })
// 	);
// }

interface UiButtonParameters {
	readonly onClick?: () => void; // todo -- better
	readonly active?: boolean;
}

const Button: UiComponent<UiButtonParameters> = ({
	onClick = () => {},
	active = false,
}, ...children) => {
	// const isBeingPressed = clickable(area, onclick);
	// active = active || isBeingPressed;
	const [fillColor, textColor] = active ? ['white', 'black'] : ['black', 'white'];
	return (
		['fill', { color: 'white' },
			['pad', { xPaddingRatio: Ratio.Clamp(0.05), yPaddingRatio: Ratio.Clamp(0.2) },
				['fill', { color: fillColor},
					['pad', { yPaddingRatio: Ratio.Half },
						['text', { color: textColor },
							...children.filter( child => typeof child === 'string') as string[],
						],
					],
				],
			],
		]
	);
}

const uiEntity = entityManager.create({uiElement: [Title, {}]})