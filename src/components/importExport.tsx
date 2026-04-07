import { useRef } from "react";
import { BracketStore } from "../lib/BracketStore";
import { runInAction } from "mobx";

interface Props {
    store: BracketStore;
}

export function ImportExportButtons({ store }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const json = store.serialize();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = store.title.replace(/[\<\>\:\"\/\\\|\?\*\x00-\x1F]/g, "_") + (store.isKata ? "-kata" : "-kumite") + "..bracket";
        a.click();
        URL.revokeObjectURL(url);
        store.hasChanges = false;  // remove if we implement open/save
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const loaded = BracketStore.deserialize(reader.result as string);
                runInAction(() => {
                    Object.assign(store, loaded);
                });
                store.regenerateBracketStore();
                store.hasChanges = false; // remove if we implement open/save
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
        if (store.hasChanges) {
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