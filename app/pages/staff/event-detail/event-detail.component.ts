import { ChangeDetectorRef, Component, ElementRef, Inject, Injectable, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import { Observable } from "data/observable";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration, EventWithImage } from "../../../shared/account/account";

@Component({
    moduleId: module.id,
    selector: "staff-event-detail",
    providers: [AccountService],
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class StaffEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    
    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService) {
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    ngOnInit() {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.isLoading = false;
            });
        });
        
    }

    ngOnDestroy() {
        
    }
}