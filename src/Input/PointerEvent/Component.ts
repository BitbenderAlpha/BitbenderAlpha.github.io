import { NonNegativeInteger } from "@bits.ts/all";
import { Point2D } from "../../Lib/Math/Point2D";
import { PointerMotion } from "./PointerMotion";

export class InputPointerEventComponent {
	
	public static Make(
		params: {
			readonly motion: PointerMotion,
			readonly position: Point2D<NonNegativeInteger>
		}
	) {
		return new InputPointerEventComponent(params);
	}

	private constructor(
		private readonly state: {
			readonly motion: PointerMotion,
			readonly position: Point2D<NonNegativeInteger>,
		}
	) { };

	public get motion() {
		return this.state.motion;
	}

	public get position() {
		return this.state.position;
	}
	
}