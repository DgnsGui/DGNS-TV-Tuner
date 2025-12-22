// RotatePrefab.js – Oscillation fluide infinie ±90° (boucle parfaite, sans saut)

// @input float oscillationSpeed = 30.0 {"widget":"slider", "min":10, "max":100, "step":5}
// @input float oscillationAngle = 90.0 {"widget":"slider", "min":30, "max":120, "step":5}
// @input string easingType = "easeInOutSine" {"widget":"combobox", "values":["easeInOutSine", "easeInOutQuad", "easeInOutCubic"]}

var transform = script.getSceneObject().getTransform();

var time = 0.0;

// Fonctions d'easing pour un mouvement très naturel
function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getEasingFunction(type) {
    if (type === "easeInOutQuad") return easeInOutQuad;
    if (type === "easeInOutCubic") return easeInOutCubic;
    return easeInOutSine; // Le plus doux et recommandé
}

var easingFunc = getEasingFunction(script.easingType);

function updateOscillation() {
    time += getDeltaTime();

    // Période d'un aller simple (on fait un cycle sinusoïdal complet pour un aller-retour fluide)
    var halfPeriod = 360.0 / script.oscillationSpeed; // Temps pour aller d'un côté à l'autre
    var fullPeriod = halfPeriod * 2; // Aller + retour

    // Phase normalisée entre 0 et 1 sur un cycle complet
    var phase = (time % fullPeriod) / fullPeriod;

    // Utilisation d'une courbe sinusoidale pure + easing pour un mouvement ultra fluide
    // Math.sin donne un parfait va-et-vient sans accroc
    var sineValue = Math.sin(phase * Math.PI * 2); // -1 à +1
    var eased = easingFunc((sineValue + 1) / 2);   // Remap -1..1 → 0..1 pour l'easing

    // Angle final : -oscillationAngle à +oscillationAngle
    var angleRad = eased * 2 - 1; // Remap 0..1 → -1..1
    angleRad *= (script.oscillationAngle * Math.PI / 180);

    // Application de la rotation sur l'axe Y
    var newRotation = quat.angleAxis(angleRad, vec3.up());
    transform.setLocalRotation(newRotation);
}

// Exécuté chaque frame
script.createEvent("UpdateEvent").bind(updateOscillation);