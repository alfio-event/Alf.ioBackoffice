import { SwipeGestureEventData, SwipeDirection } from "ui/gestures";
import { Component, ElementRef, OnInit, ViewChild, NgZone } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router"
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";

import { Account, EventConfiguration, EventConfigurationSelection, AccountType } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { ImageService } from "../../shared/image/image.service";
import * as Toast from 'nativescript-toast';

@Component({
    selector: "account-manage",
    providers: [AccountService],
    templateUrl: "pages/account-manage/account-manage.html",
    styleUrls: ["pages/account-manage/account-manage-common.css"],
})
export class AccountManageComponent implements OnInit {
    account: Account;
    events: Array<EventConfigurationSelection>;
    isLoading: boolean;

    constructor(private route: ActivatedRoute,
        private routerExtensions: RouterExtensions,
        private accountService: AccountService,
        private ngZone: NgZone) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            console.log("AccountManageComponent accountId:", id);
            this.accountService.findAccountById(id).ifPresent(account => {
                console.log("account found")
                this.account = account;
                this.events = this.account.configurations.map(e => new EventConfigurationSelection(e, true));
                this.isLoading = false;
            });
        });
    }

    reloadEvents(): void {
        this.isLoading = true;
        this.accountService.loadEventsForAccount(this.account)
            .subscribe(events => {
                this.ngZone.run(() => {
                    this.events = events.map(e => new EventConfigurationSelection(e, this.account.containsEvent(e.key)));
                    this.isLoading = false;
                });
            }, error => {
                this.ngZone.run(() => {
                    console.log("error while loading events", error);
                    this.isLoading = false;
                    Toast.makeText("Error while refreshing events").show();
                });
            });
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