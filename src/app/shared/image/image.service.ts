import { Injectable } from "@angular/core";
import { EventConfiguration, Account } from "../../shared/account/account";
import * as imageSource from "tns-core-modules/image-source";
import * as fs from "tns-core-modules/file-system";
import { Folder } from "tns-core-modules/file-system";
import { Observable, of, from } from "rxjs";
import { map } from 'rxjs/operators';

@Injectable()
export class ImageService {

    private folder: Folder;

    constructor() {
        this.folder = fs.knownFolders.documents();
    }

    getImage(account: Account, e: EventConfiguration) :Observable<string> {
        let url = account.url + e.imageUrl;
        let filename = fs.path.join(this.folder.path, e.imageUrl.replace(/[^A-Za-z0-9]/g,'_'));
        if(fs.File.exists(filename)) {
            return of(filename);
        } else {
             return from(imageSource.fromUrl(url))
                .pipe(map(img => {
                    img.saveToFile(filename, "png");
                    return filename;
                }));
        }
    } 

}