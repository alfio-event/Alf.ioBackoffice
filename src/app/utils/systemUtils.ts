import {isDevMode} from "@angular/core";

export function logIfDevMode(...data: any[]): void {
  if (isDevMode()) {
    console.log(...data);
  }
}

export function appBarClassName(): string {
    return '';
}
