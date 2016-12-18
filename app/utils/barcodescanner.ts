import { OpaqueToken } from '@angular/core';
import * as scanner from 'nativescript-barcodescanner';
export const BARCODE_SCANNER = new OpaqueToken('barcodescanner');

//These are re-exported for convenience (so you don't have to import from two places)
export const barcodescanner = new scanner.BarcodeScanner();
export type BarcodeScanner = scanner.BarcodeScanner;
export type ScanOptions = scanner.ScanOptions;
export type IosScanOptions = scanner.IOS;
export type AndroidScanOptions = scanner.Android;