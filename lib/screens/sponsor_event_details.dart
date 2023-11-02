import 'package:alfio_scan/components/scanned_badge_widget.dart';
import 'package:alfio_scan/model/sponsor_scan_model.dart';
import 'package:alfio_scan/model/stat_event_model.dart';
import 'package:alfio_scan/screens/attendee_scanner_screen.dart';
import 'package:alfio_scan/screens/search_attendees_screen.dart';
import 'package:alfio_scan/screens/sponsor_attendee_scanner_screen.dart';
import 'package:intl/intl.dart';

import '../components/event_widget.dart';
import '../components/stats_widget.dart';
import '../flutter_flow/flutter_flow_icon_button.dart';
import '../flutter_flow/flutter_flow_theme.dart';
import '../flutter_flow/flutter_flow_util.dart';
import '../flutter_flow/flutter_flow_widgets.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../model/account_model.dart';
import '../model/event_model.dart';

class SponsorEventDetailsWidget extends StatefulWidget {
  SponsorEventDetailsWidget({Key? key, required this.account, required this.event}) : super(key: key);

  Account account;
  Event event;

  @override
  _SponsorEventDetailsWidgetState createState() => _SponsorEventDetailsWidgetState(account, event);
}

class _SponsorEventDetailsWidgetState extends State<SponsorEventDetailsWidget> {
  _SponsorEventDetailsWidgetState(this.account, this.event);

  Account account;
  Event event;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    //context.watch<FFAppState>();

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
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
          'Scan attendee',
          style: FlutterFlowTheme.of(context).title2,
        ),
        actions: [],
        centerTitle: false,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              color: Colors.white,
              child: Padding(
                padding: EdgeInsetsDirectional.fromSTEB(20, 12, 20, 0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Expanded(
                      child: Text(
                        event.name,
                        style: FlutterFlowTheme.of(context).title2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              color: Colors.white,
              child: Padding(
                padding: EdgeInsetsDirectional.fromSTEB(20, 4, 20, 0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Expanded(
                      child: Text(
                        DateFormat.EEEE().add_yMMMMd().add_Hm().format(event.startingDate),
                        style: FlutterFlowTheme.of(context).subtitle1.override(
                          fontFamily: 'Poppins',
                          color: FlutterFlowTheme.of(context).primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              color: Colors.white,
              child: Padding(
                padding: EdgeInsetsDirectional.fromSTEB(20, 12, 20, 0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Expanded(
                      child: Text(
                        'AABABABA',
                        style: FlutterFlowTheme.of(context).bodyText2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Padding(
                      padding: EdgeInsets.all(5),
                      child: Consumer<SponsorScanModel>(builder: (context, scanModel, child) {
                        return Column(
                          children: List.generate(scanModel.sponsorScans.length, (index) {
                            return ScannedBadgeWidget(sponsorScan: scanModel.sponsorScans[index]);
                          }),
                        );
                      }),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              color: Colors.white,
              child: Padding(
                padding: EdgeInsets.all(10),
                child: FFButtonWidget(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => SponsorAttendeeScannerScreenWidget(account: account, event: event)),
                    );
                  },
                  text: 'Scan Attendees',
                  options: FFButtonOptions(
                    width: 300,
                    height: 60,
                    color: FlutterFlowTheme.of(context).primaryColor,
                    textStyle: FlutterFlowTheme.of(context).title3.override(
                      fontFamily: 'Poppins',
                      color: Colors.white,
                    ),
                    elevation: 3,
                    borderSide: BorderSide(
                      color: Colors.transparent,
                      width: 1,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
