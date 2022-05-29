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
import { UiElement } from "./Lib/Ui/Element/Element";
import { Title } from "./Ui/Title";

interface Entity extends Record<string, unknown> {
	time?: TimeComponent;
	inputPointerEvent?: InputPointerEventComponent;
	uiElement?: UiElement;
}

const timeSystem = makeTimeSystem();
const entityManager = new InMemoryEcsEntityManager<Entity>();

const engine =
	new EcsEngine({
		entityManager,
		systems: [
			timeSystem.updateTimeEntity,
			makeInputPointerEventSystem(),
			makeCanvasUiDrawingSystem({ canvasDomId: 'canvas' }),
		],
});

function loop(ms: number, msp: number) {
	timeSystem.setTimeExternally(ms);
	engine.tick();
	requestAnimationFrame(tick => loop(tick, ms));
}

requestAnimationFrame(tp => requestAnimationFrame(t => loop(t, tp)));

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
				x = Ratio.Min,
				y = Ratio.Min,
			} = params;

			let paddedRegion = region;
			if (x.gt(Ratio.Min)) {
				if (x.lt(Ratio.Max)) {
					paddedRegion = paddedRegion.trimX(Ratio.Clamp(1 - x.value));
				}
			}
			if (y.gt(Ratio.Min)) {
				if (y.lt(Ratio.Max)) {
					paddedRegion = paddedRegion.trimY(Ratio.Clamp(1 - y.value));
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


const uiEntity = entityManager.create({uiElement: [Title, {}]})