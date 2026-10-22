// Plain game logic, no React: easy to read and to test.

// Letters that look alike are kept apart so early rounds stay friendly.
const LOOKALIKES = ['BDPQ', 'MNW', 'ILJ', 'OCQ', 'UV', 'EF']

function shuffle(list) {
  const r = [...list]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

function looksAlike(a, b) {
  const A = a.toUpperCase()
  const B = b.toUpperCase()
  return LOOKALIKES.some((g) => g.includes(A) && g.includes(B))
}

// Returns a list of rounds: { target: 'M', options: ['S', 'M', 'A'] }
export function buildRounds(letters, { rounds = 10, choices = 3 } = {}) {
  let pool = shuffle(letters)
  while (pool.length < rounds) pool = pool.concat(shuffle(letters))

  return pool.slice(0, rounds).map((target) => {
    const others = letters.filter((l) => l !== target)
    const friendly = others.filter((l) => !looksAlike(l, target))
    const source = friendly.length >= choices - 1 ? friendly : others
    const wrong = shuffle(source).slice(0, choices - 1)
    return { target, options: shuffle([target, ...wrong]) }
  })
}
