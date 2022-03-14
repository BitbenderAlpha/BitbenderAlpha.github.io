// Please just... don't look at the code, k?

import { NonNegativeInteger, PositiveInteger, Ratio } from "@bits.ts/all";
import { PixelRectangle } from "./PixelRectangle";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;

type TitleScene = {
	type: 'TITLE',
};

type PickScene =
	Readonly<{
		type: 'PICK',
		root: number,
		sampleOrderPointer: number,
		sampleOrder: number[],
		answeredYellow: boolean[],
		contextColor: '#000' | '#555' | '#aaa' | '#fff';
	}>;

type ResultScene = {
	type: 'RESULT',
	root: number,
	answeredYellow: boolean[],
};

type Scene =
	TitleScene |
	PickScene |
	ResultScene;

type State =
	Readonly<{
		scene: Scene,
		pointer: null | {
			id: number,
			down: boolean,
			start: {
				x: number,
				y: number,
			},
			end: {
				x: number,
				y: number,
			},
		}
	}>;

function makeDefaultState(scene: Scene): State {
	return {
		pointer: null,
		scene,
	};
}

function makeTitleState() {
	return makeDefaultState({
		type: 'TITLE',
	});
}

function makeResultState(
	root: number,
	answeredYellow: boolean[],
) {
	return makeDefaultState({
		type: 'RESULT',
		root,
		answeredYellow,
	});
}

function makePickState(root: number) {
	const sampleOrder = Array.from({length: root*root}).map( (_,i) => i);
	sampleOrder.sort( (a,b) => Math.random() > 0.5 ? -1 : +1 );
	return makeDefaultState({
		type: 'PICK',
		root,
		sampleOrderPointer: 0,
		sampleOrder,
		answeredYellow: [],
		contextColor: '#000',
	});
}

let state: State = makeTitleState();

window.document.fonts.ready.then(draw);
window.addEventListener('resize', draw);
window.addEventListener('pointerdown', e => {
	if (state.pointer !== null) return;
	const {pointerId, x, y} = e;
	state = {
		...state,
		pointer: {
			id: pointerId,
			down: true,
			start: {x, y},
			end: {x, y},
		}
	}
	draw();
});
window.addEventListener('pointercancel', e => {
	if (state.pointer === null) return;
	if (state.pointer.id !== e.pointerId) return;
	state = { ...state, pointer: null};
	draw();
});
window.addEventListener('pointerup', e => {
	if (state.pointer === null) return;
	if (state.pointer.id !== e.pointerId) return;
	const {x, y} = e;
	state = {
		...state,
		pointer: {
			...state.pointer,
			down: false,
			end: {x, y},
		}
	}
	draw();
});

window.addEventListener('pointermove', e => {
	if (state.pointer === null) return;
	if (state.pointer.id !== e.pointerId) return;
	const {x, y} = e;
	state = {
		...state,
		pointer: {
			...state.pointer,
			end: {x, y},
		}
	}
	draw();
});
function draw() {
	try {
		// Scale Appropriately
		const dpr = window.devicePixelRatio || 1.0;
		canvas.style.width = `${window.innerWidth}px`;
		canvas.style.height = `${window.innerHeight}px`;
		canvas.width = Math.floor(dpr * window.innerWidth);
		canvas.height = Math.floor(dpr * window.innerHeight);
		canvasContext.scale(dpr, dpr);

		// Draw Background
		const drawArea =
			new PixelRectangle(
				NonNegativeInteger.Zero,
				NonNegativeInteger.Zero,
				PositiveInteger.From(window.innerWidth).orDie(),
				PositiveInteger.From(window.innerHeight).orDie(),
			);

		fill(drawArea, 'black');

		switch (state.scene.type) {
			case 'TITLE': drawTitle(state, drawArea); break;
			case 'PICK': drawPick(state, drawArea); break;
			case 'RESULT': drawResult(state, drawArea); break;
		}

		// Nothing consumed the "up", so clean it up
		if (state.pointer && state.pointer.down === false) {
			state = {
				...state,
				pointer: null,
			}
		}
	} catch (e) {
		if (e instanceof StateChangedMidDraw) {
			draw();
			return;
		}
		throw e;
	}
}


function fill(area: PixelRectangle, color: string) {
	canvasContext.fillStyle = color;
	canvasContext.fillRect(
		area.x.value,
		area.y.value,
		area.width.value,
		area.height.value
	);
}

// This is pretty straightforward and lazy
function drawText(area: PixelRectangle, text: string, color: string = 'white') {
	canvasContext.fillStyle = color;
	canvasContext.textAlign = 'center';
	canvasContext.textBaseline = 'middle';
	canvasContext.font = `${area.height.value}px 'Ubuntu Mono'`;
	canvasContext.fillText(
		text,
		area.x.value + area.width.value / 2,
		area.y.value + area.height.value / 2,
		area.width.value,
	);
}

function drawHeader(area: PixelRectangle) {
	clickable(area, () => makeTitleState());
	fill(area, '#333');
	const paddedArea = area.trimY(Ratio.From(0.8).orDie());
	const titleSubtitleRatio = new Ratio(PositiveInteger.Two, PositiveInteger.One);
	const [titleArea, subtitleArea] = paddedArea.splitVertical(titleSubtitleRatio);
	drawText(titleArea, 'Green or Yellow?');
	drawText(subtitleArea, 'A Colorblindness Game/Experiment');
}

function getYellownessLightnessRatios(index: number, root: number) {
	const lightnessIndex = index % root;
	const hueIndex = (index - lightnessIndex) / root;
	return [
		Ratio.Clamp((hueIndex + 0.5) / root),
		Ratio.Clamp((lightnessIndex + 0.5) / root),
	];
}

function sample(index: number, root: number) {
	const [yellowness, lightness] = getYellownessLightnessRatios(index, root);
	return buildHsl(yellowness, lightness);
}

function drawPick(state: State, area: PixelRectangle) {
	if (state.scene.type !== 'PICK') return;
	
	const [headerArea, nonHeaderArea] =
		area.splitVertical(Ratio.From(0.1).orDie());
	drawHeader(headerArea);
	const [bodyArea, footerArea] =
		nonHeaderArea.splitVertical(Ratio.From(1-1/30).orDie());
	fill(footerArea, 'black');
	drawText(footerArea, 'Hacked Together by Bitbender');

	// Guarantee Aspect Ratio of Main Section
	const mainHeightWidthRatio = 1.5
	const mainContentArea =
		bodyArea.heightPerWidth < mainHeightWidthRatio
			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

	const [squareArea, controlsArea] =
		mainContentArea
			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

	fill(squareArea, state.scene.contextColor);
	const paddingRatio = Ratio.Clamp(0.9);
	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

	const currentColorIndex = state.scene.sampleOrder[state.scene.sampleOrderPointer];
	fill(colorSampleArea, sample(currentColorIndex, state.scene.root));


	const [progressBarArea, buttonsArea] = controlsArea.splitVertical(Ratio.Clamp(0.1));


	const progressBar = progressBarArea.trimY(Ratio.Half).splitHorizontal(Ratio.Clamp(state.scene.sampleOrderPointer / state.scene.sampleOrder.length))[0];
	fill(progressBar, 'white');

	const [selectionButtonsArea, nonSelectionButtonsArea] =
		buttonsArea.trimX(paddingRatio).trimY(paddingRatio)
			.splitVertical(Ratio.Clamp(0.5));

	const [unpaddedGreenButtonArea, unpaddedYellowButtonArea] =
		selectionButtonsArea.splitHorizontal(Ratio.Half);

	const greenButtonArea = unpaddedGreenButtonArea.trimRight(paddingRatio);
	const yellowButtonArea = unpaddedYellowButtonArea.trimLeft(paddingRatio);

	function registerColorSelection(isYellow: boolean) {
		return function onClick(state: State): State {
			// This line exists for type inference
			if (state.scene.type !== 'PICK') return state;

			const answeredYellow = [...state.scene.answeredYellow];
			const index = state.scene.sampleOrder[state.scene.sampleOrderPointer];
			answeredYellow[index] = isYellow;

			const sampleOrderPointer = state.scene.sampleOrderPointer + 1;
			if (sampleOrderPointer >= state.scene.sampleOrder.length) {
				return makeResultState(state.scene.root, answeredYellow);
			}

			return {
				...state,
				scene: {
					...state.scene,
					answeredYellow,
					sampleOrderPointer,
				}
			}
		}
	}

	drawButton(greenButtonArea, 'Green!', registerColorSelection(false));
	drawButton(yellowButtonArea, 'Yellow!', registerColorSelection(true));

	const contextArea = inset(nonSelectionButtonsArea, Ratio.Clamp(0.9));
	const [contextTitleArea, contextButtonsArea] = contextArea.splitVertical(Ratio.Half);
	drawText(contextTitleArea, 'Select Context Color:');
	const [darkContexts, lightContexts] = contextButtonsArea.splitHorizontal(Ratio.Half);
	const [blackContext, darkGrayContext] = darkContexts.splitHorizontal(Ratio.Half);
	const [lightGrayContext, whiteContext] = lightContexts.splitHorizontal(Ratio.Half);

	const setContext =
		(color: PickScene['contextColor']) =>
		(state: State) => ({
			...state,
			scene: {
				...state.scene,
				contextColor: color,
			},
		});

	drawButton(blackContext, 'Black', setContext('#000'), state.scene.contextColor === '#000');
	drawButton(darkGrayContext, 'Dark Gray', setContext('#555'), state.scene.contextColor === '#555');
	drawButton(lightGrayContext, 'Light Gray', setContext('#aaa'), state.scene.contextColor === '#aaa');
	drawButton(whiteContext, 'White', setContext('#fff'), state.scene.contextColor === '#fff');
}

function buildHsl(yellowGreenRatio: Ratio, lightnessRatio: Ratio) {
	const hue = 135 - 90 * yellowGreenRatio.value;
	const value = 15 + 70 * lightnessRatio.value
	return `hsl(${hue},100%,${value}%)`
}

function drawTitle(state: State, area: PixelRectangle) {
	if (state.scene.type !== 'TITLE') return;
	
	const [headerArea, nonHeaderArea] =
		area.splitVertical(Ratio.From(0.1).orDie());
	drawHeader(headerArea);
	const [bodyArea, footerArea] =
		nonHeaderArea.splitVertical(Ratio.From(1-1/30).orDie());
	fill(footerArea, 'black');
	drawText(footerArea, 'Hacked Together by Bitbender');

	// Guarantee Aspect Ratio of Main Section
	const mainHeightWidthRatio = 1.5
	const mainContentArea =
		bodyArea.heightPerWidth < mainHeightWidthRatio
			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]


	const [titleArea, buttonArea] = mainContentArea.splitVertical(Ratio.Clamp(1/10));
	const textArea = titleArea.splitVertical(Ratio.Half)[1];

	drawText(textArea, 'How many samples?');

	const sampleRoots = [4, 6, 8, 10];
	let button: PixelRectangle;
	let remainingArea = buttonArea;
	sampleRoots.forEach( (root, i) => {
		const d = sampleRoots.length - i;
		if (d === 1) {
			button = remainingArea;
		} else {
			[button, remainingArea] = remainingArea.splitVertical(Ratio.Clamp(1/d));
		}

		const insetButtonArea = inset(button, Ratio.Clamp(0.9));
		const buttonText = `${root*root} (${root}x${root})`;
		drawButton(insetButtonArea, buttonText, () => makePickState(root));

	});
}

function drawResult(state: State, area: PixelRectangle) {
	if (state.scene.type !== 'RESULT') return;
	
	const [headerArea, nonHeaderArea] =
		area.splitVertical(Ratio.From(0.1).orDie());
	drawHeader(headerArea);
	const [bodyArea, footerArea] =
		nonHeaderArea.splitVertical(Ratio.From(1-1/30).orDie());
	fill(footerArea, 'black');
	drawText(footerArea, 'Hacked Together by Bitbender');

	// Guarantee Aspect Ratio of Main Section
	const mainHeightWidthRatio = 1.5
	const mainContentArea =
		bodyArea.heightPerWidth < mainHeightWidthRatio
			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

	const [squareArea, controlsArea] =
		mainContentArea
			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

	const paddingRatio = Ratio.Clamp(0.9);
	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

	const blockSize = Math.floor(colorSampleArea.width.value / state.scene.root);
	for (let i = 0; i < state.scene.root; i++) {
		const x = colorSampleArea.x.value + i * blockSize;
		for (let j = 0; j < state.scene.root; j++) {
			const y = colorSampleArea.y.value + j * blockSize;
			const k = i*state.scene.root+j;
			const area = new PixelRectangle(
				NonNegativeInteger.From(x).orDie(),
				NonNegativeInteger.From(y).orDie(),
				PositiveInteger.From(blockSize).orDie(),
				PositiveInteger.From(blockSize).orDie(),
			);

			fill(area, sample(k, state.scene.root));
			const answeredYellow = state.scene.answeredYellow[k] as boolean|undefined;
			const text =
				answeredYellow === void 0
					? '?'
					: answeredYellow
						? 'Y'
						: 'G';

			drawText(area, text, 'black');
		}
	}

	canvasContext.strokeStyle = 'white';
	canvasContext.lineWidth = window.innerWidth / 100;
	canvasContext.lineCap = 'butt';
	canvasContext.beginPath()
	canvasContext.moveTo(window.innerWidth / 2, squareArea.y.value);
	canvasContext.lineTo(window.innerWidth / 2, squareArea.y.value + 1.25*squareArea.height.value);
	canvasContext.stroke();

	const [labelsArea, buttonArea] = controlsArea.splitVertical(Ratio.Clamp(1/6));
	const [greenLabel, yellowLabel] = labelsArea.splitHorizontal(Ratio.Half);
	drawText(greenLabel, '< Green', 'green');
	drawText(yellowLabel, 'Yellow >', 'yellow');

	drawButton(inset(buttonArea, Ratio.Clamp(0.75)), '<<< Restart!', () => makeTitleState());


}
/// todo: move to rectangle?
function contains(area: PixelRectangle, point: {x:number, y:number}) {
	if (point.x < area.x.value) return false;
	if (point.y < area.y.value) return false;
	if (point.x > area.x.value + area.width.value) return false;
	if (point.y > area.y.value + area.height.value) return false;
	return true;
}

class StateChangedMidDraw {}

function clickable(
	area: PixelRectangle,
	onClick: (s: State) => State,
) {
	if (state.pointer) {
		if (contains(area, state.pointer.start) && contains(area, state.pointer.end)) {
			if (state.pointer.down === false) {
				state = onClick({...state, pointer: null});
				throw new StateChangedMidDraw();
			}
			return true;
		}
	}
	return false;
}

function drawButton(
	area: PixelRectangle,
	text: string,
	onclick: (s: State) => State,
	active: boolean = false,
) {
	const isBeingPressed = clickable(area, onclick);
	active = active || isBeingPressed;
	const [fillColor, textColor] = active ? ['white', 'black'] : ['black', 'white'];
	const buttonInsetRatio = Ratio.Clamp(0.95);
	fill(area, 'white');
	const backgroundArea = inset(area, buttonInsetRatio);
	fill(backgroundArea, fillColor);
	const textArea = backgroundArea.trimY(Ratio.Half);
	drawText(textArea, text, textColor);
}

function inset(area: PixelRectangle, widthRatio: Ratio) {
	return (
		area
			.trimX(widthRatio)
			.trimY(Ratio.Clamp(1 - (1-widthRatio.value) * area.widthPerHeight))
	);

	// 1-(1-rx*)*w/h
}

