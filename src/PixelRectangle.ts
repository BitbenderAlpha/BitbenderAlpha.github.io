import { NonNegativeInteger, PositiveInteger, Ratio } from "@bits.ts/all";

export class PixelRectangle {

	public constructor(
		public readonly x: NonNegativeInteger,
		public readonly y: NonNegativeInteger,
		public readonly width: PositiveInteger,
		public readonly height: PositiveInteger
	) { }

	public butX(x: NonNegativeInteger) {
		return new PixelRectangle(x, this.y, this.width, this.height);
	}

	public butY(y: NonNegativeInteger) {
		return new PixelRectangle(this.x, y, this.width, this.height);
	}

	public butWidth(width: PositiveInteger) {
		return new PixelRectangle(this.x, this.y, width, this.height);
	}

	public butHeight(height: PositiveInteger) {
		return new PixelRectangle(this.x, this.y, this.width, height);
	}

	public swapDimensions(): PixelRectangle {
		return new PixelRectangle(this.y, this.x, this.height, this.width);
	}

	public splitY(ratio: Ratio) {
		return this.splitVertical(ratio);
	}

	public splitX(ratio: Ratio) {
		return this.splitHorizontal(ratio);
	}

	public splitVertical(ratio: Ratio): [PixelRectangle, PixelRectangle] {
		// Can't split a single pixel!
		if (this.height.eq(PositiveInteger.One))
			return [this, this];

		// Two pixels -- each side gets one
		if (this.height.eq(PositiveInteger.Two)) {
			return [
				this.butHeight(PositiveInteger.One),
				this.butHeight(PositiveInteger.One).butY(this.y.inc()),
			];
		}

		/* For now, I'm going to say that the primary always owns the split pixel,
		 * but techically I could make this a bit smarter based on where the pixel
		 * is cut
		 */
		const primaryHeight = Math.min(this.height.value - 1, Math.ceil(this.height.value * ratio.value));
		const secondaryY = this.y.value + primaryHeight;
		const secondaryHeight = this.height.value - primaryHeight;

		return [
			this.butHeight(PositiveInteger.From(primaryHeight).orDie()),
			this.butY(NonNegativeInteger.From(secondaryY).orDie())
				.butHeight(PositiveInteger.From(secondaryHeight).orDie()),
		];
	}

	public splitHorizontal(ratio: Ratio): [PixelRectangle, PixelRectangle] {
		const [primary, secondary] = this.swapDimensions().splitVertical(ratio);
		return [
			primary.swapDimensions(),
			secondary.swapDimensions(),
		];
	}

	public trimX(remainingPortion: Ratio) {
		const trimSize = Math.floor((1 - remainingPortion.value) * this.width.value / 2);
		return (
			this.butX(NonNegativeInteger.From(this.x.value + trimSize).orDie())
				.butWidth(PositiveInteger.From(this.width.value - 2 * trimSize).orDie())
		);
	}

	public trimLeft(remainingPortion: Ratio) {
		const trimSize = Math.floor((1 - remainingPortion.value) * this.width.value);
		return (
			this.butX(NonNegativeInteger.From(this.x.value + trimSize).orDie())
				.butWidth(PositiveInteger.From(this.width.value - trimSize).orDie())
		);
	}
	
	public trimRight(remainingPortion: Ratio) {
		const trimSize = Math.floor((1 - remainingPortion.value) * this.width.value);
		return (
			this.butWidth(PositiveInteger.From(this.width.value - trimSize).orDie())
		);
	}

	public trimY(ratio: Ratio) {
		return this.swapDimensions().trimX(ratio).swapDimensions();
	}

	public get widthPerHeight() {
		return this.width.value / this.height.value;
	}

	public get heightPerWidth() {
		return this.swapDimensions().widthPerHeight;
	}
}
