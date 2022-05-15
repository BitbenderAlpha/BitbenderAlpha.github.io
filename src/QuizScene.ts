import { PositiveInteger, Ratio } from "@bits.ts/all";
import { QuizState } from "./QuizState";

export class QuizScene {
	private constructor(
		private readonly state: Readonly<{
			quiz: QuizState;
			contextLightness: Ratio;
		}>
	) { }

	public static Make(samplesPerSide: PositiveInteger) {
		return new QuizScene({
			quiz: QuizState.Make(samplesPerSide),
			contextLightness: Ratio.Half,
		});
	}

	public get quiz() {
		return this.state.quiz;
	}

	public butQuiz(quiz: QuizState) {
		return new QuizScene({ ...this.state, quiz });
	}

	public get contextLightness() {
		return this.state.contextLightness;
	}

	public butContextLightness(contextLightness: Ratio) {
		return new QuizScene({ ...this.state, contextLightness });
	}
}
