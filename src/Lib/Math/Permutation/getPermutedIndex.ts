import { NonNegativeInteger, PositiveInteger, Integer } from "@bits.ts/all";

/**
 * Statelessly and consistently perform index permutation
 */
export function getPermutedIndex({
	unshuffledIndex,
	minIndex = NonNegativeInteger.Zero,
	maxIndex,
	seed,
	findPrimeAtLeastAsBigAs,
}: {
	unshuffledIndex: NonNegativeInteger,
	minIndex: NonNegativeInteger,
	maxIndex: NonNegativeInteger,
	seed: PositiveInteger,
	findPrimeAtLeastAsBigAs: (i: Integer) => Integer,
}) {
	const offset = Math.min(minIndex.value, maxIndex.value);
	const n = Math.abs(minIndex.value - maxIndex.value) + 1;
	const p = findPrimeAtLeastAsBigAs(Integer.From(n).orDie()).value;
	const m = (seed.value % (p-1)) + 1;
	const b = Math.floor(seed.value / (p-1)) % p;
	let i = unshuffledIndex.value - offset;
	do i = (m * i + b) % p; while (i >= n);
	return NonNegativeInteger.From(i + offset).orDie();
}