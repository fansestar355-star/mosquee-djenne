import * as THREE from 'three';

// Source unique de vérité pour les parties nommées de la mosquée.
// Les positions sont en coordonnées monde (le modèle est centré à l'origine).
// `focusTarget` = point sur lequel la caméra regarde lors du zoom.
// `cameraOffset` = décalage depuis focusTarget pour la position caméra.
// `hotspotPos` = position des sphères pulsantes.
export const MOSQUE_PARTS = [
  {
    id: 'facade-est',
    label: 'Façade Est',
    description: "La façade principale orientée vers l'est, percée de trois minarets aux œufs d'autruche symboliques. C'est ici que se déroule chaque année la cérémonie du crépissage.",
    focusTarget: new THREE.Vector3(0, 6, 8),
    cameraOffset: new THREE.Vector3(0, 4, 18),
    hotspotPos: new THREE.Vector3(0, 8, 8),
  },
  {
    id: 'minaret-central',
    label: 'Minaret Central',
    description: "Le minaret principal s'élève à plus de 16 mètres. Son sommet est couronné d'un œuf d'autruche, symbole de pureté et de fertilité.",
    focusTarget: new THREE.Vector3(0, 12, 6),
    cameraOffset: new THREE.Vector3(-10, 6, 14),
    hotspotPos: new THREE.Vector3(0, 14, 6),
  },
  {
    id: 'torons',
    label: 'Torons',
    description: "Les torons sont des poutres en bois de palmier rônier dépassant des murs. Ils servent d'échafaudage permanent pour les réparations annuelles en banco.",
    focusTarget: new THREE.Vector3(8, 5, 0),
    cameraOffset: new THREE.Vector3(20, 2, 4),
    hotspotPos: new THREE.Vector3(7, 5, 0),
  },
  {
    id: 'oeufs-autruche',
    label: "Œufs d'autruche",
    description: "Au sommet de chaque minaret se trouve un œuf d'autruche, symbole de fertilité et de pureté chez les Songhaïs et les Peulhs de Djenné.",
    focusTarget: new THREE.Vector3(0, 14, 6),
    cameraOffset: new THREE.Vector3(6, 12, 16),
    hotspotPos: new THREE.Vector3(0, 15, 6),
  },
  {
    id: 'mur-qibla',
    label: 'Mur de Qibla',
    description: "Le mur orienté vers La Mecque. À l'intérieur, le mihrab (niche) indique aux fidèles la direction de la prière.",
    focusTarget: new THREE.Vector3(0, 5, 8),
    cameraOffset: new THREE.Vector3(0, 6, 22),
    hotspotPos: new THREE.Vector3(0, 6, 7.8),
  },
  {
    id: 'banco',
    label: 'Le banco',
    description: "Le banco est un mélange traditionnel de terre, de paille et de beurre de karité. Chaque année, toute la communauté participe au crépissage pour entretenir la mosquée.",
    focusTarget: new THREE.Vector3(-8, 3, 2),
    cameraOffset: new THREE.Vector3(-22, 4, 8),
    hotspotPos: new THREE.Vector3(-8, 3, 2),
  },
];

// Position d'apparition à l'intérieur (juste derrière la porte d'entrée).
export const INTERIOR_SPAWN = new THREE.Vector3(0, 1.7, 4);
