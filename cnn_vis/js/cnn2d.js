// 2D CNN Logic
class CNN2D {
    constructor(canvasId, mathId) {
        this.canvas = document.getElementById(canvasId);
        this.mathContainer = document.getElementById(mathId);
        this.ctx = this.canvas.getContext('2d');
        
        // Preset Data (5x5 Input, 3x3 Kernel)
        this.input = [
            [1, 1, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 1, 1],
            [0, 0, 1, 1, 0],
            [0, 1, 1, 0, 0]
        ];
        
        // Edge detection kernel
        this.kernel = [
            [1, 0, -1],
            [1, 0, -1],
            [1, 0, -1]
        ];
        
        this.output = [];
        this.calculateOutput();

        // Animation State
        this.step = 0;
        this.outputRows = this.output.length;
        this.outputCols = this.output[0].length;
        this.totalSteps = this.outputRows * this.outputCols;
        
        this.boxSize = 40;
        this.padding = 5;
        
        this.resize();
    }

    calculateOutput() {
        const inputRows = this.input.length;
        const inputCols = this.input[0].length;
        const kernelRows = this.kernel.length;
        const kernelCols = this.kernel[0].length;
        
        for (let i = 0; i <= inputRows - kernelRows; i++) {
            const row = [];
            for (let j = 0; j <= inputCols - kernelCols; j++) {
                let sum = 0;
                for (let ki = 0; ki < kernelRows; ki++) {
                    for (let kj = 0; kj < kernelCols; kj++) {
                        sum += this.input[i + ki][j + kj] * this.kernel[ki][kj];
                    }
                }
                row.push(sum);
            }
            this.output.push(row);
        }
    }

    resize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Layout: Input Left, Kernel Middle (Top), Output Right
        // Actually, let's do Input Left, Output Right, Kernel floating
        
        const gridWidth = (cols) => cols * (this.boxSize + this.padding);
        const gridHeight = (rows) => rows * (this.boxSize + this.padding);
        
        this.inputX = this.width * 0.1;
        this.inputY = (this.height - gridHeight(this.input.length)) / 2;
        
        this.outputX = this.width * 0.6;
        this.outputY = (this.height - gridHeight(this.output.length)) / 2;
        
        // Kernel display position (static legend)
        this.kernelDisplayX = this.width * 0.4;
        this.kernelDisplayY = this.height * 0.1;
    }

    setStep(step) {
        this.step = Math.max(0, Math.min(step, this.totalSteps - 1));
        this.draw();
        this.updateMath();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Current position in output (row, col)
        const outRow = Math.floor(this.step / this.outputCols);
        const outCol = this.step % this.outputCols;

        // 1. Draw Static Kernel Legend (So user can see weights clearly)
        this.drawGrid(this.kernel, this.kernelDisplayX, this.kernelDisplayY, () => ({
            color: '#fff9c4',
            borderColor: '#fbc02d'
        }), 'Kernel / Filter');

        // 2. Draw Input Grid
        this.drawGrid(this.input, this.inputX, this.inputY, (r, c) => {
            // Highlight logic
            const inKernelWindow = r >= outRow && r < outRow + this.kernel.length &&
                                   c >= outCol && c < outCol + this.kernel[0].length;
            
            if (inKernelWindow) {
                // Calculate relative kernel position to get the weight
                const kRow = r - outRow;
                const kCol = c - outCol;
                const kVal = this.kernel[kRow][kCol];
                
                // Return style with corner value
                return { 
                    color: '#e3f2fd', 
                    borderColor: '#2196f3',
                    cornerValue: kVal // Show kernel weight in corner
                };
            }
            return { color: '#fff', borderColor: '#ccc' };
        }, 'Input');

        // 3. Draw Output Grid
        this.drawGrid(this.output, this.outputX, this.outputY, (r, c) => {
            const index = r * this.outputCols + c;
            if (index < this.step) return { color: '#e8f5e9', borderColor: '#4caf50', showVal: true };
            if (index === this.step) return { color: '#c8e6c9', borderColor: '#2e7d32', showVal: true }; // Current
            return { color: '#fff', borderColor: '#eee', showVal: false };
        }, 'Output');

        // 4. Draw Kernel Window Border (Thick Overlay)
        const kernelX = this.inputX + outCol * (this.boxSize + this.padding);
        const kernelY = this.inputY + outRow * (this.boxSize + this.padding);
        const kWidth = this.kernel[0].length * (this.boxSize + this.padding) - this.padding;
        const kHeight = this.kernel.length * (this.boxSize + this.padding) - this.padding;

        this.ctx.beginPath();
        this.ctx.rect(kernelX - 2, kernelY - 2, kWidth + 4, kHeight + 4); // Slightly larger
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#f57f17'; // Darker yellow/orange
        this.ctx.stroke();

        // Draw Connecting Lines (Center of Kernel Window -> Center of Output Cell)
        const kCenterX = kernelX + kWidth / 2;
        const kCenterY = kernelY + kHeight / 2;
        
        const outCellX = this.outputX + outCol * (this.boxSize + this.padding) + this.boxSize/2;
        const outCellY = this.outputY + outRow * (this.boxSize + this.padding) + this.boxSize/2;
        
        Utils.drawLine(this.ctx, kCenterX, kCenterY, outCellX, outCellY, '#2196f3', 2);
    }

    drawGrid(matrix, startX, startY, styleFn, label) {
        matrix.forEach((row, i) => {
            row.forEach((val, j) => {
                const x = startX + j * (this.boxSize + this.padding);
                const y = startY + i * (this.boxSize + this.padding);
                
                const style = styleFn(i, j);
                const displayVal = (style.showVal === false) ? '' : val;
                
                Utils.drawBox(this.ctx, x, y, this.boxSize, displayVal, style.color, style.borderColor, '#000', null, style.cornerValue);
            });
        });

        if (label) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Roboto';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, startX + (matrix[0].length * (this.boxSize + this.padding))/2, startY - 15);
        }
    }

    updateMath() {
        const outRow = Math.floor(this.step / this.outputCols);
        const outCol = this.step % this.outputCols;
        
        let html = `<div style="font-size: 1.1em; margin-bottom: 10px;"><strong>Step ${this.step + 1}:</strong> Output[${outRow}][${outCol}]</div>`;
        html += `<div style="font-family: monospace; font-size: 0.9em;">`;
        
        let sum = 0;
        
        // Show matrix multiplication style
        for (let i = 0; i < this.kernel.length; i++) {
            html += `<div>`;
            for (let j = 0; j < this.kernel[0].length; j++) {
                const inVal = this.input[outRow + i][outCol + j];
                const kVal = this.kernel[i][j];
                sum += inVal * kVal;
                
                html += `(<span style="color: #2196f3">${inVal}</span>×<span style="color: #fbc02d">${kVal}</span>)`;
                if (j < this.kernel[0].length - 1) html += ` + `;
            }
            html += `</div>`;
        }
        
        html += `<div style="margin-top: 5px; border-top: 1px solid #ccc;">Sum = <strong>${sum}</strong></div>`;
        html += `</div>`;
        
        this.mathContainer.innerHTML = html;
    }

    getStepAt(x, y) {
        // 1. Check Output Grid (Click to set specific output step)
        const outGridWidth = this.outputCols * (this.boxSize + this.padding);
        const outGridHeight = this.outputRows * (this.boxSize + this.padding);
        
        if (x >= this.outputX && x <= this.outputX + outGridWidth &&
            y >= this.outputY && y <= this.outputY + outGridHeight) {
            
            const col = Math.floor((x - this.outputX) / (this.boxSize + this.padding));
            const row = Math.floor((y - this.outputY) / (this.boxSize + this.padding));
            
            if (col >= 0 && col < this.outputCols && row >= 0 && row < this.outputRows) {
                return row * this.outputCols + col;
            }
        }

        // 2. Check Input Grid (Slide window by dragging on input)
        const inGridWidth = this.input[0].length * (this.boxSize + this.padding);
        const inGridHeight = this.input.length * (this.boxSize + this.padding);

        if (x >= this.inputX && x <= this.inputX + inGridWidth &&
            y >= this.inputY && y <= this.inputY + inGridHeight) {
            
            const col = Math.floor((x - this.inputX) / (this.boxSize + this.padding));
            const row = Math.floor((y - this.inputY) / (this.boxSize + this.padding));
            
            if (col >= 0 && col < this.input[0].length && row >= 0 && row < this.input.length) {
                // Calculate target step to center kernel on this cell
                const kCenterRow = Math.floor(this.kernel.length / 2);
                const kCenterCol = Math.floor(this.kernel[0].length / 2);
                
                let targetRow = row - kCenterRow;
                let targetCol = col - kCenterCol;
                
                // Clamp to valid output range
                targetRow = Math.max(0, Math.min(targetRow, this.outputRows - 1));
                targetCol = Math.max(0, Math.min(targetCol, this.outputCols - 1));
                
                return targetRow * this.outputCols + targetCol;
            }
        }

        return null;
    }
}
