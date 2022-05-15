import {AbstractNumberable} from "@bits.ts/all"

export class Point2D<T extends number|AbstractNumberable> {

	public static Make<T extends number|AbstractNumberable>(params: {
		readonly x: T,
		readonly y: T,
	}) { 
		return new Point2D(params);
	}

	private constructor(
		private readonly state: {
			readonly x: T,
			readonly y: T,
		}
	) { }

	public get x() {
		return this.state.x;
	}

	public butX(x: T) {
		return new Point2D<T>({...this.state, x});
	}

	public get y() {
		return this.state.y;
	}

	public butY(y: T) {
		return new Point2D<T>({...this.state, y});
	}
}