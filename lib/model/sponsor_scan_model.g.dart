// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sponsor_scan_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class SponsorScanAdapter extends TypeAdapter<SponsorScan> {
  @override
  final int typeId = 3;

  @override
  SponsorScan read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return SponsorScan(
      fields[0] as String,
      fields[1] as String,
      fields[2] as ScanStatus,
      fields[3] as LeadStatus,
      fields[4] as String,
      fields[5] as String,
    );
  }

  @override
  void write(BinaryWriter writer, SponsorScan obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.eventKey)
      ..writeByte(1)
      ..write(obj.badgeCode)
      ..writeByte(2)
      ..write(obj.scanStatus)
      ..writeByte(3)
      ..write(obj.leadStatus)
      ..writeByte(4)
      ..write(obj.attendeeFullName)
      ..writeByte(5)
      ..write(obj.comment);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SponsorScanAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ScanStatusAdapter extends TypeAdapter<ScanStatus> {
  @override
  final int typeId = 4;

  @override
  ScanStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return ScanStatus.NEW;
      case 1:
        return ScanStatus.IN_PROCESS;
      case 2:
        return ScanStatus.ERROR;
      case 3:
        return ScanStatus.DONE;
      case 4:
        return ScanStatus.UPDATED;
      default:
        return ScanStatus.NEW;
    }
  }

  @override
  void write(BinaryWriter writer, ScanStatus obj) {
    switch (obj) {
      case ScanStatus.NEW:
        writer.writeByte(0);
        break;
      case ScanStatus.IN_PROCESS:
        writer.writeByte(1);
        break;
      case ScanStatus.ERROR:
        writer.writeByte(2);
        break;
      case ScanStatus.DONE:
        writer.writeByte(3);
        break;
      case ScanStatus.UPDATED:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class LeadStatusAdapter extends TypeAdapter<LeadStatus> {
  @override
  final int typeId = 5;

  @override
  LeadStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return LeadStatus.COLD;
      case 1:
        return LeadStatus.WARM;
      case 2:
        return LeadStatus.HOT;
      default:
        return LeadStatus.COLD;
    }
  }

  @override
  void write(BinaryWriter writer, LeadStatus obj) {
    switch (obj) {
      case LeadStatus.COLD:
        writer.writeByte(0);
        break;
      case LeadStatus.WARM:
        writer.writeByte(1);
        break;
      case LeadStatus.HOT:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LeadStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
