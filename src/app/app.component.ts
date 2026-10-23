import {ChangeDetectionStrategy, Component} from "@angular/core";

@Component({
    selector: "main",
    template: "<page-router-outlet></page-router-outlet>",
    standalone: false,
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppComponent {
    constructor() {
    }
}
