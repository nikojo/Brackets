import { useState } from "react";

export function GoogleDrive() {

    const CLIENT_ID = '832249201910-27713mvcf27q4tbel51bnugrvkcfdquk.apps.googleusercontent.com';

    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
    const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
    const SCOPES = "https://www.googleapis.com/auth/drive.file"
    //const SCOPES = "https://www.googleapis.com/auth/drive.readonly"

    interface DriveFile {
        id: string;
        name: string;
        mimeType: string;
        url: string;
    }

    type AuthState = "idle" | "loading" | "authenticated" | "error";
    type PickerState = "idle" | "opening" | "picked" | "error";

    const [authState, setAuthState] = useState<AuthState>("idle");
    //const [error, setError] = useState<string | null>(null);        
    const [pickerState, setPickerState] = useState<PickerState>("idle");
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    
    const authenticate = () => {
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
                        window.gapi.load("client:picker", () => resolve())
                    )
            )
            .then(() =>
                window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                })
            )
            .then(() => {
                const tc = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    //@ts-ignore
                    callback: (resp) => {
                        if (resp.error) {
                            alert("Unexpected error: " + resp.error);
                            setAuthState("error");
                        } else {
                            setAuthState("authenticated");
                            showPicker();
                        }
                    },
                });
                setAuthState("loading");
                // If a token already exists, skip consent screen
                if (window.gapi.client.getToken() === null) {
                    tc.requestAccessToken({ prompt: "consent" });
                } else {
                    tc.requestAccessToken({ prompt: "" });
                }
                setAuthState("idle");
            })
            .catch((err: Error) => {
                alert("Unexpected error: " + err.message);
                setAuthState("error");
            });
        };

    const showPicker = () => {
        const token = window.gapi.client.getToken();
        if (!token) return;
        try {
            const picker = new window.google.picker.PickerBuilder()
                .addView(
                    new window.google.picker.DocsView()
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setParent("root")
                        .setMode(window.google.picker.DocsViewMode.LIST)
                )
                .addView(
                    new window.google.picker.DocsView()
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setOwnedByMe(false)
                        .setLabel("Shared with me")
                        .setMode(window.google.picker.DocsViewMode.LIST)
                )
                .setOAuthToken(token.access_token)
                .setDeveloperKey(API_KEY)
                //@ts-ignore
                .setCallback(async (data: google.picker.ResponseObject) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        setSelectedFile({
                            id: doc.id,
                            name: doc.name,
                            mimeType: doc.mimeType,
                            url: doc.url,
                        });
                        /* */
                        try {
                            const response = await window.gapi.client.drive.files.get(
                                { fileId: doc.id, alt: 'media' },
                                { responseType: 'json' }
                            );
                            console.log(response);
                            console.log(response.result);
                            console.log(response.body);
                        } catch (err) {
                            alert("Failed to open file: " + doc.name + " Error: " + err.body);
                            return;
                        }
                            /* */
                           /* 
                        try {
                            const url = "https://drive.google.com/uc?export=download&id=" + doc.id;
                            console.log("Token: " + token.access_token);
                            var response = await fetch(url, {
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });
                            console.log(response.json);
                        } catch (err) {
                            alert("Failed to open file: " + doc.name + " Error: " + err.body);
                        }
                          /*  */
                        setPickerState("picked");
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        setPickerState("idle");
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err) {
            alert("Unexpected error: " + (err as Error).message);
            setPickerState("error");
        }
    }

    const onOpen = () => {
        if (authState !== "authenticated") {
            authenticate();
        } else {
            showPicker();
        }

    }


    return (
        <div>
            <button onClick={ onOpen }>Open</button>
            
        </div>
    );
}