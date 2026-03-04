import React, { useState } from 'react';
import { useStore } from '../lib/BracketStore.ts';
import useFocus from '../hooks/useFocus.ts';
import { FileUploadModal, type ParsedData } from '../FileUploadModal.tsx';

export default function InputParticipants() {

    const bpstore = useStore();
    const [inputParticipantName, setInputParticipantName] = useState("");
    const inputRef = useFocus<HTMLInputElement>();
    
    function handleAddParticipant() {
        const name = inputParticipantName.trim();
        if (name !== null && name !== undefined) {
            if (name.length > 0) {
                try {
                    bpstore.addParticipant(name);
                    setInputParticipantName("");
                } catch (error) {
                    if (error instanceof Error) {
                        alert(error.message);
                    } else {
                        alert("An unknown error occurred while adding the participant.");
                    }
                }
            } else {
                alert("Participant name cannot be empty!");
            }
            inputRef.current?.focus();
        }
    }

    function handleAddParticipants(data : ParsedData) {
        console.log(data.headers); // string[]
        console.log(data.rows);    // Record<string, unknown>[]
        const newParticipants: string[] = 
            data.rows.map(record => Object.values(record).map(value => {return String(value)}).join(" ")).filter(name => name.trim().length > 0);
        const duplicates: string[] = bpstore.addParticipants(newParticipants);
        if (duplicates.length > 0) {
            alert(`The following participants were not added because they already exist: ${duplicates.join(", ")}`);
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
            <FileUploadModal onDataParsed={handleAddParticipants} />
        </div>
    )

}