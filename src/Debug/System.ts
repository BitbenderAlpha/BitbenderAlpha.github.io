import { EcsEntityManagerInterface } from "../Lib/Architecture/Ecs/EntityManager/Interface"
import { TimeComponent } from "../Time/Component"

type Entity = Partial<{ readonly time: TimeComponent }>
type EntityManager = EcsEntityManagerInterface<Entity>;

export function makeDebugSystem({
	canvasContext,
	domWindow = window,
}: {
	canvasContext: CanvasRenderingContext2D,
	domWindow?: typeof window,
}) {
	return function updateDebugOverlay(em: EntityManager) {

		/**
		 * @todo -- move to 'Url System'
		 */
		// Only debug if ?debug=true in url
		const parsedUrlParams = new URLSearchParams(domWindow.location.search);
		if (parsedUrlParams.get('debug') !== 'true') return;
		
		for (const { time } of em.find(['time'])) {

			canvasContext.fillStyle = 'white';
			canvasContext.textAlign = 'left';
			canvasContext.textBaseline = 'top';
			canvasContext.font = `16px 'Ubuntu Mono'`;
			const text = `${time.fps.toFixed(3)}fps | ${(time.dt*1000).toFixed(0)}ms`;
			canvasContext.fillText(text, 0, 0);

			// There should only be one, but in any case we'll ignore extras
			break;
		}
	}
}