// Please just... don't look at the code, k?

import { NonNegativeInteger, PositiveInteger, Ratio } from "@bits.ts/all";
import { PixelRectangle } from "./PixelRectangle";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;


type ResultScene = {
	type: 'RESULT',
	//todo: more
};

type TitleScene = {
	type: 'TITLE',
};

function makeResultScene(): ResultScene {
	return {
		type: 'RESULT',
	};
}

// todo: pass samples
function makePickScene(): PickScene {
	return {
		type: 'PICK',
		color: {
			yellowGreenRatio: Ratio.Half,
			lightnessRatio: Ratio.Half,
		},
		contextColor: '#000',
	};
}

let state: State = {
	scene: {
		type: 'TITLE',
	},
	pointer: null,
};

draw();
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

type PickScene =
	Readonly<{
		type: 'PICK',
		color: {
			yellowGreenRatio: Ratio,
			lightnessRatio: Ratio,
		},
		contextColor: '#000' | '#555' | '#aaa' | '#fff';
	}>;


type Scene =
	TitleScene |
	PickScene |
	ResultScene;

type State =
	Readonly<{
		scene: Scene, // todo: more scenes
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
	fill(area, '#333');
	const paddedArea = area.trimY(Ratio.From(0.8).orDie());
	const titleSubtitleRatio = new Ratio(PositiveInteger.Two, PositiveInteger.One);
	const [titleArea, subtitleArea] = paddedArea.splitVertical(titleSubtitleRatio);
	drawText(titleArea, 'Green or Yellow?');
	drawText(subtitleArea, 'A Colorblindness Game/Experiment');
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

	const [squareArea, buttonsArea] =
		mainContentArea
			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

	fill(squareArea, state.scene.contextColor);
	const paddingRatio = Ratio.Clamp(0.9);
	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

	fill(colorSampleArea, buildHsl(state.scene.color.yellowGreenRatio, state.scene.color.lightnessRatio));

	const [selectionButtonsArea, nonSelectionButtonsArea] =
		buttonsArea.trimX(paddingRatio).trimY(paddingRatio)
			.splitVertical(Ratio.Clamp(0.5));

	const [unpaddedGreenButtonArea, unpaddedYellowButtonArea] =
		selectionButtonsArea.splitHorizontal(Ratio.Half);

	const greenButtonArea = unpaddedGreenButtonArea.trimRight(paddingRatio);
	const yellowButtonArea = unpaddedYellowButtonArea.trimLeft(paddingRatio);

	const registerColorSelection =
		(selection: 'green'|'yellow') => 
		(state: State) => ({
			...state,
			scene: {
				...state.scene,
				color: {
					yellowGreenRatio: Ratio.Clamp(Math.random()),
					lightnessRatio: Ratio.Clamp(Math.random()),
				}
			}
		})

	drawButton(greenButtonArea, 'Green!', registerColorSelection('green'));
	drawButton(yellowButtonArea, 'Yellow!', registerColorSelection('yellow'));

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
	const hue = 120 - 60 * yellowGreenRatio.value;
	const value = 100*lightnessRatio.value
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

	// todo explanation?
	// todo samples selection/slider?

	drawButton(
		mainContentArea,
		'>>>',
		(state: State) => ({
			...state,
			scene: makePickScene(),
		})
	);
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

	const [squareArea, buttonsArea] =
		mainContentArea
			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

	const paddingRatio = Ratio.Clamp(0.9);
	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

	for (let i = 0; i < colorSampleArea.width.value; i++) {
		const yellowGreenRatio = Ratio.Clamp(i / colorSampleArea.width.value);
		const x = i + colorSampleArea.x.value;
		for (let j = 0; j < colorSampleArea.height.value; j++) {
			const lightnessRatio = Ratio.Clamp(0.9 - .8 * j / colorSampleArea.height.value);
			const y = j + colorSampleArea.y.value;
			canvasContext.fillStyle = buildHsl(yellowGreenRatio, lightnessRatio);
			canvasContext.fillRect(x, y, 1, 1);
		}
	} 


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

function drawButton(
	area: PixelRectangle,
	text: string,
	onclick: (s: State) => State,
	active: boolean = false
) {
	if (state.pointer) {
		if (contains(area, state.pointer.start) && contains(area, state.pointer.end)) {
			if (state.pointer.down === false) {
				state = onclick({...state, pointer: null});
				throw new StateChangedMidDraw();
			}
			active = true;
		}
	}

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

