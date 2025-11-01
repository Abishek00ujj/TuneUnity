import React, { useEffect, useRef } from 'react';

const RandomBeatVisualizer = ({ data }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        let animationId;
        const bars = 50;
        const barWidth = width / bars;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < bars; i++) {
                const barHeight = Math.random() * height * 0.8;
                const x = i * barWidth;
                const y = height - barHeight;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, y, 0, height);
                gradient.addColorStop(0, data || '#00ff00');
                gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth - 2, barHeight);
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="rounded-lg"
            style={{ maxWidth: '100%' }}
        />
    );
};

export default RandomBeatVisualizer;
