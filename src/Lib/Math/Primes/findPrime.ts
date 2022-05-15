import { Integer } from "@bits.ts/all";

export function findPrime({
	min,
	isPrime,
}: {
	min: Integer,
	isPrime: (i: number) => boolean,
}) {
	const x = Number(min);
	if (x <= 2) return Integer.From(2).orDie();
	if (x === 3) return Integer.From(3).orDie();

	const r = x % 6;
	if (r === 0 && isPrime(x+1)) return Integer.From(x+1).orDie();
	if (r === 1 && isPrime(x)) return Integer.From(x).orDie();

	// i is a multiple of 6
	let i = (x - r);
	while (true) {
		i += 6;
		if (isPrime(i - 1)) return Integer.From(i - 1).orDie();
		if (isPrime(i + 1)) return Integer.From(i + 1).orDie();
	}
}