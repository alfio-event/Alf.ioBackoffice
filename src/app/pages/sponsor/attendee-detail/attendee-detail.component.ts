import { Component, OnInit, Injectable, OnDestroy, AfterViewInit } from '@angular/core';
import { SponsorScanService } from '~/app/shared/scan/sponsor-scan.service';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, filter, map } from 'rxjs/operators';
import { AccountService } from '~/app/shared/account/account.service';
import { empty, of } from 'rxjs';
import { SponsorScan } from '~/app/shared/scan/sponsor-scan';
import { Page } from 'tns-core-modules/ui/page/page';
import { RouterExtensions } from 'nativescript-angular/router';

@Component({
    moduleId: module.id,
    selector: "attendee-detail-component",
    templateUrl: "./attendee-detail.html",
})
export class AttendeeDetailComponent implements OnInit, AfterViewInit {

    isLoading = false;
    scan: SponsorScan;
    eventId: string;

    constructor(private sponsorScanService: SponsorScanService,
        private route: ActivatedRoute,
        private accountService: AccountService,
        private routerExtensions: RouterExtensions,
        private page: Page) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.pipe(mergeMap(params => {
            const accountId: string = params['accountId'];
            this.eventId = params['eventId'];
            const maybeAccount = this.accountService.findAccountById(accountId);
            if (maybeAccount.isPresent()) {
                return of(this.sponsorScanService.loadInitial(this.eventId).find(s => s.code === params['code']));
            }
            return empty();
        })).subscribe(scan => this.scan = scan, () => this.isLoading = false, () => this.isLoading = false);
    }

    ngAfterViewInit(): void {
        this.page.on("navigatingFrom", () => {
            if (this.scan != null) {
                this.sponsorScanService.update(this.eventId, this.scan);
            }
        });
    }

    get remainingChars(): Number {
        if (this.scan == null) {
            return 0;
        }
        return this.scan.notes != null ? this.scan.notes.length : 2000;
    }

    onBackTap() {
        this.routerExtensions.back();
    }

}