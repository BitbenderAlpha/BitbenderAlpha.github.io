import { Integer, NonNegativeInteger, PositiveInteger, Ratio } from "@bits.ts/all";
import { getPermutedIndex } from "./Lib/Math/Permutation/getPermutedIndex";
import { findPrime } from "./Lib/Math/Primes/findPrime";
import { Matrix } from "./Lib/Math/Matrix";
import { isPrime } from "./Lib/Math/Primes/isPrime";

export class QuizState {

	private constructor(
		private readonly state: Readonly<{
			index: number;
			samplesPerSide: number;
			answeredYellow: (void | boolean)[];
			orderSeed: PositiveInteger;
		}>
	) { }

	public static Make(samplesPerSide: PositiveInteger) {
		const seed = PositiveInteger.From(Math.floor(Number.MAX_SAFE_INTEGER * Math.random())).orDie();
		return new QuizState({
			index: 0,
			samplesPerSide: samplesPerSide.value,
			answeredYellow: [],
			orderSeed: seed,
		});
	}

	// todo: return color instead
	public get currentColor() {
		return this.sample(this.currentSampleIndex.value);
	}

	public get sampleCount() {
		return this.state.samplesPerSide * this.state.samplesPerSide;
	}

	public get progress() {
		return Ratio.Clamp(this.state.index / this.sampleCount);
	}

	public answer(isYellow: boolean) {

		// Update Data
		const answeredYellow = [...this.state.answeredYellow];
		answeredYellow[this.currentSampleIndex.value] = isYellow;

		// Move Pointer
		const index = this.state.index + 1;

		// Are we done?
		if (index >= this.sampleCount) {
			// todo: Color would be better than string
			return Matrix.Make<[string, boolean | null]>({
				rowCount: PositiveInteger.From(this.state.samplesPerSide).orDie(),
				columnCount: PositiveInteger.From(this.state.samplesPerSide).orDie(),
				getElement: (index) => {
					const k = this.ij2k(index.row.value, index.column.value);
					return [
						this.sample(k),
						this.state.answeredYellow[k] || null,
					];
				}
			});

		}

		return new QuizState({ ...this.state, answeredYellow, index });
	}

	private get currentSampleIndex() {
		const samples = this.state.samplesPerSide * this.state.samplesPerSide;
		return getPermutedIndex({
			unshuffledIndex: NonNegativeInteger.From(this.state.index).orDie(),
			minIndex: NonNegativeInteger.Zero,
			maxIndex: NonNegativeInteger.From(samples - 1).orDie(),
			seed: this.state.orderSeed,
			findPrimeAtLeastAsBigAs: (value: Integer) => findPrime({ min: value, isPrime })
		});
	}

	private ij2k(i: number, j: number) {
		return j * this.state.samplesPerSide + i;
	}

	private sample(k: number) {
		const hueIndex = k % this.state.samplesPerSide;
		const lightnessIndex = (k - hueIndex) / this.state.samplesPerSide;
		const [yellowness, lightness] = [
			Ratio.Clamp((hueIndex + 0.5) / this.state.samplesPerSide),
			Ratio.Clamp((lightnessIndex + 0.5) / this.state.samplesPerSide),
		];
		const hue = Math.round(135 - 90 * yellowness.value);
		const value = Math.round(15 + 70 * lightness.value)
		return `hsl(${hue},100%,${value}%)`
	}

}