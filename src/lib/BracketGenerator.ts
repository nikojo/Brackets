import type { BracketStore } from "./BracketStore";

type Position = {
    column: number; // right to left, 0-indexed, nth column has 2^n slots
    row: number; // bottom to top, 0-indexed
}

class InitialBracketStructure {
    numParticipants: number;
    numberOfPairsInFirstRound: number; // number of pairs that will be in the first (potentially incomplete) round
    bracketStore: BracketStore;
    
    constructor(bStore: BracketStore) {
        this.bracketStore = bStore;
        this.numParticipants = bStore.participants.length;
        this.numberOfPairsInFirstRound = 0;

        this.bracketStore.brackets = [];
        if (this.bracketStore.isKata && this.numParticipants <= 4) {
            this.bracketStore.brackets.push(new Array(4).fill(null));
            this.bracketStore.rounds = 0;
        } else {
            const kataAdjust = bStore.isKata ? 2 : 0; // Kata has 2 less rounds than kumite
            this.bracketStore.rounds = Math.ceil(Math.log2(this.numParticipants)) - kataAdjust;
            this.numberOfPairsInFirstRound = this.numParticipants - Math.pow(2, this.bracketStore.rounds - 1 + kataAdjust);
            
            // Create the bracket structure with the correct number of rounds and slots
            for (let i = 0; i <= this.bracketStore.rounds; i++) {
                // null in the first round means there is no participant, undefined in other rounds 
                // means the match has not been played yet
                const arr = new Array(Math.pow(2, i + kataAdjust)).fill(i == this.bracketStore.rounds ? null : undefined);
                this.bracketStore.brackets.push(arr);
            }
        }

        //Now put in the participant names
        for (let i = 0; i < this.numParticipants; i++) {
            const pos = this.getPosition(i);
            this.bracketStore.brackets[pos.column][pos.row] = this.bracketStore.participants[i];
        }        
    }

    getPosition(participantIndex: number): Position {
        if (participantIndex < 0 || participantIndex >= this.numParticipants) {
            throw new Error("Participant index out of bounds");
        }

        if (this.bracketStore.isKata && this.numParticipants <= 4) {
            // For kata with less than 4 participants, we put them all in the first round and leave some slots empty
            return { column: 0, row: participantIndex };
        } else if (participantIndex < this.numberOfPairsInFirstRound * 2) {
            // Put the participant in the first round
            const column = this.bracketStore.rounds;
            const row = participantIndex;
            return { column, row };
        } else {
            // Put the participant into the second round
            const column = this.bracketStore.rounds - 1;
            const row = participantIndex - this.numberOfPairsInFirstRound;
            return { column, row };
        }
    }
}



export { InitialBracketStructure, type Position };
