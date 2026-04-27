import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

type AuthState = "idle" | "loading" | "authenticated" | "error";
type PickerState = "idle" | "opening" | "picked" | "error";

declare global {
  interface Window {
    //@ts-ignore
    gapi: typeof gapi;
    //@ts-ignore
    google: typeof google;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// ─── Hook: useGoogleAuth ──────────────────────────────────────────────────────

function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [tokenClient, setTokenClient] =
    // @ts-ignore
    useState<google.accounts.oauth2.TokenClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load GAPI + GIS scripts once
  useEffect(() => {
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
      });

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
              setError(resp.error);
              setAuthState("error");
            } else {
              setAuthState("authenticated");
            }
          },
        });
        setTokenClient(tc);
        setAuthState("idle");
      })
      .catch((err: Error) => {
        setError(err.message);
        setAuthState("error");
      });
  }, []);

  const signIn = useCallback(() => {
    if (!tokenClient) return;
    setAuthState("loading");
    // If a token already exists, skip consent screen
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  }, [tokenClient]);

  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {});
      window.gapi.client.setToken(null);
    }
    setAuthState("idle");
  }, []);

  const isAuthenticated = authState === "authenticated";

  return { authState, isAuthenticated, error, signIn, signOut };
}

// ─── Hook: useGooglePicker ────────────────────────────────────────────────────

function useGooglePicker(isAuthenticated: boolean) {
  const [pickerState, setPickerState] = useState<PickerState>("idle");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openPicker = useCallback(() => {
    if (!isAuthenticated) return;
    const token = window.gapi.client.getToken();
    if (!token) return;

    setPickerState("opening");

    try {
      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView()
            .setIncludeFolders(false)
            .setSelectFolderEnabled(false)
        )
        .setOAuthToken(token.access_token)
        .setDeveloperKey(API_KEY)
        //@ts-ignore
        .setCallback((data: google.picker.ResponseObject) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            setSelectedFile({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
            });
            setPickerState("picked");
          } else if (data.action === window.google.picker.Action.CANCEL) {
            setPickerState("idle");
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      setError((err as Error).message);
      setPickerState("error");
    }
  }, [isAuthenticated]);

  const openFile = useCallback(() => {
    if (selectedFile?.url) {
      window.open(selectedFile.url, "_blank", "noopener,noreferrer");
    }
  }, [selectedFile]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPickerState("idle");
    setError(null);
  }, []);

  return { pickerState, selectedFile, error, openPicker, openFile, reset };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileCard({ file, onOpen }: { file: DriveFile; onOpen: () => void }) {
  const iconMap: Record<string, string> = {
    "application/vnd.google-apps.document": "📄",
    "application/vnd.google-apps.spreadsheet": "📊",
    "application/vnd.google-apps.presentation": "📽️",
    "application/vnd.google-apps.folder": "📁",
    "application/pdf": "📑",
    "image/png": "🖼️",
    "image/jpeg": "🖼️",
  };

  const icon = iconMap[file.mimeType] ?? "📎";
  const shortMime = file.mimeType.split(".").pop()?.split("/").pop() ?? "file";

  return (
    <div className="file-card">
      <span className="file-icon">{icon}</span>
      <div className="file-info">
        <p className="file-name">{file.name}</p>
        <p className="file-type">{shortMime}</p>
      </div>
      <button className="open-btn" onClick={onOpen}>
        Open ↗
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GoogleDrivePicker() {
  const { authState, isAuthenticated, error: authError, signIn, signOut } =
    useGoogleAuth();
  const {
    pickerState,
    selectedFile,
    error: pickerError,
    openPicker,
    openFile,
    reset,
  } = useGooglePicker(isAuthenticated);

  const error = authError ?? pickerError;

  return (
    <>
      <style>{CSS}</style>
      <div className="wrapper">
        <div className="card">
          {/* Header */}
          <header className="card-header">
            <svg className="drive-logo" viewBox="0 0 87.3 78" aria-hidden="true">
              <path
                d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                fill="#0066da"
              />
              <path
                d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                fill="#00ac47"
              />
              <path
                d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                fill="#ea4335"
              />
              <path
                d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                fill="#00832d"
              />
              <path
                d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                fill="#2684fc"
              />
              <path
                d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z"
                fill="#ffba00"
              />
            </svg>
            <div>
              <h1 className="card-title">Google Drive</h1>
              <p className="card-subtitle">File Picker</p>
            </div>
          </header>

          {/* Status indicator */}
          <div className={`status-bar ${isAuthenticated ? "authed" : "idle"}`}>
            <span className="status-dot" />
            <span>
              {authState === "loading"
                ? "Authenticating…"
                : authState === "authenticated"
                ? "Connected to Google Drive"
                : authState === "error"
                ? "Authentication failed"
                : "Not connected"}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box" role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="actions">
            {!isAuthenticated ? (
              <button
                className="btn btn-primary"
                onClick={signIn}
                disabled={authState === "loading"}
              >
                {authState === "loading" ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                {authState === "loading" ? "Signing in…" : "Sign in with Google"}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={openPicker}
                  disabled={pickerState === "opening"}
                >
                  {pickerState === "opening" ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : (
                    "📂"
                  )}
                  {pickerState === "opening" ? "Opening picker…" : "Browse Drive"}
                </button>
                <button className="btn btn-ghost" onClick={signOut}>
                  Sign out
                </button>
              </>
            )}
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="file-section">
              <p className="section-label">Selected file</p>
              <FileCard file={selectedFile} onOpen={openFile} />
              <button className="btn btn-ghost btn-sm" onClick={reset}>
                ← Choose a different file
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f4f9;
    font-family: 'DM Sans', sans-serif;
    padding: 1.5rem;
  }

  .card {
    background: #fff;
    border-radius: 20px;
    padding: 2rem;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / .07), 0 10px 30px -5px rgb(0 0 0 / .1);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: .85rem;
  }

  .drive-logo { width: 36px; height: auto; flex-shrink: 0; }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a2e;
    line-height: 1.2;
  }
  .card-subtitle {
    font-size: .8rem;
    color: #6b7280;
    font-weight: 400;
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: .5rem;
    font-size: .82rem;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: .6rem .9rem;
    transition: all .3s ease;
  }
  .status-bar.authed {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    flex-shrink: 0;
    transition: background .3s ease;
  }
  .status-bar.authed .status-dot { background: #22c55e; }

  .error-box {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 8px;
    padding: .7rem 1rem;
    font-size: .82rem;
    color: #be123c;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: .6rem;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .7rem 1.2rem;
    border-radius: 10px;
    font-family: inherit;
    font-size: .9rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background .15s ease, transform .1s ease, box-shadow .15s ease;
    text-decoration: none;
  }
  .btn:active { transform: scale(.98); }
  .btn:disabled { opacity: .6; cursor: not-allowed; }

  .btn-primary {
    background: #1a73e8;
    color: #fff;
    box-shadow: 0 1px 3px rgb(26 115 232 / .3);
  }
  .btn-primary:hover:not(:disabled) { background: #1557b0; box-shadow: 0 3px 8px rgb(26 115 232 / .35); }

  .btn-ghost {
    background: transparent;
    color: #374151;
    border: 1px solid #e5e7eb;
  }
  .btn-ghost:hover:not(:disabled) { background: #f3f4f6; }

  .btn-sm { font-size: .8rem; padding: .45rem .9rem; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgb(255 255 255 / .4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .file-section {
    display: flex;
    flex-direction: column;
    gap: .7rem;
    border-top: 1px solid #f0f0f0;
    padding-top: 1.25rem;
  }

  .section-label {
    font-size: .75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #9ca3af;
  }

  .file-card {
    display: flex;
    align-items: center;
    gap: .9rem;
    padding: .85rem 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .file-card:hover { border-color: #93c5fd; box-shadow: 0 0 0 3px rgb(147 197 253 / .2); }

  .file-icon { font-size: 1.6rem; flex-shrink: 0; line-height: 1; }

  .file-info { flex: 1; min-width: 0; }
  .file-name {
    font-size: .88rem;
    font-weight: 500;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .file-type {
    font-size: .75rem;
    color: #9ca3af;
    margin-top: .15rem;
    text-transform: capitalize;
  }

  .open-btn {
    flex-shrink: 0;
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: .4rem .75rem;
    font-family: inherit;
    font-size: .8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s ease;
    white-space: nowrap;
  }
  .open-btn:hover { background: #1557b0; }
`;

// ─── Google "G" icon ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20H24v8h11.3C33.7 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.4 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5C35.3 45.5 44 37 44 25c0-1.7-.2-3.3-.4-5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 15.2l7 5.1C15 17.1 19.2 14 24 14c3 0 5.7 1.1 7.8 2.9l6-6C34.4 7.5 29.5 5.5 24 5.5c-7.3 0-13.6 3.8-17.7 9.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.3 0 10.1-1.9 13.8-5l-6.4-5.4C29.4 35.8 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.3l-7 5.4C9.8 40.5 16.5 44.5 24 44.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.7 6.1l6.4 5.4C40.8 36.5 44 31 44 25c0-1.7-.2-3.3-.4-5z"
      />
    </svg>
  );
}
