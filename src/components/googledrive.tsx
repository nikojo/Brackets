import { useState, useRef } from "react";
import { useStore, BracketStore } from "../lib/BracketStore";
import { runInAction } from "mobx";

declare var gapi: any;
declare var google: any;

export function GoogleDrive() {
    const bpstore = useStore();

    const CLIENT_ID = '832249201910-27713mvcf27q4tbel51bnugrvkcfdquk.apps.googleusercontent.com';

    const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
    const SCOPES = "https://www.googleapis.com/auth/drive.file"

    type PickerState = "open" | "save";

    //@ts-ignore
    const [picker, setPicker] = useState<google.picker.Picker>(null);
    const pickerState = useRef<PickerState>("open");
    
    const authenticate = (cb: () => any) => {
        const loadScript = (src: string): Promise<void> =>
            new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const s = document.createElement("script");
                s.src = src;
                s.onload = () => resolve();
                s.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.body.appendChild(s);
            }
            );

        Promise.all([
            loadScript("https://apis.google.com/js/api.js"),
            loadScript("https://accounts.google.com/gsi/client"),
        ])
            .then(
                () =>
                    new Promise<void>((resolve) =>
                        gapi.load("client:picker", () => resolve())
                    )
            )
            .then(() =>
                gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                })
            )
            .then(() => {
                const tc = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    //@ts-ignore
                    callback: (resp) => {
                        if (resp.error) {
                            alert("Unexpected error: " + resp.error);
                        } else {
                            cb();
                        }
                    },
                });
                // If a token already exists, skip consent screen
                if (!gapi.client.getToken()) {
                    tc.requestAccessToken({ prompt: "consent" });
                } else {
                    tc.requestAccessToken({ prompt: "" });
                }
            })
            .catch((err: Error) => {
                alert("Unexpected error: " + err.message);
            });
        };

    const openFile = async (docID: string, mimeType: string) => {
        if (mimeType !== "application/json") {
            alert("Please select a valid .bracket file.");
            return;
        }
        const response = await fetch('https://www.googleapis.com/drive/v3/files/' + docID + '?alt=media', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                            'Accept': "application/json"
                        }
                    });
        const data = await response.text();
        const loaded = BracketStore.deserialize(data);
        runInAction(() => {
            Object.assign(bpstore, loaded);
        });
        bpstore.regenerateBracketStore();
        bpstore.hasChanges = false; // remove if we implement open/save
    }

    interface DriveFile {
        id: string;
        name: string;
        mimeType: string;
    }

    interface DriveListResponse {
        files: DriveFile[];
        nextPageToken?: string;
    }

    const checkForExisting = async (filename: string, folderID: string) => {
        let pageToken: string | undefined = undefined;
        let foundID: string | null = null;
        try {
            do {
                const params = new URLSearchParams({
                    fields: 'nextPageToken, files(id, name)',
                    q: "'" + folderID + "' in parents and trashed = false",
                    pageToken: pageToken ? pageToken : "",
                });
                const response = await fetch('https://www.googleapis.com/drive/v3/files/' + 
                    '?' + params.toString(), {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                            'Accept': 'application/json',
                        }});
                const data: DriveListResponse = await response.json();
                const files = data.files;
                if (files && files.length > 0) {
                    files.forEach((file) => {
                        if (file.name === filename) foundID = file.id;
                    })
                }
                pageToken = data.nextPageToken;
            } while (pageToken);
        } catch (err) {
            console.log("Failed to list files: " + err);
        }
        return foundID;
    }

    const saveFile = async (folderID: string, mimeType: string) => {
        if (mimeType !== "application/vnd.google-apps.folder") {
            alert("Please select a folder.");
            return;
        }
        if (folderID) {
            const filename = bpstore.generateFileName();
            try {
                const existingFileID = await checkForExisting(filename, folderID);
                if (existingFileID) {
                    // update existing file
                    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + existingFileID, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                            'Content-Type': "application/json"
                        },
                        body: bpstore.serialize(),
                    });
                    if (!response.ok) {
                        alert("Save failed for: " + filename);
                        return;
                    }
                    await response.json();
                    bpstore.hasChanges = false;
                } else {
                    const fileMetadata = {
                        'name': filename,
                        'parents': [folderID] // Place the file inside the specific folder
                    };
                    const form = new FormData();
                    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                    form.append('file', new Blob([bpstore.serialize()], { type: 'application/json' }));
                    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                        method: 'POST',
                        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
                        body: form
                    })
                        .then((res) => res.json())
                        .then((res) => console.log(res));
                    bpstore.hasChanges = false;
                }
            } catch (err) {
                alert("Failed to save file.")
            }
        }

    }


    const showPicker = () => {
        const token = gapi.client.getToken();
        if (!token) return;
        try {
            if (!picker) {
                const pickerBuilder = new google.picker.PickerBuilder();
                pickerBuilder.addView(
                    new google.picker.DocsView()
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setParent("root")
                        .setMode(google.picker.DocsViewMode.LIST)
                )
                    .addView(
                        new google.picker.DocsView()
                            .setIncludeFolders(true)
                            .setSelectFolderEnabled(true)
                            .setOwnedByMe(false)
                            .setLabel("Shared with me")
                            .setMode(google.picker.DocsViewMode.LIST)
                    )
                    .setOAuthToken(token.access_token)
                    .setTitle("Open to a file, Save to a folder")
                    //.setSelectableMimeTypes("application/json")
                    //@ts-ignore
                    .setCallback(async (data: google.picker.ResponseObject) => {
                        if (data.action === google.picker.Action.PICKED) {
                            const doc = data.docs[0];
                            try {
                                if (pickerState.current === "open") {
                                    await openFile(doc.id, doc.mimeType);
                                } else if (pickerState.current === "save") {
                                    await saveFile(doc.id, doc.mimeType);
                                }
                            } catch (err) {
                                alert("Failed to open file: " + doc.name + " Error: " + (err as Error).message);
                                return;
                            }
                        } else if (data.action === google.picker.Action.CANCEL) {
                            //ignore
                        }
                    })
                const p = pickerBuilder.build();
                setPicker(p);
                p.setVisible(true);
            }
            else {

                picker.setVisible(true);
            }

        } catch (err) {
            alert("Unexpected error: " + (err as Error).message);
        }
    }

    const onOpen = () => {
        pickerState.current = "open";
        if (bpstore.hasChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to open a new bracket?")) { 
                return;
            }
        }        
        if (!picker) {
            authenticate(showPicker);
        } else {
            showPicker();
        }
    }


    const onSave = () => {
        pickerState.current = "save";
        if (!picker) {
            authenticate(showPicker);
        } else {
            showPicker();
        }
    }


    return (
        <div>
            <button onClick={ onOpen }>Open</button>
            <button onClick={ onSave }>Save</button>
        </div>
    );
}