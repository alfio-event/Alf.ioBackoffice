import { AccountSelectionComponent } from "./pages/account-selection/account-selection.component";
import { AccountManageComponent } from "./pages/account-manage/account-manage.component";
import { SponsorEventDetailComponent } from "./pages/sponsor/event-detail/event-detail.component"
import { StaffEventDetailComponent } from "./pages/staff/event-detail/event-detail.component"


export const routes = [
  { path: "", component: AccountSelectionComponent },
  { path: "manage-account/:accountId", component: AccountManageComponent },
  { path: "event-detail/:accountId/SPONSOR/:eventId", component: SponsorEventDetailComponent },
  { path: "event-detail/:accountId/STAFF/:eventId", component: StaffEventDetailComponent }  
];

export const navigatableComponents = [
  AccountSelectionComponent, AccountManageComponent, SponsorEventDetailComponent, StaffEventDetailComponent
];