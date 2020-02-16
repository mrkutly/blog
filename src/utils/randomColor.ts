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

export default (function (): () => Color {
  let available = [...colors];

  return function randomColor(): Color {
    const chosen = available[Math.floor(Math.random() * available.length)];
    available = colors.filter(color => color !== chosen);
    return chosen;
  };
}());