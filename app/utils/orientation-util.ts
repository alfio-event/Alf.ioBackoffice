var orientationModule = require("nativescript-screen-orientation");

export function forcePortraitOrientation() {
    orientationModule.setCurrentOrientation("portrait", function () {
        console.log("portrait orientation set");
    });
}