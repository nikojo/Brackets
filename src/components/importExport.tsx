import { useRef } from "react";
import { BracketStore } from "../lib/BracketStore";

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
        a.download = store.description.replace(/[^a-zA-Z0-9]/g, "-") + (store.isKata ? "-kata" : "-kumite") + ".json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const loaded = BracketStore.deserialize(reader.result as string);
                Object.assign(store, loaded);
                store.regenerateBracketStore();
            } catch (err) {
                console.error("Failed to load bracket file:", err);
                alert("Invalid or incompatible bracket file.");
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be reopened if needed
        e.target.value = "";
    };

    return (
        <div>
            <button onClick={handleExport}>Export</button>
            <button onClick={() => fileInputRef.current?.click()}>Import</button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
            />
        </div>
    );
}