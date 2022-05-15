import { EcsEntityManagerInterface } from "../Lib/Architecture/Ecs/EntityManager/Interface";
import { TimeComponent } from "./Component";

type Entity = Partial<{ readonly time: TimeComponent }>;
type EntityMangager = EcsEntityManagerInterface<Entity>;

export function makeTimeSystem() {
	let lastFrameSeconds: number = 0;
	let thisFrameSeconds: number = 0;

	function setTimeExternally(t: DOMHighResTimeStamp) {
		lastFrameSeconds = thisFrameSeconds;
		thisFrameSeconds = t / 1000;
	}
	
	function updateTimeEntity(em: EntityMangager) {
		const timeEntity = {
			time: TimeComponent.Make({
				lastFrameSeconds,
				thisFrameSeconds,
			}),
		}

		let count = 0;
		for (const { id } of em.find(['time'])) {
			count++;
			if (count === 1) {
				em.replace(id, timeEntity);
			} else {
				// Exactly one time entity;
				em.destroy(id);
			}
		}

		if (count === 0) {
			em.create(timeEntity);
		}
	}

	return {
		setTimeExternally,
		updateTimeEntity,
	};
}