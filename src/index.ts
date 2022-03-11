import { Ratio } from "@bits.ts/all";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;

let state: State = {
	type: 'PICK',
	color: {
		yellowGreenRatio: Ratio.Half,
		lightnessRatio: Ratio.Half,
	}
};

draw();
window.addEventListener('resize', draw);

function draw() {
	// Scale Appropriately
	const dpr = window.devicePixelRatio || 1.0;
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${window.innerHeight}px`;
	canvas.width = Math.floor(dpr * window.innerWidth);
	canvas.height = Math.floor(dpr * window.innerHeight);
	canvasContext.scale(dpr, dpr);

	// Draw Background
	canvasContext.fillStyle = `hsl(180,100%,1%,100%)`;
	canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

	switch (state.type) {
		case 'PICK': drawPick(state);
	}
}

type PickState = {
	type: 'PICK',
	color: {
		yellowGreenRatio: Ratio,
		lightnessRatio: Ratio,
	}
};

type State =
	PickState;

function drawPick(state: PickState) {
	// todo what if w > h?
	const w = window.innerWidth;
	const h = window.innerHeight;
	const headerHeight = 32;


	const mainContentHeight = 0.5 * h;
	const mainContentMargin = 0.1 * mainContentHeight;	
	const colorSquareSize = mainContentHeight - 2 * mainContentMargin;
	const colorSquareX = (w - mainContentHeight)/2 + mainContentMargin;
	const colorSquareY = headerHeight + mainContentMargin;
	canvasContext.fillStyle = `hsl(${120 - 60 * state.color.yellowGreenRatio.value},100%,${state.color.lightnessRatio.value*100}%)`;
	canvasContext.fillRect(
		colorSquareX,
		colorSquareY,
		colorSquareSize,
		colorSquareSize,
	);
}