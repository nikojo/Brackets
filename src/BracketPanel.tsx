import { useRef, useState, useEffect, type MouseEvent } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from './lib/BracketStore.ts';

const BracketPanel = observer(() => {
    const bpstore = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

 
    // bounding boxes
    type BoundingBox = { x: number, y: number, width: number, height: number,
        participant: string};

    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
        
    const findBoundingBox = (x: number, y: number) => {
        return boundingBoxes.find(box => x >= box.x && x <= box.x + box.width && y >= box.y - box.height && y <= box.y);
    }

    const closeMenu = () => {
        setMenuPos(null);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let isPrinting = false;

        const resizeCanvas = () => {
            const context = canvas.getContext('2d');
            if (!context) return;

            // Set canvas resolution to match display size
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            if (isPrinting) {
                const width = Math.max(bpstore.rounds * 150 + (bpstore.isKata ? 350 : 200), 900);
                const height = Math.round(width * 11 / 8.5);
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            } else {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
            }

            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            context.scale(dpr, dpr);

            // Drawing code
            context.clearRect(0, 0, canvas.width, canvas.height);

            /*
            // For verifying the client area
            context.strokeStyle = "blue";
            context.lineWidth = 4;
            context.strokeRect(5, 5, canvas.width-10, canvas.height-10);
            */

            context.font = '12pt Arial';
            context.fillStyle = 'black';

            // Add description at the top
            context.fillText(bpstore.description + " - " + (bpstore.isKata ? "Kata" : "Kumite"), 20, 20);

            // Draw the bracket and record bounding boxes for interaction
            const newBoundingBoxes: BoundingBox[] = [];
            const titlebarHeight = 50
            const leftMargin = 20;
            for (let round = bpstore.brackets.length - 1; round >= 0; round--) {
                const x = (bpstore.rounds - round) * 150 + leftMargin;
                const rows = bpstore.brackets[round].length;
                const spacing = (canvas.height - titlebarHeight) / (rows * 2);
                for (let pos = 0; pos < rows; pos++) {
                    const participant = bpstore.brackets[round][pos];
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
                        newBoundingBoxes.push({ x: x-2, y, width, height, participant: text });
                    }
                }
            }
            setBoundingBoxes(newBoundingBoxes);

            // Draw third place bracket if applicable
            if (!bpstore.isKata && bpstore.participants.length > 3 && bpstore.hasThirddPlaceMatch) {
                let x = (bpstore.rounds - 1) * 150 + leftMargin;
                let y = titlebarHeight + 20;
                // red participant
                context.strokeStyle = "red";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.lineTo(x + 150, y + 20);
                context.stroke();
                context.fillText(bpstore.thirdPlaceTop || "", x, y - 4);
                // black participant
                y = titlebarHeight + 60;
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.lineTo(x + 150, y - 20);
                context.stroke();
                context.fillText(bpstore.thirdPlaceBottom || "", x, y - 4);
                // Third place
                x += 150;
                y = titlebarHeight + 40;
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + 150, y);
                context.stroke();
                context.fillText(bpstore.thirdPlace || "", x, y - 4);
            }

            // draw kata and scores if applicable
            if (bpstore.isKata) {
                const x = (bpstore.rounds + 1) * 150 + leftMargin;
                const kataScoringNum = bpstore.isTop4 ? 4 : 8;
                const spacing = (canvas.height - titlebarHeight) / (kataScoringNum * 2);
                for (let i = 0; i < Math.min(bpstore.participants.length, kataScoringNum); i++) {
                    const y = titlebarHeight + Math.floor(((kataScoringNum - (i + 1)) * 2 * spacing) + spacing);
                    context.fillText("kata: ______________", x, y - (spacing / 4));
                    context.fillText("score: _____________", x, y + (spacing / 4));
                }
            }
        };

        // redraw before printing
        const handlePrint = () => {
            isPrinting = true;
            resizeCanvas();
        }
        window.addEventListener('beforeprint', handlePrint);

        const handleAfterPrint = () => {
            isPrinting = false;
            resizeCanvas();
        }
        window.addEventListener('afterprint', handleAfterPrint);


        // Initial render
        resizeCanvas();

        // Listen for window resize
        window.addEventListener('resize', resizeCanvas);
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('beforeprint', handlePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, 
    [
        bpstore, 
        bpstore.participants.length, 
        bpstore.brackets,
        bpstore.hasThirddPlaceMatch, 
        bpstore.isKata,
        bpstore.isSeededMatch,
        bpstore.description,
    ]);

    const deleteParticipant = () => {
        const boundingBox = findBoundingBox(menuPos!.x, menuPos!.y); // get participant from bounding box
        if (boundingBox) {
            bpstore.removeParticipant(boundingBox.participant);
        }
    }

    const swapParticipants = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.style.cursor = 'move';
        const boundingBox = findBoundingBox(menuPos!.x, menuPos!.y);
        if (boundingBox) {
            setSelectedParticipant(boundingBox.participant);
        }
    }

    const renameParticipant = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;   
        const boundingBox = findBoundingBox(menuPos!.x, menuPos!.y);
        if (boundingBox) {
            const newName = prompt("Enter new name:", boundingBox.participant);
            if (newName) {
                try {
                    bpstore.renameParticipant(boundingBox.participant, newName);
                } catch (error) {
                    alert(error instanceof Error ? error.message : String(error));
                }
            }
        }
    }


    // handle mouse clicks to detect participant selection
    const handleMouseClick = (event: MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            closeMenu();
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const clickedBox = findBoundingBox(x, y)
        if (clickedBox) {
            if (selectedParticipant && selectedParticipant !== clickedBox.participant) {
                bpstore.swapParticipants(selectedParticipant, clickedBox.participant);
                setSelectedParticipant(null);
                canvas.style.cursor = 'default';
            }
            else {  
                setMenuPos({ x, y });
            }
        } else {
            setSelectedParticipant(null);
            canvas.style.cursor = 'default';
            closeMenu();
        }
    }


    return <div className="bracket-panel" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="bracket-panel" onClick={handleMouseClick} />
        {menuPos && (
            <div
            style={{
                position: 'absolute',
                top: `${menuPos.y}px`,
                left: `${menuPos.x}px`,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                zIndex: 1000,
                padding: '5px',
            }}
            >
            <button onClick={() => { deleteParticipant(); closeMenu(); }}>Delete</button>
            <button onClick={() => { renameParticipant(); closeMenu(); }}>Rename</button>
            <button onClick={() => { swapParticipants(); closeMenu(); }}>Swap...</button>
            </div>
        )}
    </div>;
});

export default BracketPanel;