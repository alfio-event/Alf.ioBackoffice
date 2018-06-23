import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptAnimationsModule } from "nativescript-angular/animations";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { AccountModule } from "./shared/account/account.module"
import { IosAccountIconComponent } from "./pages/ios-account-icon/ios-account-icon.component";
import { AppComponent } from "./app.component";
import { routes, navigatableComponents } from "./app.routing";
import { AlfioHttpsModule } from "./alfio-https.module";
import { CurrencyPipe } from "@angular/common";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { StatisticsModule } from '~/shared/statistics/statistics.module';
import { CheckInStatsComponent } from '~/pages/checkin-stats/checkin-stats.component';

@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        AlfioHttpsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(routes),
        NativeScriptAnimationsModule,
        AccountModule,
        StatisticsModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        CheckInStatsComponent,
        IosAccountIconComponent,
        ...navigatableComponents
    ],
    providers: [ CurrencyPipe, BarcodeScanner ],
    bootstrap: [AppComponent]
})
export class AppModule {}