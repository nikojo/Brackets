import { makeAutoObservable } from "mobx";
import { createContext, useContext } from 'react'
import { InitialBracketStructure } from "./BracketGenerator";

class BracketStore {
    depth: number = 0;
    rounds: number = 0;
    brackets: (string | undefined | null)[][] = [[undefined]];
    participantCount: number = 0;

    thirdPlaceTop : string | null = null;
    thirdPlaceBottom : string | null = null;
    thirdPlace : string | null = null;  // winner of the third place match, if applicable

    constructor() {
        //makeAutoObservable(this);
    }

    setParticipants(bracketParticipants: string[]) {
        const init = new InitialBracketStructure(bracketParticipants.length);
        this.rounds = init.rounds;
        this.brackets = [];
        this.participantCount = bracketParticipants.length;
        // Create the bracket structure with the correct number of rounds and slots
        for (let i = 0; i <= this.rounds; i++) {
            // null in the first round means there is no participant, undefined in other rounds 
            // means the match has not been played yet
            const arr = new Array(Math.pow(2, i)).fill(i == this.rounds ? null : undefined);
            this.brackets.push(arr);
        }
        //Now put in the participant names
        for (let i = 0; i < bracketParticipants.length; i++) {
            const pos = init.getPosition(i);
            this.brackets[pos.column][pos.row] = bracketParticipants[i];
        }
    }
}

class BracketParticipantsStore {

    participants: string[] = [];
    bracketStore: BracketStore = new BracketStore();

    constructor() {
        makeAutoObservable(this);
    }

    addParticipant(name: string) {
        if (this.participants.includes(name)) throw new Error("Participant with name '" + name + "' already exists!");
        this.participants.push(name);
        this.regenerateBracketStore();
    }

    private mergeArraysAndFindDuplicates<T>(arr1: T[], arr2: T[]): { uniqueArray: T[], duplicates: T[] } {
        // Combine both arrays
        const mergedArray = [...arr1, ...arr2];

        const uniqueElements = new Set<T>();
        const duplicatesList: T[] = [];

        for (const item of mergedArray) {
            if (uniqueElements.has(item)) {
                // If the element is already in the unique set, it's a duplicate
                duplicatesList.push(item);
            } else {
                // Otherwise, add it to the unique set
                uniqueElements.add(item);
            }
        }

        // Convert the Set back to an array to get the final unique array
        const uniqueArray = [...uniqueElements];

        return {
            uniqueArray,
            duplicates: duplicatesList
        };
    }

    addParticipants(names: string[]) : string[] {
        const { uniqueArray, duplicates } = this.mergeArraysAndFindDuplicates(this.participants, names);
        this.participants = uniqueArray;
        this.regenerateBracketStore();
        return duplicates;
    }

    removeParticipant(name: string) {
        this.participants = this.participants.filter(participant => participant !== name);
        this.regenerateBracketStore();
    }

    getParticipantIx(name: string) : number {
        return this.participants.indexOf(name);
    }

       swapParticipants(nameA: string, nameB: string) {
        const ixA = this.getParticipantIx(nameA);
        const ixB = this.getParticipantIx(nameB);
        if (ixA === -1 || ixB === -1) return;
        [this.participants[ixA], this.participants[ixB]] = [this.participants[ixB], this.participants[ixA]];
    }

    regenerateBracketStore() {
        this.bracketStore.setParticipants(this.participants);
    }
}

const bpstore = new BracketParticipantsStore();
const ParticipantStore = createContext(bpstore);

export const useStore = () => {
  return useContext(ParticipantStore);
}

export { BracketStore, BracketParticipantsStore, ParticipantStore };

export default bpstore;