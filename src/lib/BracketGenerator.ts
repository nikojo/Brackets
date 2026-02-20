
type Position = {
    column: number; // right to left, 0-indexed, nth column has 2^n slots
    row: number; // bottom to top, 0-indexed
}

class InitialBracketStructure {
    rounds: number; // count from 1, number of rounds needed to determine a winner
    numParticipants: number;
    numberOfPairsInFirstRound: number; // number of pairs that will be in the first (potentially incomplete) round
    constructor(numParticipants: number) {
        this.numParticipants = numParticipants;
        this.rounds = Math.ceil(Math.log2(numParticipants));
        this.numberOfPairsInFirstRound = this.numParticipants - Math.pow(2, this.rounds - 1);
    }

    getPosition(participantIndex: number): Position {
        if (participantIndex < 0 || participantIndex >= this.numParticipants) {
            throw new Error("Participant index out of bounds");
        }

        if (participantIndex < this.numberOfPairsInFirstRound * 2) {
            // Put the participant in the first round
            const column = this.rounds;
            const row = participantIndex;
            return { column, row };
        } else {
            // Put the participant into the second round
            const column = this.rounds - 1;
            const row = participantIndex - this.numberOfPairsInFirstRound;
            return { column, row };
        }
    }
}



export { InitialBracketStructure, type Position };
