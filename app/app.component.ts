import {Component, OnInit} from "@angular/core";
const firebase = require("nativescript-plugin-firebase");

@Component({
    selector: "main",
    template: "<page-router-outlet></page-router-outlet>",
})
export class AppComponent implements OnInit {
    constructor() {
    }
    ngOnInit(): void {
        firebase.init({
          }).then(
            instance => {
              console.log("firebase.init done");
            },
            error => {
              console.log(`firebase.init error: ${error}`);
            }
        );
    }
}
