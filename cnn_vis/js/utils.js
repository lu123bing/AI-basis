// Utility functions
const Utils = {
    drawBox: (ctx, x, y, size, value, color = '#fff', borderColor = '#000', textColor = '#000', label = null, cornerValue = null) => {
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        // Main Value (Center)
        if (value !== null && value !== undefined && value !== '') {
            ctx.fillStyle = textColor;
            ctx.font = 'bold 16px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, x + size / 2, y + size / 2);
        }

        // Corner Value (Bottom-Right, for Kernel weights)
        if (cornerValue !== null && cornerValue !== undefined) {
            ctx.fillStyle = '#d32f2f'; // Reddish for weights
            ctx.font = 'bold 12px Roboto';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(cornerValue, x + size - 4, y + size - 4);
        }

        if (label) {
            ctx.fillStyle = '#666';
            ctx.font = '12px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom'; // Reset baseline
            ctx.fillText(label, x + size / 2, y + size + 15);
        }
    },

    drawLine: (ctx, x1, y1, x2, y2, color = '#ccc', width = 1) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    },

    // Helper to get color based on value (heatmap style)
    getValueColor: (value, min, max) => {
        // Simple grayscale for now, or blue-ish
        // Normalize
        const norm = (value - min) / (max - min || 1);
        const intensity = Math.floor(255 * (1 - norm)); // Darker for higher values
        return `rgb(${intensity}, ${intensity}, 255)`;
    }
};
