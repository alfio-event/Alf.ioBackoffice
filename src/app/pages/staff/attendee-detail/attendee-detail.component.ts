import {Component, EventEmitter, Inject, Input, OnInit, Output} from "@angular/core";
import {ScanService} from "~/app/shared/scan/scan.service";
import {FeedbackService} from "~/app/shared/notification/feedback.service";
import {Account, EventConfiguration} from "~/app/shared/account/account";
import {AttendeeSearchResult} from "~/app/shared/scan/scan-common";
import {HttpErrorResponse} from "@angular/common/http";
import {IDevice, platformNames, Screen} from "@nativescript/core/platform";
import {DEVICE} from "@nativescript/angular";

@Component({
  moduleId: module.id,
  selector: "attendee-detail",
  templateUrl: "./attendee-detail.html",
  styleUrls: ["./attendee-detail.scss"]
})
export class AttendeeDetailComponent implements OnInit {

  @Input()
  account: Account;

  @Input()
  attendee: AttendeeSearchResult;

  @Input()
  event: EventConfiguration;

  @Input()
  modal = false;

  @Output()
  updateComplete = new EventEmitter<boolean>();

  qrCodeUrl: string;

  additionalInfoAsList: Array<{key: string, values: string}> = [];
  additionalInfoColumns = "*, 3*, *";
  mainLayoutRows = "16, 80, *, 250, 100, 16";

  constructor(private scanService: ScanService,
              private feedbackService: FeedbackService,
              @Inject(DEVICE) private device: IDevice) {
  }

  ngOnInit(): void {
    this.qrCodeUrl = `${this.account.url}/api/v2/public/event/${this.event.key}/ticket/${this.attendee.uuid}/code.png`;
    this.additionalInfoAsList = Object.keys(this.attendee.additionalInfo)
      .map(key => ({key, values: this.attendee.additionalInfo[key].join(', ')}));
    if (Screen.mainScreen.widthPixels <= 640) {
      this.additionalInfoColumns = "16, *, 16";
      this.mainLayoutRows = "16, 80, *, 250, 40, 16";
    }
  }

  back(): void {
    this.updateComplete.next(true);
  }


  confirm(): void {
    if (this.checkedIn) {
      this.revertCheckIn();
    } else {
      this.performManualCheckIn();
    }
  }

  templateSelector(attendee: AttendeeSearchResult, index: number, items: any): string {
    return index % 2 === 0 ? 'even' : 'odd';
  }

  get confirmButtonText(): string {
    if (this.checkedIn) {
      return "Revert Check-in";
    } else if(this.toBePaid) {
      return "Set as PAID + Check-in";
    } else {
      return "Manual Check-in";
    }
  }

  get confirmButtonClass(): string {
    return this.checkedIn || this.toBePaid ? "-warning" : "-primary";
  }

  private get checkedIn(): boolean {
    return this.attendee.ticketStatus === 'CHECKED_IN';
  }

  private get toBePaid(): boolean {
    return this.attendee.ticketStatus === 'TO_BE_PAID';
  }

  private revertCheckIn(): void {
    console.log("Reverting check-in for ticket", this.attendee.uuid);
    this.scanService.revertCheckIn(this.event.key, this.account, this.attendee.uuid)
      .subscribe({
        next: res => {
          if (res) {
            this.feedbackService.success(`Check-in reverted for ${this.attendeeFullName}`);
            this.back();
          } else {
            // display error notification
            this.feedbackService.error(`Cannot revert check-in for ${this.attendeeFullName}`);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.feedbackService.error(`Got error: ${err.statusText}`);
        }
      });
  }

  private performManualCheckIn(): void {
    console.log("Performing manual check-in for ticket", this.attendee.uuid);
    this.scanService.manualCheckIn(this.event.key, this.account, this.attendee.uuid)
      .subscribe({
        next: res => {
          if (res) {
            this.feedbackService.success(`Check-in successful for ${this.attendeeFullName}`);
            this.back();
          } else {
            // display error notification
            this.feedbackService.error(`Error during check-in of ${this.attendeeFullName}`);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.feedbackService.error(`Got error: ${err.statusText}`);
        }
      });
  }

  get attendeeFullName(): string {
    return this.attendee.firstName + " " + this.attendee.lastName;
  }


}
