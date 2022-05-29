
export interface UiEvent<N extends string, T> {
	readonly name: N;
	readonly payload: T;
}
