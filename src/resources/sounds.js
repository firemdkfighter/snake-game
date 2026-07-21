const sounds = {
  eat: new Audio('/sounds/eat.wav'),
  bite: new Audio('/sounds/bite.wav'),
  pause: new Audio('/sounds/pause.wav'),
  gameOver: new Audio('/sounds/gameover.wav')
};

sounds.eat.loop = true;
sounds.bite.loop = false;
sounds.pause.loop = false;
sounds.gameOver.loop = false;

export default sounds;