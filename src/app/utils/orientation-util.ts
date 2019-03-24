var orientationModule = require("nativescript-orientation");

export function forcePortraitOrientation() {
    orientationModule.setOrientation("portrait");  
    orientationModule.disableRotation();
}

export function enableRotation() {
    orientationModule.enableRotation();
}