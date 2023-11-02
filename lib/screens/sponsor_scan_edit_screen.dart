import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive/hive.dart';
import '../model/sponsor_scan_model.dart';

class SponsorScanEditScreen extends StatefulWidget {
  final SponsorScan sponsorScan;

  const SponsorScanEditScreen({Key? key, required this.sponsorScan})
      : super(key: key);

  @override
  _SponsorScanEditScreenState createState() => _SponsorScanEditScreenState();
}

class _SponsorScanEditScreenState extends State<SponsorScanEditScreen> {
  late TextEditingController _commentController;
  late LeadStatus _leadStatus;

  @override
  void initState() {
    super.initState();
    _commentController = TextEditingController(text: widget.sponsorScan.comment);
    _leadStatus = widget.sponsorScan.leadStatus;
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _saveSponsorScan() {
    final sponsorScanModel = Provider.of<SponsorScanModel>(context, listen: false);
    final updatedSponsorScan = widget.sponsorScan
      ..comment = _commentController.text
      ..leadStatus = _leadStatus;

    sponsorScanModel.updateSponsorScan(updatedSponsorScan);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Sponsor Scan'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _commentController,
              decoration: InputDecoration(labelText: 'Comment'),
              maxLines: null,
            ),
            DropdownButton<LeadStatus>(
              value: _leadStatus,
              onChanged: (newStatus) {
                if (newStatus != null) {
                  setState(() {
                    _leadStatus = newStatus;
                  });
                }
              },
              items: LeadStatus.values
                  .map((status) => DropdownMenuItem(
                value: status,
                child: Text(status.toString().split('.').last),
              ))
                  .toList(),
            ),
            ElevatedButton(
              onPressed: _saveSponsorScan,
              child: Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
