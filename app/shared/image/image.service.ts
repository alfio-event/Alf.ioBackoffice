import { Injectable } from "@angular/core";
import { Observable } from 'rxjs/Observable';
import { EventConfiguration, EventConfigurationSelection } from "../../shared/account/account";
import imageSource = require("image-source");
import fs = require("file-system");
import enums = require("ui/enums");
import {Folder} from "file-system";

@Injectable()
export class ImageService {
    private folder: Folder;

    constructor() {
        this.folder = fs.knownFolders.documents();
    }

    fillWithImage(baseUrl: string, e: EventConfiguration, selection: EventConfigurationSelection) :void {
        let url = baseUrl + e.imageUrl;
        let filename = fs.path.join(this.folder.path, e.imageUrl.replace(/[^A-Za-z0-9]/g,'_'));
        console.log("finding image for", url);
        if(fs.File.exists(filename)) {
            console.log("file exists: ", filename);
            selection.image = filename;
        } else {
            imageSource.fromUrl(url).then(img => {
                console.log("received image for ", url);
                img.saveToFile(filename, enums.ImageFormat.png);
                console.log("image saved");
                selection.image = filename;
            });
        }
    } 

}