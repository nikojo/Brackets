import { useRef } from "react";
import { useStore, BracketStore } from "../lib/BracketStore";
import { runInAction } from "mobx";


export function ImportExportButtons() {
    const bpstore = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        const json = bpstore.serialize();
        if ('showSaveFilePicker' in window) {
            // show save as dialog
            try {
                // @ts-ignore - already checked to make sure method exists above
                const handle = await window.showSaveFilePicker({
                    suggestedName: bpstore.generateFileName(),
                    types: [{
                        description: 'Bracket Files',
                        accept: { 'text/plain': ['.bracket'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
            } catch (err) {
                alert('Export failed: ' + err)
            }
        } else {
            // just download
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = bpstore.generateFileName();
            a.click();
            URL.revokeObjectURL(url);
        }
        bpstore.hasChanges = false; // even Import/Export will reset the flag since we don't want to force people to use Google Drive
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const loaded = BracketStore.deserialize(reader.result as string);
                runInAction(() => {
                    Object.assign(bpstore, loaded);
                });
                bpstore.regenerateBracketStore();
                bpstore.hasChanges = false;  // even Import/Export will reset the flag since we don't want to force people to use Google Drive
            } catch (err) {
                console.error("Failed to load bracket file:", err);
                alert("Invalid or incompatible bracket file.");
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be reopened if needed
        e.target.value = "";
    };

    const startImport = () => {
        if (bpstore.hasChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to import a new bracket?")) { 
                return;
            }
        }
        fileInputRef.current?.click();
    };


    return (
        <div>
            <button onClick={startImport}>Import</button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".bracket"
                style={{ display: "none" }}
                onChange={handleImport}
            />
            <button onClick={handleExport}>Export</button>
        </div>
    );
}