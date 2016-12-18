import { AccountSelectionComponent } from "./pages/account-selection/account-selection.component";
import { AccountManageComponent } from "./pages/account-manage/account-manage.component";
import { EventDetailComponent } from "./pages/event-detail/event-detail.component"


export const routes = [
  { path: "", component: AccountSelectionComponent },
  { path: "manage-account/:accountId", component: AccountManageComponent },
  { path: "event-detail/:accountId/:eventId", component: EventDetailComponent }  
];

export const navigatableComponents = [
  AccountSelectionComponent, AccountManageComponent, EventDetailComponent
];