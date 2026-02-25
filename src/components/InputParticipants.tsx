import React, { useState } from 'react';
import { useStore } from '../lib/BracketStore.ts';
import useFocus from '../hooks/useFocus.ts';
import FileUploadModal from '../FileUploadModal.tsx';

export default function InputParticipants() {

    const bpstore = useStore();
    const [inputParticipantName, setInputParticipantName] = useState("");
    const inputRef = useFocus<HTMLInputElement>();
    
    function handleAddParticipant() {
        const name = inputParticipantName.trim();
        if (name !== null && name !== undefined) {
            if (name.length > 0) {
                if (bpstore.getParticipantIx(name) !== -1) {
                    alert("Participant with name '" + name + "' already exists!");
                    return;
                } else {
                    bpstore.addParticipant(name);
                    setInputParticipantName("");
                }
            } else {
                alert("Participant name cannot be empty!");
            }
            inputRef.current?.focus();
        }
    }


    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleAddParticipant();
        }
    }

    return (
        <div className="input-participants">
            <input type="text" 
            value={inputParticipantName} 
            onChange={(e) => setInputParticipantName(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
             />
            <button onClick={handleAddParticipant}>
                Add Participant
            </button>
            <FileUploadModal onDataParsed={(data) => {
                console.log(data.headers); // string[]
                console.log(data.rows);    // Record<string, unknown>[]
            }} />
        </div>
    )

}