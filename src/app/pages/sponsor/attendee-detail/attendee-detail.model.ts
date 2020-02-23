export const sponsorScanMetadata = {
    isReadOnly: false,
    commitMode: "Immediate",
    validationMode: "Immediate",
    propertyAnnotations: [
        {
            name: "code",
            ignore: true
        },
        {
            name: "status",
            ignore: true
        },
        {
            name: "ticket",
            ignore: true
        },
        {
            name: "leadStatus",
            displayName: "Lead Status",
            editor: "Picker",
            index: 0
        },
        {
            name: "notes",
            displayName: "Comments",
            editor: "MultilineText",
            index: 1
        }
    ]
};
