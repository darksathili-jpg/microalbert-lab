/**
 * Moteur de déplacement isolé pour le futur parcours « Missions d'Albert ».
 * Ne lance aucun code Python : le futur interpréteur sera isolé dans un Web Worker.
 * Coordonnées : origine en haut à gauche ; x vers la droite, y vers le bas.
 * Statut : prototype technique, non validé pédagogiquement.
 */
export const MISSION_DECOUVERTE = Object.freeze({
  largeur: 4, hauteur: 3,
  depart: Object.freeze({ x: 0, y: 2, direction: 'est' }),
  objectif: Object.freeze({ x: 2, y: 1 }),
  obstacles: Object.freeze([{ x: 1, y: 1 }]),
  limiteInstructions: 20,
});
const directions = ['nord', 'est', 'sud', 'ouest'];
const vecteurs = { nord: [0, -1], est: [1, 0], sud: [0, 1], ouest: [-1, 0] };

/** Les commandes sont des données validées, jamais du code exécuté par eval. */
export function executerMission(mission, commandes) {
  let position = { ...mission.depart };
  const trace = [{ ...position }];
  const terminer = (erreur = null) => ({
    position: { ...position },
    trace,
    reussite: erreur === null && position.x === mission.objectif.x && position.y === mission.objectif.y,
    erreur,
  });
  if (!Array.isArray(commandes) || !Number.isInteger(mission.limiteInstructions)
      || mission.limiteInstructions < 1 || commandes.length > mission.limiteInstructions) {
    return terminer('Nombre d’instructions invalide ou limite dépassée.');
  }
  for (const commande of commandes) {
    if (commande === 'tourner_gauche' || commande === 'tourner_droite') {
      const index = directions.indexOf(position.direction);
      if (index < 0) return terminer('Orientation inconnue.');
      position = { ...position, direction: directions[(index + (commande === 'tourner_gauche' ? 3 : 1)) % 4] };
    } else if (commande === 'avancer') {
      const v = vecteurs[position.direction];
      if (!v) return terminer('Orientation inconnue.');
      const x = position.x + v[0], y = position.y + v[1];
      if (x < 0 || y < 0 || x >= mission.largeur || y >= mission.hauteur
          || mission.obstacles.some(o => o.x === x && o.y === y)) {
        return terminer('Obstacle ou limite de la grille.');
      }
      position = { ...position, x, y };
    } else {
      return terminer('Commande inconnue.');
    }
    trace.push({ ...position });
  }
  return terminer();
}
