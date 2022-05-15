export function isPrime(x: number) {
	if (isNaN(x)) return false;
	if (!isFinite(x)) return false;
	if (x < 4) return x > 1;
	if (x % 2 === 0) return false;
	if (x % 3 === 0) return false;
	for (let i = 6; i * i <= x; i += 6) {
		if (x % (i - 1) === 0) return false;
		if (x % (i + 1) === 0) return false;
	}
	return true;
}