import { EventHeaderComponent } from './pages/event-header/event-header.component';
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptAnimationsModule } from "nativescript-angular/animations";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { AccountModule } from "./shared/account/account.module";
import { IosAccountIconComponent } from "./pages/ios-account-icon/ios-account-icon.component";
import { AppComponent } from "./app.component";
import { routes, navigatableComponents } from "./app.routing";
import { CurrencyPipe } from "@angular/common";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { StatisticsModule } from './shared/statistics/statistics.module';
import { CheckInStatsComponent } from './pages/checkin-stats/checkin-stats.component';
import { StorageModule } from './shared/storage/storage.module';
import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";
import { VibrateService } from './shared/notification/vibrate.service';
import { FeedbackService } from './shared/notification/feedback.service';
import { IfAndroidDirective, IfIosDirective } from './utils/if-platform.directive';
import { SponsorModule } from './shared/scan/sponsor.module';
import { SponsorScanBadgeComponent } from './pages/sponsor-scan-badge/sponsor-scan-badge.component';

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
        AccountModule,
        StatisticsModule,
        StorageModule,
        SponsorModule
    ],
    declarations: [
        AppComponent,
        EventHeaderComponent,
        CheckInStatsComponent,
        IosAccountIconComponent,
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