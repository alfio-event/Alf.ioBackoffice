import { AccountSelectionComponent } from "./pages/account-selection/account-selection.component";
import { AccountManageComponent } from "./pages/account-manage/account-manage.component";
import { SponsorEventDetailComponent } from "./pages/sponsor/event-detail/event-detail.component";
import { StaffEventDetailComponent } from "./pages/staff/event-detail/event-detail.component";
import { AttendeeDetailComponent } from "./pages/sponsor/attendee-detail/attendee-detail.component";
import { SearchAttendeesComponent } from "./pages/search-attendees/search-attendees.component";


export const routes = [
  { path: "", component: AccountSelectionComponent },
  { path: "manage-account/:accountId", component: AccountManageComponent },
  { path: "event-detail/:accountId/SPONSOR/:eventId", component: SponsorEventDetailComponent },
  { path: "attendee-detail/:accountId/:eventId/:code", component: AttendeeDetailComponent },
  { path: "event-detail/:accountId/STAFF/:eventId", component: StaffEventDetailComponent },
  { path: "event-detail/:accountId/STAFF/:eventId/search", component: SearchAttendeesComponent }
];

export const navigatableComponents = [
  AccountSelectionComponent,
  AccountManageComponent,
  SponsorEventDetailComponent,
  StaffEventDetailComponent,
  AttendeeDetailComponent,
  SearchAttendeesComponent
];