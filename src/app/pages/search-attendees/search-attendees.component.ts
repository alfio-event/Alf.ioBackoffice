import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "@nativescript/angular";
import { EventData, SearchBar } from "@nativescript/core";

@Component({
    moduleId: module.id,
    selector: "search-attendees",
    templateUrl: "./search-attendees.html"
})
export class SearchAttendeesComponent implements OnInit {

    searchPhrase: string = '';

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions) {}

    ngOnInit(): void {
    }

    onSubmit(args: EventData): void {
        const searchBar = args.object as SearchBar;
        console.log(`text ${searchBar.text}`);
    }

    onTextChanged(args: EventData): void {
        const searchBar = args.object as SearchBar;
        console.log(`new value: ${searchBar.text}`);
    }

    onClear(args: EventData): void {
        const searchBar = args.object as SearchBar;
        console.log(`clear ${searchBar.text}`);
    }
}