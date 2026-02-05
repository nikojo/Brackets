import { makeAutoObservable } from "mobx";
import { createContext, useContext } from 'react'

class BracketParticipantsStore {

    participants: string[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    addParticipant(name: string) {
        this.participants.push(name);
    }

    removeParticipant(name: string) {
        this.participants = this.participants.filter(participant => participant !== name);
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
}

const bpstore = new BracketParticipantsStore();
const ParticipantStore = createContext(bpstore);

export const useStore = () => {
  return useContext(ParticipantStore);
}

export { BracketParticipantsStore, ParticipantStore };

export default bpstore;