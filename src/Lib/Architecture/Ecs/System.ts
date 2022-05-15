import { EcsEntityManagerInterface } from "./EntityManager/Interface";

// export type EcsSystem<T extends Record<string,unknown>> =
export type EcsSystem<T> =
	(entityManager: EcsEntityManagerInterface<T>) =>
		void;