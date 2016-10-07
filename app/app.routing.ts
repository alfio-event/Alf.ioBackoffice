import { AccountSelectionComponent } from "./pages/account-selection/account-selection.component";
import { AccountManageComponent } from "./pages/account-manage/account-manage.component";


export const routes = [
  { path: "", component: AccountSelectionComponent },
  { path: "manage-account/:accountId", component: AccountManageComponent }  
];

export const navigatableComponents = [
  AccountSelectionComponent, AccountManageComponent
];