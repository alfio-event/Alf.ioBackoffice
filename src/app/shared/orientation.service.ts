import { Injectable, NgZone } from "@angular/core";
import {Application, OrientationChangedEventData} from "@nativescript/core";
import { Observable, Subject } from "rxjs";

@Injectable()
export class OrientationService {

    private orientationChangeSubject = new Subject<string>();

    constructor(ngZone: NgZone) {
        Application.on('orientationChanged', (data: OrientationChangedEventData) => ngZone.run(() => this.orientationChangeSubject.next(data.newValue)));
    }

    public orientationChange(): Observable<string> {
        return this.orientationChangeSubject.asObservable();
    }

}
