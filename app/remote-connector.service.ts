import { RequestOptionsArgs, Response, ResponseOptions, ResponseType, Http, BaseRequestOptions, Headers } from "@angular/http";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/merge';
import { Injectable, OnInit, Injector } from "@angular/core";
import * as Https from 'nativescript-https'
import { HttpResponseEncoding, HttpResponse } from "http";
import { ActivatedRoute, Params } from "@angular/router";
import { AccountService } from "./shared/account/account.service";
import { Account } from "./shared/account/account";
import { knownFolders, File } from 'file-system'
import { AccountSelectionNotifier } from "./shared/account/account-selection-notifier";
import { HttpsResponse, HttpsSSLPinningOptions } from "nativescript-https";

@Injectable()
export class RemoteConnectorService extends Http {

    private responseMapper = (response: HttpsResponse) => {
        let isSuccessful = response.statusCode == 200;
        let responseOptions = new ResponseOptions({
            body: isSuccessful ? response.content : null,
            type: isSuccessful ? ResponseType.Default : ResponseType.Error,
            status: response.statusCode,
            statusText: ''
        });
        return new Response(responseOptions);
    };

    constructor(private accountSelectionNotifier: AccountSelectionNotifier) {
        super(null, null);
        console.log("registering RemoteConnectorService");
        Observable.merge(this.accountSelectionNotifier.accountSelectedObservable, this.accountSelectionNotifier.accountScannedObservable)
            .subscribe(account => this.onAccountSelected(account));
    }

    request(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    get(url: string, options?: RequestOptionsArgs): Observable<Response> {
        let promise = Https.request({
            url: url,
            method: 'GET',
            headers: options ? this.convertHeaders(options.headers) : undefined
        });
        return Observable.fromPromise(promise).map(this.responseMapper);
    }

    post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        let headers = this.convertHeaders(options.headers);
        headers['Content-Type'] = 'application/json';
        return Observable.fromPromise(Https.request({
            url: url,
            method: 'POST',
            headers: headers,
            body: body
        })).map(this.responseMapper);
    }
    
    put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }

    delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    head(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }
    
    options(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return Observable.throw("not implemented");
    }

    private convertHeaders(headers: Headers): {[key: string] : string} {
        let converted: {[key: string] : string} = {};
        if(headers) {
            headers.forEach((val:string[], name:string, _headers: any) => {
                converted[name] = val[0];
            });
        }
        return converted;
    }

    private onAccountSelected(account: Account): void {
        console.log(`account selected/scanned: ${account.getKey()}. Has sslCert: `, account.sslCert && account.sslCert.length > 0);
        Https.disableSSLPinning();
        if(account.sslCert) {
            let dir = knownFolders.currentApp().getFolder('certs');
            let hostname = new RegExp(/^https?:\/\/(.*?)(:.*)?$/).exec(account.url)[1];
            if(!File.exists(`${dir.path}/${hostname}`)) {
                let text = `-----BEGIN CERTIFICATE-----\n${account.sslCert}\n-----END CERTIFICATE-----`;
                let file = File.fromPath(`${dir.path}/${hostname}`);
                file.writeText(text).then(r => {
                    let pinningOptions = { 
                        host: hostname, 
                        certificate: file.path,
                        allowInvalidCertificates: false,
                        validatesDomainName: false
                    };
                    Https.enableSSLPinning(pinningOptions);
                });
            } else {
                let file = File.fromPath(`${dir.path}/${hostname}`);
                let pinningOptions = { 
                        host: hostname, 
                        certificate: file.path,
                        allowInvalidCertificates: false,
                        validatesDomainName: false
                    };
                Https.enableSSLPinning(pinningOptions);
            }
        }
    }

}