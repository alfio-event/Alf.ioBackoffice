import { Component, OnInit, NgZone, OnDestroy } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "@nativescript/angular";
import { Account, EventConfiguration, AccountType } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { isDefined, isUndefined } from "@nativescript/core/utils/types";
import { FeedbackService } from "../../shared/notification/feedback.service";
import { ListViewEventData } from "nativescript-ui-listview";
import { ObservableArray, Page } from "@nativescript/core";
import { OrientationService } from "~/app/shared/orientation.service";
import { Subscription } from "rxjs";


@Component({
    selector: "account-manage",
    providers: [AccountService],
    templateUrl: "./account-manage.html",
    styleUrls: ["./account-manage-common.scss"],
})
export class AccountManageComponent implements OnInit {
    account: Account;
    events: ObservableArray<EventConfiguration> = new ObservableArray<EventConfiguration>();
    isLoading: boolean;
    private orientationSubscription?: Subscription;

    constructor(private route: ActivatedRoute,
        private routerExtensions: RouterExtensions,
        private accountService: AccountService,
        private ngZone: NgZone,
        private feedbackService: FeedbackService,
        private orientationService: OrientationService,
        private page: Page) {

        }

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            console.log("AccountManageComponent accountId:", id);
            this.accountService.findAccountById(id).ifPresent((account: Account) => {
                let now = new Date();
                if (isUndefined(account.lastUpdate) || now.getTime() - account.lastUpdate.getTime() > 3600) {
                    this.reloadEvents(account, () => this.account = account);
                } else {
                    this.events.splice(0);
                    this.events.push(...this.account.configurations);
                    this.isLoading = false;
                }
            });
        });
        this.page.on('navigatingTo', () => {
            this.orientationSubscription = this.orientationService.orientationChange().subscribe(data => {
                console.log('Orientation changed', data);
                // orientation changed. Force re-rendering to avoid stale objects
                // on screen
                this.isLoading = true;
                setTimeout(() => this.isLoading = false);
            });
        });
        this.page.on('navigatingFrom', () => this.orientationSubscription?.unsubscribe());
    }

    private reloadEvents(account: Account, onCompleteOrError?: () => void): void {
        this.isLoading = true;
        this.accountService.loadEventsForAccount(account)
            .subscribe({
                next: events => {
                    this.accountService.updateEventsForAccount(account.getKey(), events);
                    this.events.splice(0);
                    this.events.push(...events);
                    this.isLoading = false;
                },
                error: () => {
                    console.log("error while loading events");
                    this.feedbackService.error('Error while refreshing events');
                    if (account != null && account.configurations != null) {
                        console.log("setting events from account");
                        this.ngZone.run(() => {
                            // remote server is not available. Let's initialize the list with the latest local version
                            this.events.splice(0);
                            this.events.push(...account.configurations);
                            this.isLoading = false;
                        });
                    }
                    if (isDefined(onCompleteOrError)) {
                        onCompleteOrError();
                    }
                },
                complete: onCompleteOrError
            });
    }

    hasEvents(): boolean {
        return this.events.length > 0;
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    select(args: ListViewEventData): void {
        let index = this.events.indexOf(args.object.bindingContext);
        let item = this.events.getItem(index);
        if (item.key != null) {
            let accountType = this.account.accountType === AccountType.STAFF ? "STAFF" : "SPONSOR";
            this.routerExtensions.navigate(['/event-detail/', this.account.getKey(), accountType, item.key]);
        }
    }

    onPullToRefreshInitiated(args: ListViewEventData) {
        this.reloadEvents(this.account, () => args.object.notifyPullToRefreshFinished());
    }

}