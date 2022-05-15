import { EcsEntityManagerInterface } from "./EntityManager/Interface";
import { EcsSystem } from "./System";

export class EcsEngine<T extends Record<string, unknown>> {
	public constructor(
		private readonly params: {
			readonly entityManager: EcsEntityManagerInterface<T>,
			readonly systems: EcsSystem<T>[],
		}
	) { }

	public tick() {
		for (const update of this.params.systems) {
			update(this.params.entityManager);
		}
	}
}