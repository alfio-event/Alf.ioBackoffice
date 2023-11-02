import '../flutter_flow/flutter_flow_theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../model/stat_event_model.dart';


class StatsWidget extends StatelessWidget {
  const StatsWidget({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<StatEventModel>(builder: (context, statEventModel, child) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text("Stats at ${statEventModel.stats.formatLastUpdate()}",
                style: FlutterFlowTheme.of(context).subtitle2,),
          Text(
            "${statEventModel.stats.checkedIn} / ${statEventModel.stats.totalAttendees} checked in",
            style: FlutterFlowTheme.of(context).title2,
            textAlign: TextAlign.center,
          ),
        ],
      );
    });
  }
}
