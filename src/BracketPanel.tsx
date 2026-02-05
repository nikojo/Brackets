import { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from './lib/BracketStore.ts';

const BracketPanel = observer(() => {
    const bpstore = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const context = canvas.getContext('2d');
            if (!context) return;

            // Set canvas resolution to match display size
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            context.scale(dpr, dpr);

            // Drawing code
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'lightblue';
            context.fillRect(50, 50, 10, 10);
            context.font = '12pt Arial';
            context.fillStyle = 'black';
            context.fillText(bpstore.participants.length.toString(), 60, 60);
        };

        // Initial render
        resizeCanvas();

        // Listen for window resize
        window.addEventListener('resize', resizeCanvas);
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [bpstore.participants.length]);

    return <canvas ref={canvasRef} className="bracket-panel" />;
});

export default BracketPanel;