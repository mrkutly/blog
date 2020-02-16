enum Color {
  pink = 'var(--pink)',
  lilac = 'var(--lilac)',
  mint = 'var(--mint)',
  peach = 'var(--peach)',
  sky = 'var(--sky)',
}

const colors = [
  Color.pink,
  Color.lilac,
  Color.mint,
  Color.peach,
  Color.sky,
];

export default function randomColor(): Color {
  return colors[Math.floor(Math.random() * 5)];
}