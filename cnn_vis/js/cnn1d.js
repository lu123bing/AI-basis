// 1D CNN Logic
class CNN1D {
    constructor(canvasId, mathId) {
        this.canvas = document.getElementById(canvasId);
        this.mathContainer = document.getElementById(mathId);
        this.ctx = this.canvas.getContext('2d');
        
        // Preset Data
        this.input = [1, 0, 2, 3, 0, 1, 1, 2, 0, 1];
        this.kernel = [1, 0, -1];
        this.output = [];
        
        // Calculate full output
        for (let i = 0; i <= this.input.length - this.kernel.length; i++) {
            let sum = 0;
            for (let j = 0; j < this.kernel.length; j++) {
                sum += this.input[i + j] * this.kernel[j];
            }
            this.output.push(sum);
        }

        // Animation State
        this.step = 0;
        this.totalSteps = this.output.length;
        this.boxSize = 50;
        this.padding = 10;
        
        this.resize();
    }

    resize() {
        // Recalculate layout positions based on canvas size
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Center the visualization
        const totalInputWidth = this.input.length * (this.boxSize + this.padding);
        this.startX = (this.width - totalInputWidth) / 2;
        this.inputY = this.height * 0.3;
        this.kernelY = this.height * 0.1; // Above input
        this.outputY = this.height * 0.6;
    }

    setStep(step) {
        this.step = Math.max(0, Math.min(step, this.totalSteps - 1));
        this.draw();
        this.updateMath();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw Input Array
        this.input.forEach((val, i) => {
            const x = this.startX + i * (this.boxSize + this.padding);
            const isActive = i >= this.step && i < this.step + this.kernel.length;
            const color = isActive ? '#e3f2fd' : '#fff';
            const borderColor = isActive ? '#2196f3' : '#ccc';
            
            Utils.drawBox(this.ctx, x, this.inputY, this.boxSize, val, color, borderColor, '#000', `x[${i}]`);
        });

        // Draw Kernel (Sliding)
        // The kernel position depends on the current step
        const kernelStartX = this.startX + this.step * (this.boxSize + this.padding);
        
        this.kernel.forEach((val, i) => {
            const x = kernelStartX + i * (this.boxSize + this.padding);
            Utils.drawBox(this.ctx, x, this.kernelY, this.boxSize, val, '#fff9c4', '#fbc02d', '#000', `k[${i}]`);
            
            // Draw connecting lines to input
            const inputX = x + this.boxSize / 2;
            Utils.drawLine(this.ctx, inputX, this.kernelY + this.boxSize, inputX, this.inputY, '#fbc02d', 2);
        });

        // Draw Output Array
        this.output.forEach((val, i) => {
            const x = this.startX + i * (this.boxSize + this.padding); // Align with input start for now
            // Or maybe center it? Let's align with the center of the kernel window
            // The kernel window starts at index 'i' of input.
            // Center of kernel window is: startX + i*(size+pad) + (kernelLen*(size+pad))/2
            
            const kernelCenterOffset = (this.kernel.length * (this.boxSize + this.padding) - this.padding) / 2;
            const outputX = this.startX + i * (this.boxSize + this.padding) + kernelCenterOffset - (this.boxSize/2);

            const isCalculated = i <= this.step;
            const isCurrent = i === this.step;
            
            let color = '#fff';
            let borderColor = '#ccc';
            let value = '';

            if (isCalculated) {
                value = val;
                borderColor = '#4caf50';
                if (isCurrent) {
                    color = '#e8f5e9';
                    borderColor = '#2e7d32';
                }
            }

            Utils.drawBox(this.ctx, outputX, this.outputY, this.boxSize, value, color, borderColor, '#000', `y[${i}]`);

            // Draw connecting lines from input window to output if current
            if (isCurrent) {
                const outputCenterX = outputX + this.boxSize / 2;
                // Connect from center of input window
                const inputWindowCenterX = kernelStartX + kernelCenterOffset;
                Utils.drawLine(this.ctx, inputWindowCenterX, this.inputY + this.boxSize, outputCenterX, this.outputY, '#2e7d32', 2);
            }
        });
    }

    updateMath() {
        let html = `<div style="font-size: 1.1em; margin-bottom: 10px;"><strong>Step ${this.step + 1}:</strong> Calculate Output y[${this.step}]</div>`;
        html += `<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">`;
        
        let calculationStr = [];
        let sum = 0;

        for (let j = 0; j < this.kernel.length; j++) {
            const inputVal = this.input[this.step + j];
            const kernelVal = this.kernel[j];
            const product = inputVal * kernelVal;
            sum += product;
            
            calculationStr.push(
                `<span class="term">
                    (<span style="color: #2196f3">x[${this.step + j}]</span>=${inputVal} × 
                     <span style="color: #fbc02d">k[${j}]</span>=${kernelVal})
                </span>`
            );
        }

        html += calculationStr.join(' + ');
        html += ` = <strong>${sum}</strong></div>`;
        
        this.mathContainer.innerHTML = html;
    }

    getStepAt(x, y) {
        // 1. Check Output Array (Click to set specific output step)
        // Output Y range: this.outputY to this.outputY + this.boxSize
        if (y >= this.outputY && y <= this.outputY + this.boxSize) {
            const kernelCenterOffset = (this.kernel.length * (this.boxSize + this.padding) - this.padding) / 2;
            const startX = this.startX + kernelCenterOffset - (this.boxSize/2);
            const totalWidth = this.boxSize + this.padding;
            
            const index = Math.floor((x - startX) / totalWidth);
            
            if (index >= 0 && index < this.output.length) {
                return index;
            }
        }

        // 2. Check Input Array (Slide window by dragging on input)
        // Input Y range: this.inputY to this.inputY + this.boxSize
        if (y >= this.inputY && y <= this.inputY + this.boxSize) {
            const totalWidth = this.boxSize + this.padding;
            const index = Math.floor((x - this.startX) / totalWidth);
            
            if (index >= 0 && index < this.input.length) {
                // Calculate which step would center the kernel (roughly) around this input index
                // Step corresponds to the start index of the kernel on the input.
                // If user clicks index 'i', we want 'i' to be in the middle of the kernel.
                // Kernel center offset = floor(kernel.length / 2)
                const kernelCenter = Math.floor(this.kernel.length / 2);
                const targetStep = index - kernelCenter;
                
                // Clamp to valid steps
                if (targetStep >= 0 && targetStep < this.totalSteps) {
                    return targetStep;
                }
                // If out of bounds, clamp to nearest edge
                if (targetStep < 0) return 0;
                if (targetStep >= this.totalSteps) return this.totalSteps - 1;
            }
        }

        return null;
    }
}
