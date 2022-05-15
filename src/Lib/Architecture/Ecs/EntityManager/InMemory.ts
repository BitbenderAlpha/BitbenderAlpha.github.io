import { EcsEntityManagerInterface } from "./Interface";

/**
 * This class contains internal mutation!
 *
 * (Ideally it should be the only one)
 */
// export class InMemoryEcsEntityManager<T extends Record<string, unknown>> implements EcsEntityManagerInterface<T> {
export class InMemoryEcsEntityManager<T> implements EcsEntityManagerInterface<T> {

	private readonly singletonAliases: Record<string, string> = {};

	private nextEntityId: number = 0;

	private readonly entitiesById: Record<string, T | void> = {};

	public create(entity: T) {
		const id = String(this.nextEntityId++);
		this.entitiesById[id] = entity;
		return id;
	}

	public get(id: string): T|null {
		const entity = this.entitiesById[id];
		return entity === void 0 ? null : entity;
	}

	public replace(id: string, newEntity: T): boolean {
		const oldEntity = this.entitiesById[id];
		// Prevent this method from being used for creation or mutative/redundant updates
		if (oldEntity === void 0 || oldEntity === newEntity) {
			return false;
		}
		this.entitiesById[id] = newEntity;
		return true;
	}

	public destroy(id: string) {
		const entity = this.entitiesById[id];
		if (entity === void 0)
			return false;
		delete this.entitiesById[id];
		return true;
	}

	private pickComponents<K extends keyof T>(entity: T, componentNames: K[]): Required<Pick<T, K>> | null {
		const pick: Partial<Required<Pick<T, K>>> = {};
		for (const name of componentNames) {
			if (entity[name] === void 0)
				return null;
			pick[name] = entity[name];
		}
		return pick as Required<Pick<T, K>>;
	}

	public *find<K extends keyof T>(componentNames: K[]): Iterable<{ id: string; } & Required<Pick<T, K>>> {
		for (const [id, entity] of Object.entries(this.entitiesById)) {
			if (entity === void 0)
				continue;
			const pickedEntity = this.pickComponents(entity, componentNames);
			if (pickedEntity === null)
				continue;
			yield { id, ...pickedEntity };
		}
	}
}
