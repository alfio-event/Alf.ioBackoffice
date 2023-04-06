import {Component, NgZone, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {RouterExtensions} from "@nativescript/angular";
import {Account, AccountType, EventConfiguration} from "../../shared/account/account";
import {AccountService} from "../../shared/account/account.service";
import {isDefined, isUndefined} from "@nativescript/core/utils/types";
import {FeedbackService} from "../../shared/notification/feedback.service";
import {ListViewEventData} from "nativescript-ui-listview";
import {isAndroid, ObservableArray, Page} from "@nativescript/core";
import {OrientationService} from "~/app/shared/orientation.service";
import {Subscription, zip} from "rxjs";
import {StorageService} from "~/app/shared/storage/storage.service";
import {getPendingEventDataForSponsor} from "~/app/shared/scan/sponsor-scan";
import {SponsorScanService} from "~/app/shared/scan/sponsor-scan.service";
import {logIfDevMode} from "~/app/utils/systemUtils";


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
    accountHasPendingDataForPastEvents: boolean = false;
    private orientationSubscription?: Subscription;

    constructor(private route: ActivatedRoute,
        private routerExtensions: RouterExtensions,
        private accountService: AccountService,
        private ngZone: NgZone,
        private feedbackService: FeedbackService,
        private orientationService: OrientationService,
        private page: Page,
        private storageService: StorageService,
        private sponsorScanService: SponsorScanService) {

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
        this.page.on('navigatingFrom', () => {
            this.orientationSubscription?.unsubscribe();
            this.orientationSubscription = null;
        });
    }

    private reloadEvents(account: Account, onCompleteOrError?: () => void): void {
        this.isLoading = true;
        this.loadEventsForAccount(account, onCompleteOrError);
    }

  private loadEventsForAccount(account: Account, onCompleteOrError: () => void) {
    this.accountService.loadEventsForAccount(account)
      .subscribe({
        next: events => {
          this.accountService.updateEventsForAccount(account.getKey(), events);
          this.detectPendingScans(account, events);
          logIfDevMode("account has pending data", this.accountHasPendingDataForPastEvents);
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

  private detectPendingScans(account: Account, events: { find(p): EventConfiguration }): void {
    this.accountHasPendingDataForPastEvents = getPendingEventDataForSponsor(account, this.storageService)
      .filter(k => events.find(ec => ec.key === k) == null)
      .length > 0;
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
          let accountType = this.account.accountType === AccountType.SPONSOR ? "SPONSOR" : "STAFF";
          this.routerExtensions.navigate(['/event-detail/', this.account.getKey(), accountType, item.key]);
      }
  }

  onPullToRefreshInitiated(args: ListViewEventData): void {
    this.loadEventsForAccount(this.account, () => args.object.notifyPullToRefreshFinished());
  }

  get rowsLayout(): string {
      if (this.accountHasPendingDataForPastEvents) {
        return "90, 16, *, auto"
      } else {
        return "auto, 16, *, auto"
      }
  }

  forcePushPendingScans(): void {
    this.isLoading = isAndroid;
    const observables = getPendingEventDataForSponsor(this.account, this.storageService)
      .map(key => this.sponsorScanService.forceProcessForPastEvent(key, this.account));

    zip(...observables).subscribe({
      next: (results: boolean[]) => {
        console.log("result", results);
        this.feedbackService.success("Upload Complete");
        this.detectPendingScans(this.account, this.events);
        this.isLoading = false;
      },
      complete: () => this.isLoading = false
    });
  }

}
