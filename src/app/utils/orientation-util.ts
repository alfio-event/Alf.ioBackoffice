import {setCurrentOrientation , orientationCleanup} from 'nativescript-screen-orientation';

export function forcePortraitOrientation() {
    setCurrentOrientation('portrait', () => console.log('set to portrait'));
}

export function enableRotation() {
    orientationCleanup();
}