import type { BracketStore } from "./BracketStore";

type Position = {
    column: number; // right to left, 0-indexed, nth column has 2^n slots
    row: number; // bottom to top, 0-indexed
}

class InitialBracketStructure {
    numParticipants: number;
    numberOfPairsInFirstRound: number; // number of pairs that will be in the first (potentially incomplete) round
    bracketStore: BracketStore;
    seedPositions: number[] = [];
    
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

        if (this.bracketStore.isSeededMatch) {
            this.buildSeedPositions();
        } else {
            this.seedPositions.length = 0; // clear seeded positions if not a seeded match
        }

        //Now put in the participant names
        for (let i = 0; i < this.numParticipants; i++) {
            const pos = this.getPosition(i);
            this.bracketStore.setBracketItem(pos.column, pos.row, this.bracketStore.participants[i]);
        }        
    }

    buildSeedPositions() {
        //create a list where the index is the participant index and the value is the position in the first round (0-indexed from the bottom).

        // First create a list where the participant index is the position in the first round
        const positions: number[] = [];
        const size = this.bracketStore.brackets[this.bracketStore.rounds].length;
        if (size === 0) return;

        for (let i = 1; i < size / 4; i++) {
            const even = i % 2 === 0;
            positions.splice(0, 0, i * 2 + (even ? 1: 2));
            positions.push(i * 2 + (even ? 2: 1));
        }
        positions.splice(0, 0, 1);
        positions.push(2);

        for (let i = positions.length - 1; i >= 0; i--) {
            positions.splice(i, 0, size + 1 - positions[i]);
        }

        // special case for kata
        if (this.bracketStore.isKata) {
            // for Kata put the higher seeds last
            const tmp: number[] = [];
            const quarter = size / 4;
            tmp.push(...positions.slice(0, quarter));
            tmp.push(...positions.slice(quarter * 3));
            tmp.push(...positions.slice(quarter * 2, quarter * 3));
            tmp.push(...positions.slice(quarter, quarter * 2));
            Object.assign(positions, tmp);
        }

        // now invert the list so that the index is the participant index and the value is the position in the first round
        this.seedPositions.length = 0;
        for (let i = 0; i < positions.length; i++) {
            this.seedPositions[i] = positions.findIndex((v) => v === i + 1);
        }

    }
  
    getPosition(participantIndex: number): Position {
        if (participantIndex < 0 || participantIndex >= this.numParticipants) {
            throw new Error("Participant index out of bounds");
        }

        if (this.bracketStore.isKata && this.numParticipants <= 4) {
            // For kata with less than 4 participants, we put them all in the first round and leave some slots empty
            return { column: 0, row: participantIndex };
        } else if (this.bracketStore.isSeededMatch) {
            if ((this.bracketStore.participants.length - participantIndex) <= (this.numberOfPairsInFirstRound * 2)) {
                // Put the participant in the first round
                const column = this.bracketStore.rounds;
                const row = this.seedPositions[participantIndex];
                return { column, row };
            } else {
                // Put the participant into the second round
                const column = this.bracketStore.rounds - 1;
                const row = Math.floor(this.seedPositions[participantIndex] / 2);
                return { column, row };
            }        
        } else {
            if (participantIndex < this.numberOfPairsInFirstRound * 2) {
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
}



export { InitialBracketStructure, type Position };
