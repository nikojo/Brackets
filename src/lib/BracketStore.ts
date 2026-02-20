import { makeAutoObservable } from "mobx";
import { createContext, useContext } from 'react'
import { InitialBracketStructure } from "./BracketGenerator";

class BracketStore {
    depth: number = 0;
    rounds: number = 0;
    brackets: (string | undefined)[][] = [[undefined]];
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
        console.log("bracket store after setting participants", this.brackets);
    }
}

class BracketParticipantsStore {

    participants: string[] = [];
    bracketStore: BracketStore = new BracketStore();

    constructor() {
        makeAutoObservable(this);
    }

    addParticipant(name: string) {
        this.participants.push(name);
        this.regenerateBracketStore();
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