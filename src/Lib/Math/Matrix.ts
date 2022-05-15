import { Fault, NonNegativeInteger, PositiveInteger, Result } from "@bits.ts/all";

export class Matrix<T> implements Iterable<[NonNegativeInteger, NonNegativeInteger, T]> {
	private constructor(
		private readonly state: Readonly<{
			elements: T[][];
		}>
	) { }

	public *[Symbol.iterator]() {
		for (let i = 0; this.rowCount.gt(i); i++) {
			for (let j = 0; this.columnCount.gt(j); j++) {
				yield [
					NonNegativeInteger.From(i).orDie(),
					NonNegativeInteger.From(j).orDie(),
					this.state.elements[i][j],
				] as [NonNegativeInteger, NonNegativeInteger, T];
			}
		}
	}

	public static Make<T>(params: {
		rowCount: PositiveInteger;
		columnCount: PositiveInteger;
		getElement: (index: {
			row: NonNegativeInteger;
			column: NonNegativeInteger;
		}) => T;
	}) {

		const rows: T[][] = [];
		for (let i = 0; params.rowCount.gt(i); i++) {
			const row: T[] = [];
			for (let j = 0; params.columnCount.gt(j); j++) {
				row.push(
					params.getElement({
						row: NonNegativeInteger.From(i).orDie(),
						column: NonNegativeInteger.From(j).orDie(),
					})
				);
			}
			rows.push(row);
		}

		return new Matrix<T>({
			elements: rows,
		});
	}

	public get rowCount() {
		return PositiveInteger.From(this.state.elements.length).orDie();
	}

	public get columnCount() {
		return PositiveInteger.From(this.state.elements[0].length).orDie();
	}

	public getElement(rowIndex: NonNegativeInteger, columnIndex: NonNegativeInteger) {
		const i = rowIndex.value;
		const j = columnIndex.value;

		const value = this.state.elements[i][j];

		if (value === void 0) {
			return Result.Failure(Fault.Root('Invaliid Matrix index pair', {
				rowIndex: i.toString(),
				columnIndex: j.toString(),
				rowCount: this.rowCount.value.toString(),
				columnCount: this.columnCount.value.toString(),
			}));
		}

		return Result.Success(value);
	}

	public butElement(
		rowIndex: NonNegativeInteger,
		columnIndex: NonNegativeInteger,
		newElement: T
	) {
		return new Matrix({
			...this.state,
			elements: this.state.elements.map((row, i) => row.map((oldElement, j) => rowIndex.eq(i) && columnIndex.eq(j)
				? newElement
				: oldElement
			)),
		});
	}
}
