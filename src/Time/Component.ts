
export class TimeComponent {

	public static Make(
		params: {
			readonly lastFrameSeconds: number,
			readonly thisFrameSeconds: number,
		}
	) { 
		return new TimeComponent(params);
	}

	private constructor(
		private readonly state: {
			readonly lastFrameSeconds: number,
			readonly thisFrameSeconds: number,
		}
	) { }

	public get dt() {
		return this.state.thisFrameSeconds - this.state.lastFrameSeconds;
	}

	public get t() {
		return this.state.thisFrameSeconds;
	}

	public get fps() {
		return 1.0 / this.dt;
	}

}