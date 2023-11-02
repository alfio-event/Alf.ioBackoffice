import 'dart:io';

import 'package:alfio_scan/model/sponsor_scan_model.dart';
import 'package:alfio_scan/screens/event_details.dart';
import 'package:intl/intl.dart';

import '../flutter_flow/flutter_flow_theme.dart';
import '../flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../model/account_model.dart';
import '../model/event_model.dart';
import 'package:intl/intl.dart';

import '../model/stat_event_model.dart';
import '../screens/sponsor_event_details.dart';

class EventWidget extends StatefulWidget {
  EventWidget({Key? key, required this.account, required this.event}) : super(key: key);

  Account account;
  Event event;

  @override
  _EventWidgetState createState() => _EventWidgetState(account, event);
}

class _EventWidgetState extends State<EventWidget> {
  _EventWidgetState(this.account, this.event);

  Account account;
  Event event;

  @override
  Widget build(BuildContext context) {
    // todo
    //context.watch<FFAppState>();

    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () {
        if (account.accountType == AccountType.SPONSOR) {
          Provider.of<SponsorScanModel>(context, listen: false).setCurrentEvent(event);
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => SponsorEventDetailsWidget(account: account, event: event)),
          );
        } else {
          Provider.of<StatEventModel>(context, listen: false).setAccountData(account, event);
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => EventDetailsWidget(account: account, event: event)),
          );
        }
      },
      child: Padding(
        padding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 1),
        child: Container(
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
            boxShadow: [
              BoxShadow(
                blurRadius: 0,
                color: FlutterFlowTheme.of(context).lineColor,
                offset: Offset(0, 1),
              )
            ],
          ),
          child: Padding(
            padding: EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(10, 10, 10, 10),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Container(
                            height: 48,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: Image.network(
                                event.baseUrl + event.imageUrl,
                                fit: BoxFit.scaleDown,
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 4),
                          child: Text(
                            event.name,
                            style: FlutterFlowTheme.of(context).subtitle1,
                          ),
                        ),
                        Text(
                          DateFormat.EEEE().add_yMMMMd().add_Hm().format(event.startingDate),
                          style: FlutterFlowTheme.of(context).bodyText2,
                        ),
                        Text(
                          event.location,
                          style: FlutterFlowTheme.of(context).bodyText2,
                        ),
                      ],
                    ),
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: FlutterFlowTheme.of(context).secondaryText,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
