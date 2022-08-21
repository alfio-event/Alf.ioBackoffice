import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewContainerRef} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {DEVICE, ModalDialogOptions, ModalDialogService, RouterExtensions} from "@nativescript/angular";
import {EventData, ObservableArray, Page, SearchBar} from "@nativescript/core";
import {Account, EventConfiguration} from "~/app/shared/account/account";
import {AccountService} from "~/app/shared/account/account.service";
import {AttendeeSearchResult, AttendeeSearchResults} from "~/app/shared/scan/scan-common";
import {ScanService} from "~/app/shared/scan/scan.service";
import {SearchAttendeesResultComponent} from "./search-attendees-result.component";
import {Subscription} from "rxjs";
import {OrientationService} from "~/app/shared/orientation.service";
import {IDevice, Screen} from "@nativescript/core/platform";
import {FeedbackService} from "~/app/shared/notification/feedback.service";
import {ListViewLoadOnDemandMode, LoadOnDemandListViewEventData} from "nativescript-ui-listview";

@Component({
  moduleId: module.id,
  selector: "search-attendees",
  templateUrl: "./search-attendees.html",
  styleUrls: ["./search-attendees.scss"],
  providers: [ScanService, AccountService, ModalDialogService, FeedbackService]
})
export class SearchAttendeesComponent implements OnInit, OnDestroy {

  event: EventConfiguration;
  account: Account;

  searchPhrase: string = '';
  isLoading = false;
  searchComplete = false;

  results = new ObservableArray<AttendeeSearchResult>();
  loadOnDemandMode: ListViewLoadOnDemandMode = ListViewLoadOnDemandMode.None;

  selectedAttendee?: AttendeeSearchResult;

  @ViewChild("searchBar")
  searchBar?: ElementRef<SearchBar>;

  searchStats?: {
    totalResults: number,
    checkedIn: number,
    pending: number
  } = null;

  private latestSearch?: string;
  private orientationSubscription?: Subscription;
  private currentPage: number = 0;
  private currentOffset: number = 0;
  private totalPages: number = 0;

  constructor(private route: ActivatedRoute,
              private routerExtensions: RouterExtensions,
              private scanService: ScanService,
              private accountService: AccountService,
              private modalService: ModalDialogService,
              private vcRef: ViewContainerRef,
              private page: Page,
              private orientationService: OrientationService,
              private feedbackService: FeedbackService,
              @Inject(DEVICE) private device: IDevice) {
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

  loadNextPage(args: LoadOnDemandListViewEventData): void {
    console.log('loading next page...');
    const listView = args.object;
    this.performSearch(this.latestSearch, this.currentPage + 1, this.currentOffset, false,
      (res) => {
        const disableLoading = res.totalPages <= (res.numPage + 1);
        console.log('load complete. Notifying listView. Disable loading: ', disableLoading);
        listView.notifyLoadOnDemandFinished(disableLoading);
      });
  }

  ngOnDestroy(): void {
    this.orientationSubscription?.unsubscribe();
  }

  onSubmit(args: EventData): void {
    const searchBar = args.object as SearchBar;
    if (searchBar.text.length > 0) {
      this.performSearch(searchBar.text);
      searchBar.dismissSoftInput();
    }
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
    if (this.landscapeTablet) {
      this.selectedAttendee = attendee;
    } else {
      this.selectedAttendee = null;
      this.openDetailModal(attendee);
    }
  }

  uppercaseUuid(attendee: AttendeeSearchResult): string {
    return attendee.uuid.substring(0, 8).toUpperCase();
  }

  get resultsColumns(): string {
    if (this.landscapeTablet) {
      // tablet landscape. Enable extended layout
      return "2*, 3*";
    } else {
      return "*";
    }
  }

  get landscapeTablet(): boolean {
    return this.device.deviceType === 'Tablet'
      && Screen.mainScreen.widthPixels > Screen.mainScreen.heightPixels;
  }

  reloadSearch(): void {
    this.performSearch(this.latestSearch, this.currentPage, this.currentOffset, false);
  }

  private openDetailModal(attendee: AttendeeSearchResult): void {
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
    this.modalService.showModal(SearchAttendeesResultComponent, options)
      .then(() => {
        console.log('modal closed');
      });
  }

  private performSearch(query?: string,
                        page: number = 0,
                        offset: number = 0,
                        hideListDuringSearch: boolean = true,
                        completeCallback: (x: AttendeeSearchResults) => void = () => {}): void {
    if ((query?.length || 0) === 0) {
      console.log('skipping search. Query is empty');
      this.isLoading = false;
      return;
    }
    this.isLoading = hideListDuringSearch;
    this.scanService.search(this.event.key, this.account, query, page).subscribe(res => {
      this.latestSearch = query;
      const attendees = res.attendees;
      if (this.results.length > 0) {
        this.results.splice(offset, this.results.length, ...attendees);
      } else {
        this.results.push(...attendees);
      }
      this.currentPage = res.numPage;
      this.currentOffset += res.attendees.length;
      this.loadOnDemandMode = res.totalPages > 1 ? ListViewLoadOnDemandMode.Auto : ListViewLoadOnDemandMode.None;
      this.totalPages = res.totalPages;
      if (this.selectedAttendee != null) {
        const selectedId = this.selectedAttendee.uuid;
        const matches = attendees.filter(a => a.uuid === selectedId);
        this.selectedAttendee = matches.length > 0 ? matches[0] : null;
      }

      this.searchStats = {
        totalResults: res.totalResults,
        checkedIn: res.checkedIn,
        pending: res.totalResults - res.checkedIn
      };
      this.searchComplete = true;
      completeCallback(res);
      this.isLoading = false;
    });
  }
}
