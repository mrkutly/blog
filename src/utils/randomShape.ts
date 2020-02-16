function randomPositive(): number {
  return Math.floor(Math.random() * 101);
}
function randomNegative(): number {
  return Math.floor(Math.random() * 99) * -1;
}

function randomNumber(): number {
  const opts = [randomPositive(), randomNegative()];
  return opts[Math.floor(Math.random() * 2)];
}

function overFifty(): number {
  return Math.floor(Math.random() * 51) + 50;
}

function underFifty(): number {
  return Math.floor(Math.random() * 51);
}

function aroundFifty(): number {
  return Math.floor(Math.random() * 31) + 35;
}


export default function randomShape(): string {
  return `polygon(${overFifty()}% ${overFifty()}%, ${underFifty()}% ${overFifty()}%, ${randomPositive()}% ${randomNumber()}%, ${randomPositive()}% ${randomNegative()}%)`;
}
