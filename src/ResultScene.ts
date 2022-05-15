import { Matrix } from "./Lib/Math/Matrix";

export class ResultScene {
	private constructor(
		private readonly state: {
			answers: Matrix<[string, null | boolean]>;
		}
	) { }

	public static Make(
		params: {
			answers: Matrix<[string, null | boolean]>;
		}
	) {
		return new ResultScene(params);
	}

	public get answers() {
		return this.state.answers;
	}
}
