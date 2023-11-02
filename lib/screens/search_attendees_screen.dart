import 'package:alfio_scan/model/stat_event_model.dart';
import 'package:alfio_scan/screens/attendee_scanner_screen.dart';
import 'package:intl/intl.dart';

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
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

class SearchAttendeesWidget extends StatefulWidget {
  SearchAttendeesWidget({Key? key, required this.account, required this.event}) : super(key: key);

  Account account;
  Event event;

  @override
  _SearchAttendeesWidgetState createState() => _SearchAttendeesWidgetState(account, event);
}

class _SearchAttendeesWidgetState extends State<SearchAttendeesWidget> {
  var searchFieldController = TextEditingController();
  var searchFieldControllerValidator;

  Account account;
  Event event;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final PagingController<int, Attendee> _pagingController = PagingController(firstPageKey: 0);

  _SearchAttendeesWidgetState(this.account, this.event);

  @override
  void initState() {
    _pagingController.addPageRequestListener((pageKey) {
      _fetchPage(pageKey);
    });
    
    _pagingController.addStatusListener((status) {

      debugPrint("Status listener ${status}");

    });
    
    super.initState();
  }

  Future<void> _fetchPage(int pageKey) async {
    String query = searchFieldController.text;
    debugPrint("query $query");
    try {
      final newItems = await Provider.of<EventModel>(context, listen: false).search(query, event, pageKey);

      final isLastPage = true; //TODO= Provider.of<EventModel>(context, listen: false).currentSearchPage == Provider.of<EventModel>(context, listen: false).currentSearchTotalPages! - 1;
      if (isLastPage) {
        _pagingController.appendLastPage(newItems);
      } else {
        final nextPageKey = pageKey + 1;
        _pagingController.appendPage(newItems, nextPageKey);
      }
    } catch (error) {
      debugPrint(error.toString());
      _pagingController.error = error;
    }
  }

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
          'Search Attendees',
          style: FlutterFlowTheme.of(context).title2,
        ),
        actions: [],
        centerTitle: false,
        elevation: 0,
      ),
      body: Column(
        mainAxisSize: MainAxisSize.max,
        children: [
          Row(
            mainAxisSize: MainAxisSize.max,
            children: [
              Material(
                color: Colors.transparent,
                elevation: 0,
                child: Container(
                  width: MediaQuery.of(context).size.width,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 4,
                        color: Color(0x430F1113),
                        offset: Offset(0, 2),
                      )
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: TextFormField(
                      textInputAction: TextInputAction.search,
                      onFieldSubmitted: (value) {
                        debugPrint(value);
                        _pagingController.refresh();
                      },
                      controller: searchFieldController,
                      obscureText: false,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.all(5),
                        hintText: 'Search by first name, last name, email, ticket, reservation...',
                        hintStyle: FlutterFlowTheme.of(context).subtitle1.override(
                              fontFamily: 'Lexend Deca',
                              color: Color(0xFF95A1AC),
                              fontSize: 14,
                              fontWeight: FontWeight.normal,
                            ),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color(0xFFF1F4F8),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color(0x00000000),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color(0x00000000),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        focusedErrorBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color(0x00000000),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          color: Color(0xFF95A1AC),
                        ),
                        suffixIcon: InkWell(
                          onTap: () async {
                            searchFieldController?.clear();
                            setState(() {});
                          },
                          child: Icon(
                            Icons.clear,
                            color: Color(0xFF757575),
                            size: 22,
                          ),
                        ),
                      ),
                      style: FlutterFlowTheme.of(context).subtitle1.override(
                            fontFamily: 'Lexend Deca',
                            color: Color(0xFF090F13),
                            fontSize: 14,
                            fontWeight: FontWeight.normal,
                          ),
                      maxLines: null,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: PagedListView<int, Attendee>(
              pagingController: _pagingController,
              builderDelegate: PagedChildBuilderDelegate<Attendee>(
                noMoreItemsIndicatorBuilder: (context) => Container(
                  height: 100,
                ),
                itemBuilder: (context, item, index) => AttendeeWidget(
                  attendee: item,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              scrollDirection: Axis.vertical,
              children: [
                /*Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(16, 12, 16, 20),
                  child: Container(
                    width: double.infinity,
                    height: 184,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      image: DecorationImage(
                        fit: BoxFit.fitWidth,
                        image: Image.network(
                          'https://images.unsplash.com/photo-1616803689943-5601631c7fec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTR8fHdvcmtvdXR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
                        ).image,
                      ),
                      boxShadow: [
                        BoxShadow(
                          blurRadius: 3,
                          color: Color(0x33000000),
                          offset: Offset(0, 2),
                        )
                      ],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Color(0x65090F13),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 2),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(16, 16, 16, 0),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Class Name',
                                      style: FlutterFlowTheme.of(context).subtitle1.override(
                                            fontFamily: 'Lexend Deca',
                                            color: Colors.white,
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ),
                                  Icon(
                                    Icons.chevron_right_rounded,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(16, 4, 16, 0),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '30m | High Intensity | Indoor/Outdoor',
                                      style: FlutterFlowTheme.of(context).subtitle1.override(
                                            fontFamily: 'Lexend Deca',
                                            color: Color(0xFF39D2C0),
                                            fontSize: 14,
                                            fontWeight: FontWeight.normal,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(16, 4, 16, 16),
                                child: Row(
                                  mainAxisSize: MainAxisSize.max,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    FFButtonWidget(
                                      onPressed: () {
                                        print('Button-Reserve pressed ...');
                                      },
                                      text: 'Reserve',
                                      icon: Icon(
                                        Icons.add_rounded,
                                        color: Colors.white,
                                        size: 15,
                                      ),
                                      options: FFButtonOptions(
                                        width: 120,
                                        height: 40,
                                        padding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
                                        iconPadding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 0),
                                        color: Color(0xFF39D2C0),
                                        textStyle: GoogleFonts.getFont(
                                          'Lexend Deca',
                                          color: Colors.white,
                                          fontSize: 14,
                                        ),
                                        elevation: 3,
                                        borderSide: BorderSide(
                                          color: Colors.transparent,
                                          width: 1,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.max,
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Padding(
                                            padding: EdgeInsetsDirectional.fromSTEB(0, 0, 0, 4),
                                            child: Text(
                                              '10:00am',
                                              style: FlutterFlowTheme.of(context).subtitle1.override(
                                                    fontFamily: 'Lexend Deca',
                                                    color: Colors.white,
                                                    fontSize: 20,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                            ),
                                          ),
                                          Text(
                                            'Thursday June 22',
                                            textAlign: TextAlign.end,
                                            style: FlutterFlowTheme.of(context).subtitle1.override(
                                                  fontFamily: 'Lexend Deca',
                                                  color: Color(0xB4FFFFFF),
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.normal,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),*/
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text("Submit a query to see the results"),
          )
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pagingController.dispose();
    super.dispose();
  }
}

class AttendeeWidget extends StatefulWidget {
  AttendeeWidget({
    required this.attendee,
    Key? key,
  }) : super(key: key);

  final Attendee attendee;

  @override
  State<AttendeeWidget> createState() => AttendeeWidgetState(attendee);
}

class AttendeeWidgetState extends State<AttendeeWidget> {
  AttendeeWidgetState(this.attendee);

  final Attendee attendee;

  @override
  Widget build(BuildContext context) {
    return Card(
      semanticContainer: false,
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        mainAxisSize: MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: CircleAvatar(
              radius: 22,
              backgroundColor: Colors.lightGreenAccent,
              child: CircleAvatar(
                radius: 20,
                backgroundColor: Colors.white,
                //backgroundImage: CachedNetworkImageProvider(Conf.buildImageUrl(post.playerImageId)),
              ),
            ),
          ),
          Spacer(
            flex: 1,
          ),
          Expanded(
              flex: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          attendee.uuid,
                          style: TextStyle(fontStyle: FontStyle.italic),
                        ),
                        Text("BBB"),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                    child: Text(
                      "CCC",
                      style: Theme.of(context).textTheme.headline6!.merge(TextStyle(fontSize: 18, color: Colors.black)),
                    ),
                  ),
                ],
              )),
        ],
      ),
    );
  }
}
