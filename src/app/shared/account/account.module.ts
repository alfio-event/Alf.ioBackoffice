import { NgModule } from "@angular/core";
import { AccountService } from "./account.service";
import { AccountSelectionNotifier } from "./account-selection-notifier";

@NgModule({
    providers: [
        AccountService,
        AccountSelectionNotifier
    ]
})
export class AccountModule {}