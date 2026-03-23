import { makeAutoObservable } from "mobx";
import { createContext, useContext } from 'react'
import { InitialBracketStructure } from "./BracketGenerator";

class BracketStore {
    depth: number = 0;
    rounds: number = 0;
    brackets: (string | undefined | null)[][] = [[undefined]];
    participants: string[] = [];

    hasThirddPlaceMatch: boolean = false;
    isKata: boolean = true;

    thirdPlaceTop : string | null = null;
    thirdPlaceBottom : string | null = null;
    thirdPlace : string | null = null;  // winner of the third place match, if applicable

    constructor() {
        makeAutoObservable(this);
    }

    setIsKata(isKata: boolean) {
        this.isKata = isKata;
        this.regenerateBracketStore();
    }

    setHasThirdPlaceMatch(hasThirdPlaceMatch: boolean) {
        this.hasThirddPlaceMatch = hasThirdPlaceMatch;
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
        new InitialBracketStructure(this);
    }

    serialize(): string {
        const data = {
            depth: this.depth,
            rounds: this.rounds,
            brackets: this.brackets,
            participants: this.participants,
            hasThirdPlaceMatch: this.hasThirddPlaceMatch,
            isKata: this.isKata,
            thirdPlaceTop: this.thirdPlaceTop,
            thirdPlaceBottom: this.thirdPlaceBottom,
            thirdPlace: this.thirdPlace,
        };
        return JSON.stringify(data);
    }

    static deserialize(json: string): BracketStore {
        const data = JSON.parse(json);
        const store = new BracketStore();

        store.depth = data.depth;
        store.rounds = data.rounds;
        store.brackets = data.brackets;
        store.participants = data.participants;
        store.hasThirddPlaceMatch = data.hasThirdPlaceMatch;
        store.isKata = data.isKata;
        store.thirdPlaceTop = data.thirdPlaceTop ?? null;
        store.thirdPlaceBottom = data.thirdPlaceBottom ?? null;
        store.thirdPlace = data.thirdPlace ?? null;

        return store;
    }
}

const bpstore = new BracketStore();
const ParticipantStore = createContext(bpstore);

export const useStore = () => {
  return useContext(ParticipantStore);
}

export { BracketStore, ParticipantStore };

export default bpstore;