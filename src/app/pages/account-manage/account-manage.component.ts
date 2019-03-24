import { Component, OnInit, NgZone } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router"
import { Account, EventConfiguration, AccountType } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { isDefined, isUndefined } from "tns-core-modules/utils/types";
import { FeedbackService } from "~/app/shared/notification/feedback.service";

@Component({
    selector: "account-manage",
    providers: [AccountService],
    templateUrl: "./account-manage.html",
    styleUrls: ["./account-manage-common.css"],
})
export class AccountManageComponent implements OnInit {
    account: Account;
    events: Array<EventConfiguration>;
    isLoading: boolean;

    constructor(private route: ActivatedRoute,
        private routerExtensions: RouterExtensions,
        private accountService: AccountService,
        private ngZone: NgZone,
        private feedbackService: FeedbackService) {            
        }

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            console.log("AccountManageComponent accountId:", id);
            this.accountService.findAccountById(id).ifPresent((account: Account) => {
                let now = new Date();
                if(isUndefined(account.lastUpdate) || now.getTime() - account.lastUpdate.getTime() > 3600) {
                    this.internalReloadEvents(account, () => this.account = account);
                } else {
                    this.events = this.account.configurations;
                    this.isLoading = false;
                }
            });
        });
    }

    reloadEvents(): void {
        this.internalReloadEvents(this.account);
    }

    private internalReloadEvents(account: Account, onComplete?: () => void): void {
        this.isLoading = true;
        this.accountService.loadEventsForAccount(account)
            .subscribe(events => {
                this.accountService.updateEventsForAccount(account.getKey(), events);
                this.ngZone.run(() => {
                    this.events = events;
                    this.isLoading = false;
                });
            }, error => {
                this.ngZone.run(() => {
                    console.log("error while loading events", error);
                    this.events = account.configurations;
                    this.isLoading = false;
                    this.feedbackService.error('Error while refreshing events');
                });
            }, () => this.ngZone.run(() => {
                if(isDefined(onComplete)) {
                    onComplete();
                }
            }));
    }

    hasEvents(): boolean {
        return this.events.length > 0;
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    select(item: EventConfiguration): void {
        let accountType = this.account.accountType == AccountType.STAFF ? "STAFF" : "SPONSOR";
        this.routerExtensions.navigate(['/event-detail/', this.account.getKey(), accountType, item.key]);
    }

}