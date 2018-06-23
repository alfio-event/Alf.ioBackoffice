import { NgModule } from "@angular/core";
import { AccountModule } from "./shared/account/account.module";
import { Http } from "@angular/http";
import { RemoteConnectorService } from "./remote-connector.service";
import { AccountSelectionNotifier } from "./shared/account/account-selection-notifier";

@NgModule({
    imports: [
        AccountModule
    ],
    providers: [
        {
            provide: Http, 
            useFactory: function(accountSelectionNotifier) {
                return new RemoteConnectorService(accountSelectionNotifier);
            },
            deps: [AccountSelectionNotifier]
        }
    ]
})
export class AlfioHttpsModule {}