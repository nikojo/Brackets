import { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from './lib/BracketStore.ts';

const BracketPanel = observer(() => {
    const bpstore = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // bounding boxes
        type BoundingBox = { x: number, y: number, width: number, height: number,
            participant: string};
        const boundingBoxes: BoundingBox[] = [];
        
        const resizeCanvas = () => {
            const context = canvas.getContext('2d');
            if (!context) return;

            boundingBoxes.length = 0; // Clear bounding boxes

            // Set canvas resolution to match display size
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            context.scale(dpr, dpr);

            // Drawing code
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.strokeStyle = "blue";
            context.lineWidth = 4;
            context.strokeRect(5, 5, canvas.width-10, canvas.height-10);

            context.font = '12pt Arial';
            context.fillStyle = 'black';

            // Add description at the top
            context.fillText(bpstore.description + " - " + (bpstore.isKata ? "Kata" : "Kumite"), 20, 20);

            // Draw the bracket
            const bracketStore = bpstore;
            const titlebarHeight = 50
            const leftMargin = 20;
            for (let round = bracketStore.brackets.length - 1; round >= 0; round--) {
                const x = (bracketStore.rounds - round) * 150 + leftMargin;
                const rows = bracketStore.brackets[round].length;
                const spacing = (canvas.height - titlebarHeight) / (rows * 2);
                for (let pos = 0; pos < rows; pos++) {
                    const participant = bracketStore.brackets[round][pos];
                    const y = titlebarHeight + Math.floor(((rows - (pos + 1)) * 2 * spacing) + spacing);

                    // draw lines
                    if (participant !== null) {
                        const topLine = round !== 0 && pos % 2 === 1;
                        context.strokeStyle = topLine ? "red" : "black";
                        context.lineWidth = 2;
                        context.beginPath();
                        context.moveTo(x, y);
                        context.lineTo(x + 150, y);
                        if (round !== 0) {
                            context.lineTo(x + 150, y + (topLine ? spacing : -spacing));
                        }
                        context.stroke();
                    }

                    const text = participant || "";
                    // Draw participant name
                    context.fillText(text, x, y - 4);
                    // Save bounding box for interaction
                    if (text != "") {
                        const metrics = context.measureText(text);
                        const width = Math.max(metrics.width, 10)+4;
                        const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                        boundingBoxes.push({ x: x-2, y, width, height, participant: text });
                    }
                }
            }

            // Draw third place bracket if applicable
            if (!bracketStore.isKata && bracketStore.participants.length > 3 && bracketStore.hasThirddPlaceMatch) {
                let x = (bracketStore.rounds - 1) * 150 + leftMargin;
                let y = titlebarHeight + 20;
                // red participant
                context.strokeStyle = "red";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.lineTo(x + 150, y + 20);
                context.stroke();
                context.fillText(bracketStore.thirdPlaceTop || "", x, y - 4);
                // black participant
                y = titlebarHeight + 60;
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.lineTo(x + 150, y - 20);
                context.stroke();
                context.fillText(bracketStore.thirdPlaceBottom || "", x, y - 4);
                // Third place
                x += 150;
                y = titlebarHeight + 40;
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.stroke();
                context.fillText(bracketStore.thirdPlace || "", x, y - 4);

            }
        };

        // redraw before printing
        const handlePrint = () => {
            resizeCanvas();
        }
        window.addEventListener('beforeprint', handlePrint);

        // handle mouse clicks to detect participant selection
        const handleMouseClick = (event: MouseEvent) => {
            const x = event.offsetX;
            const y = event.offsetY;
            const clickedBox = boundingBoxes.find(box => x >= box.x && x <= box.x + box.width && y >= box.y - box.height && y <= box.y);
            if (clickedBox) {
                console.log("Selected participant:", clickedBox.participant);
            }
        }
        window.addEventListener('click', handleMouseClick);
        
        // Initial render
        resizeCanvas();

        // Listen for window resize
        window.addEventListener('resize', resizeCanvas);
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('beforeprint', handlePrint);
            window.removeEventListener('click', handleMouseClick);
        };
    }, 
    [
        bpstore, 
        bpstore.participants.length, 
        bpstore.hasThirddPlaceMatch, 
        bpstore.isKata,
        bpstore.isSeededMatch,
        bpstore.description,
    ]);

    return <canvas ref={canvasRef} className="bracket-panel" />;
});

export default BracketPanel;