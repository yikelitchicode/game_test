const gameCards = [...document.querySelectorAll('.game-card')];
const gamePanels = [...document.querySelectorAll('.game-panel')];

function setPanel(panelName) {
  gameCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.game === panelName);
  });

  gamePanels.forEach((panel) => {
    const isActive = panel.dataset.panel === panelName;
    panel.hidden = !isActive;
    panel.classList.toggle('active', isActive);
  });

}

gameCards.forEach((card) => {
  card.addEventListener('click', () => {
    setPanel(card.dataset.game);
  });
});

setPanel('game-1');

if (window.location.hash === '#game-2') {
  setPanel('game-2');
}
