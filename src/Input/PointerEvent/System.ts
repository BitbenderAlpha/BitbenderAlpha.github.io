import { NonNegativeInteger } from "@bits.ts/all";
import { EcsEntityManagerInterface } from "../../Lib/Architecture/Ecs/EntityManager/Interface";
import { EcsSystem } from "../../Lib/Architecture/Ecs/System";
import { Point2D } from "../../Lib/Math/Point2D";
import { InputPointerEventComponent } from "./Component";
import { PointerMotion } from "./PointerMotion";

/**
 * This system essentially takes async pointer events and ensures that there are
 * at most one active pointer at a time and at most one pointer event per tick
 */

type Entity = Partial<{ readonly inputPointerEvent: InputPointerEventComponent }>;
type EntityManager = EcsEntityManagerInterface<Entity>;
type System = EcsSystem<Entity>;

export function makeInputPointerEventSystem(
	{
		domWindow = window,
	}: {
		readonly domWindow?: typeof window,
	} = {}
): System {

	const eventBuffer: PointerEvent[] = [];

	let activePointerId: number|null = null;

	/**
	 * @todo: I should eventually remove the 'window' reference and replace it with a
	 * 'pointer event stream' or something like that.
	 */
	domWindow.addEventListener('pointerdown', e => {
		if (activePointerId !== null) return; // ignore
		activePointerId = e.pointerId;
		eventBuffer.push(e)
	});

	domWindow.addEventListener('pointermove', e => {
		if (e.pointerId !== activePointerId) return; // ignore
		eventBuffer.push(e);
	});

	domWindow.addEventListener('pointerup', e => {
		if (e.pointerId !== activePointerId) return; // ignore
		activePointerId = null;
		eventBuffer.push(e);
	});

	domWindow.addEventListener('pointercancel', e => {
		if (e.pointerId !== activePointerId) return; // ignore
		activePointerId = null;
		eventBuffer.push(e);
	});

	return function updateInputPointerEvent(em: EntityManager) {
		// Destroy events from the last frame
		for (const { id } of em.find(['inputPointerEvent'])) {
			em.destroy(id);
		}

		// Activate the next event, if any
		const nextEvent = eventBuffer.shift();
		if (nextEvent === void 0) return;

		em.create({
			inputPointerEvent: InputPointerEventComponent.Make({
				motion: nextEvent.type as PointerMotion,
				position: Point2D.Make({
					x: NonNegativeInteger.From(Math.round(nextEvent.x)).orDie(),
					y: NonNegativeInteger.From(Math.round(nextEvent.y)).orDie(),
				}),
			}),
		});

	}
}