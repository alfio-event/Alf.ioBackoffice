import 'package:alfio_scan/model/account_model.dart';

import '../components/event_widget.dart';
import '../flutter_flow/flutter_flow_theme.dart';
import '../flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class AccountScannerScreenWidget extends StatefulWidget {
  const AccountScannerScreenWidget({Key? key}) : super(key: key);

  @override
  _AccountScannerScreenWidgetState createState() => _AccountScannerScreenWidgetState();
}

class _AccountScannerScreenWidgetState extends State<AccountScannerScreenWidget> {
  MobileScannerController cameraController = MobileScannerController(  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
          automaticallyImplyLeading: false,
          leading: InkWell(
            onTap: () async {
              Navigator.pop(context);
            },
            child: Icon(
              Icons.chevron_left_rounded,
              color: FlutterFlowTheme.of(context).primaryText,
              size: 32,
            ),
          ),
          title: Text(
            "Add account",
            style: FlutterFlowTheme.of(context).subtitle1,
          ),
          actions: [
            IconButton(
              color: Colors.white,
              icon: ValueListenableBuilder(
                valueListenable: cameraController.torchState,
                builder: (context, state, child) {
                  switch (state as TorchState) {
                    case TorchState.off:
                      return const Icon(Icons.flash_off, color: Colors.grey);
                    case TorchState.on:
                      return const Icon(Icons.flash_on, color: Colors.yellow);
                  }
                },
              ),
              iconSize: 32.0,
              onPressed: () => cameraController.toggleTorch(),
            ),
          ],
          centerTitle: false,
          elevation: 0,
        ),
        body: MobileScanner(
          controller: cameraController,
          allowDuplicates: false,
          onDetect: (barcode, args) {
            if (barcode.rawValue == null) {
              debugPrint('Failed to scan Barcode');
            } else {
              final String code = barcode.rawValue!;
              debugPrint('Barcode found! $code');
              //TODO
              //Provider.of<AccountModel>(context, listen: false).addAccountFromJson("{\"baseUrl\":\"https://m4.test.alf.io\",\"apiKey\":\"2a47074c-6988-4024-91a2-09d1b9d67996\"}");
              Provider.of<AccountModel>(context, listen: false).addAccountFromJson(code);
              Navigator.of(context).pop();
            }
          },
        ));
  }
}
