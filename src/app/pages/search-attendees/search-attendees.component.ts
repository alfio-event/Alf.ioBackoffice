import { Component, Input, OnInit, ViewContainerRef } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { ModalDialogOptions, ModalDialogService, RouterExtensions } from "@nativescript/angular";
import { EventData, ObservableArray, SearchBar } from "@nativescript/core";
import { Account, EventConfiguration } from "~/app/shared/account/account";
import { AccountService } from "~/app/shared/account/account.service";
import { AttendeeSearchResult } from "~/app/shared/scan/scan-common";
import { ScanService } from "~/app/shared/scan/scan.service";
import { SearchAttendeesResultComponent } from "./search-attendees-result.component";

@Component({
    moduleId: module.id,
    selector: "search-attendees",
    templateUrl: "./search-attendees.html",
    providers: [ScanService, AccountService, ModalDialogService]
})
export class SearchAttendeesComponent implements OnInit {

    event: EventConfiguration;
    account: Account;

    searchPhrase: string = '';
    isLoading = false;

    results = new ObservableArray<AttendeeSearchResult>();

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private scanService: ScanService,
                private accountService: AccountService,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef) {
                }

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.subscribe((params: Params) => {
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                // this.actionBarTitle = this.event.name;
                this.isLoading = false;
            });
        });
    }

    onSubmit(args: EventData): void {
        const searchBar = args.object as SearchBar;
        if (searchBar.text.length > 0) {
            this.isLoading = true;
            this.scanService.search(this.event.key, this.account, searchBar.text).subscribe(res => {
                if (this.results.length > 0) {
                    this.results.splice(0, this.results.length);
                }
                this.results.push(...res);
                this.isLoading = false;
            });
        }
    }

    onTextChanged(args: EventData): void {
        // const searchBar = args.object as SearchBar;
        // console.log(`new value: ${searchBar.text}`);
    }

    onClear(args: EventData): void {
        // const searchBar = args.object as SearchBar;
        // console.log(`clear ${searchBar.text}`);
    }

    onBackTap(): void {
        this.routerExtensions.back();
    }

    attendeeStatusIcon(attendee: AttendeeSearchResult): string {
        if (attendee.ticketStatus === 'CHECKED_IN') {
            return String.fromCharCode(0xf26b);
        } else if (attendee.ticketStatus === 'TO_BE_PAID') {
            return String.fromCharCode(0xf19a);
        }
        return String.fromCharCode(0xf207);
    }

    select(attendee: AttendeeSearchResult): void {
        const options: ModalDialogOptions = {
            viewContainerRef: this.vcRef,
            context: {
                account: this.account,
                attendee: attendee
            },
            fullscreen: false,
            cancelable: true
        };
        this.modalService.showModal(SearchAttendeesResultComponent, options)
            .then(() => console.log('modal closed'));
    }
}