import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptFormsModule, NativeScriptAnimationsModule, NativeScriptHttpClientModule, NativeScriptModule, NativeScriptRouterModule } from "@nativescript/angular";
import { AccountModule } from "./shared/account/account.module";
import { AppComponent } from "./app.component";
import { routes, navigatableComponents } from "./app.routing";
import { CurrencyPipe } from "@angular/common";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { StatisticsModule } from './shared/statistics/statistics.module';
import { CheckInStatsComponent } from './pages/checkin-stats/checkin-stats.component';
import { StorageModule } from './shared/storage/storage.module';
import { VibrateService } from './shared/notification/vibrate.service';
import { FeedbackService } from './shared/notification/feedback.service';
import { IfAndroidDirective, IfIosDirective } from './utils/if-platform.directive';
import { SponsorModule } from './shared/scan/sponsor.module';
import { SponsorScanBadgeComponent } from './pages/sponsor-scan-badge/sponsor-scan-badge.component';
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";

export function createBarcodeScanner() {
    return new BarcodeScanner();
}

@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(routes),
        NativeScriptAnimationsModule,
        NativeScriptHttpClientModule,
        NativeScriptUIListViewModule,
        NativeScriptUIDataFormModule,
        AccountModule,
        StatisticsModule,
        StorageModule,
        SponsorModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        CheckInStatsComponent,
        IfAndroidDirective,
        IfIosDirective,
        SponsorScanBadgeComponent,
        ...navigatableComponents
    ],
    providers: [
        CurrencyPipe,
        { provide: BarcodeScanner, useFactory: (createBarcodeScanner) },
        VibrateService,
        FeedbackService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}