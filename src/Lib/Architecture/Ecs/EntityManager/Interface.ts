// export interface EcsEntityManagerInterface<T extends Record<string,unknown>> {
export interface EcsEntityManagerInterface<T> {
	create(entity: T): string;
	get(id: string): T|null;
	replace(id: string, newEntity: T): boolean;
	destroy(id: string): boolean;
	find<K extends keyof T>(componentNames: K[]): Iterable<{ id: string; } & Required<Pick<T, K>>>;
}