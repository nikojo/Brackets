
type Position = {
    column: number; // right to left, 0-indexed, nth column has 2^n slots
    row: number; // top to bottom, 0-indexed
}

class InitialBracketStructure {
    rounds: number;
    numParticipants: number;
    constructor(numParticipants: number) {
        this.numParticipants = numParticipants;
        this.rounds = Math.ceil(Math.log2(numParticipants));
    }

    getPosition(participantIndex: number): Position {
        if (participantIndex < 0 || participantIndex >= this.numParticipants) {
            throw new Error("Participant index out of bounds");
        }
        const overflow = this.numParticipants - Math.pow(2, this.rounds - 1);
        if (participantIndex < overflow * 2) {
            const column = this.rounds - 1;
            const row = participantIndex - overflow;
            return { column, row };
        } else {
            const column = this.rounds - 2;
            const row = participantIndex - overflow * 2;
            return { column, row };
        }
    }
}

export { InitialBracketStructure, type Position };
