import {Component} from "@angular/core";

@Component({
    selector: "main",
    template: "<page-router-outlet></page-router-outlet>",
    standalone: false,
})
export class AppComponent {
    constructor() {
    }
}
