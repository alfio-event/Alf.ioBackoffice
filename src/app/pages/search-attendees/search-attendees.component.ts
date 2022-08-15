import {Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { ModalDialogOptions, ModalDialogService, RouterExtensions } from "@nativescript/angular";
import {EventData, ObservableArray, Page, SearchBar} from "@nativescript/core";
import { Account, EventConfiguration } from "~/app/shared/account/account";
import { AccountService } from "~/app/shared/account/account.service";
import { AttendeeSearchResult } from "~/app/shared/scan/scan-common";
import { ScanService } from "~/app/shared/scan/scan.service";
import { SearchAttendeesResultComponent } from "./search-attendees-result.component";
import {Subscription} from "rxjs";
import {OrientationService} from "~/app/shared/orientation.service";

@Component({
    moduleId: module.id,
    selector: "search-attendees",
    templateUrl: "./search-attendees.html",
    providers: [ScanService, AccountService, ModalDialogService]
})
export class SearchAttendeesComponent implements OnInit, OnDestroy {

    event: EventConfiguration;
    account: Account;

    searchPhrase: string = '';
    isLoading = false;
    searchComplete = false;

    results = new ObservableArray<AttendeeSearchResult>();

    @ViewChild("searchBar")
    searchBar?: ElementRef<SearchBar>;

    private latestSearch?: string;
    private orientationSubscription?: Subscription;

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private scanService: ScanService,
                private accountService: AccountService,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef,
                private page: Page,
                private orientationService: OrientationService) {}

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
        this.page.on('navigatingTo', () => {
            if (this.orientationSubscription == null) {
                this.orientationSubscription = this.orientationService.orientationChange().subscribe(data => {
                    console.log('Orientation changed', data);
                    // orientation changed. Force re-rendering to avoid stale objects
                    // on screen
                    this.isLoading = true;
                    setTimeout(() => this.isLoading = false);
                });
            }
        });
        setTimeout(() => {
            this.searchBar?.nativeElement?.focus();
        });
    }

    ngOnDestroy(): void {
        this.orientationSubscription?.unsubscribe();
    }

    onSubmit(args: EventData): void {
        const searchBar = args.object as SearchBar;
        if (searchBar.text.length > 0) {
            this.performSearch(searchBar.text);
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
                attendee: attendee,
                event: this.event
            },
            fullscreen: false,
            cancelable: true
        };
        this.isLoading = true;
        this.modalService.showModal(SearchAttendeesResultComponent, options)
            .then(() => {
                this.performSearch(this.latestSearch);
            });
    }

    uppercaseUuid(attendee: AttendeeSearchResult): string {
        return attendee.uuid.substring(0, 8).toUpperCase();
    }

    private performSearch(query?: string): void {
        if ((query?.length || 0) === 0) {
            console.log('skipping search. Query is empty');
            this.isLoading = false;
            return;
        }
        this.isLoading = true;
        this.scanService.search(this.event.key, this.account, query).subscribe(res => {
            this.latestSearch = query;
            if (this.results.length > 0) {
                this.results.splice(0, this.results.length);
            }
            this.results.push(...res);
            this.searchComplete = true;
            this.isLoading = false;
        });
    }
}