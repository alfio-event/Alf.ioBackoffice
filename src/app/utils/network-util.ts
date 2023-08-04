import { isDefined } from "@nativescript/core/utils/types";
import { HttpHeaders } from "@angular/common/http";

export function authorization(apiKey: string): HttpHeaders {
    return new HttpHeaders({"Authorization": `ApiKey ${apiKey}`});
}

export function basicAuth(username: string, password: string): HttpHeaders {
    return new HttpHeaders({"Authorization": "Basic " + encodeBase64(`${username}:${password}`)});
}

export function encodeBase64(str: string) {
    let padChar = '=';
    let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let getByte = function (s, i) {
        let cc = s.charCodeAt(i);
        if (cc > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }
        return cc;
    };
    let b10, i;
    let b64Chars = [];
    let iMax = str.length - str.length % 3;
    for (i = 0; i < iMax; i += 3) {
        b10 = (getByte(str, i) << 16) |
            (getByte(str, i + 1) << 8) |
            getByte(str, i + 2);
        b64Chars.push(alpha.charAt(b10 >> 18));
        b64Chars.push(alpha.charAt((b10 >> 12) & 0x3F));
        b64Chars.push(alpha.charAt((b10 >> 6) & 0x3f));
        b64Chars.push(alpha.charAt(b10 & 0x3f));
    }
    switch (str.length - iMax) {
        case 1:
            b10 = getByte(str, i) << 16;
            b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                padChar + padChar);
            break;
        case 2:
            b10 = (getByte(str, i) << 16) | (getByte(str, i + 1) << 8);
            b64Chars.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                alpha.charAt((b10 >> 6) & 0x3F) + padChar);
            break;
    }
    return b64Chars.join('');
}
