document.addEventListener('DOMContentLoaded', () => {
    // Initialize Visualizers
    const cnn1d = new CNN1D('canvas-1d', 'math-1d');
    const cnn2d = new CNN2D('canvas-2d', 'math-2d'); // Placeholder for now

    let activeVisualizer = cnn1d;
    let isPlaying = false;
    let animationSpeed = 1000; // ms per step (default slow)
    let lastStepTime = 0;
    let animationFrameId = null;

    // Controls
    const btnPlay = document.getElementById('btn-play');
    const btnReset = document.getElementById('btn-reset');
    const sliderSpeed = document.getElementById('speed-slider');
    const stepInfo = document.getElementById('step-info');
    const playIcon = btnPlay.querySelector('.material-icons');

    // Initial Draw
    updateUI();

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            // Add active class to clicked
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`view-${tabId}`).classList.add('active');
            
            // Switch active visualizer
            activeVisualizer = tabId === '1d' ? cnn1d : cnn2d;
            
            // Resize and redraw
            resizeCanvases();
            updateUI();
        });
    });

    // Control EventListeners
    btnPlay.addEventListener('click', togglePlay);
    btnReset.addEventListener('click', reset);
    
    sliderSpeed.addEventListener('input', (e) => {
        // Map 1-10 to speed (1000ms to 100ms)
        const val = parseInt(e.target.value);
        animationSpeed = 1100 - (val * 100); 
    });

    function togglePlay() {
        isPlaying = !isPlaying;
        playIcon.textContent = isPlaying ? 'pause' : 'play_arrow';
        
        if (isPlaying) {
            lastStepTime = performance.now();
            loop();
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    }

    function reset() {
        isPlaying = false;
        playIcon.textContent = 'play_arrow';
        cancelAnimationFrame(animationFrameId);
        activeVisualizer.setStep(0);
        updateUI();
    }

    function loop(timestamp) {
        if (!isPlaying) return;

        if (!lastStepTime) lastStepTime = timestamp;
        const elapsed = timestamp - lastStepTime;

        if (elapsed > animationSpeed) {
            if (activeVisualizer.step < activeVisualizer.totalSteps - 1) {
                activeVisualizer.setStep(activeVisualizer.step + 1);
                updateUI();
                lastStepTime = timestamp;
            } else {
                // Auto pause at end
                togglePlay();
                return;
            }
        }

        animationFrameId = requestAnimationFrame(loop);
    }

    function updateUI() {
        if (activeVisualizer) {
            activeVisualizer.draw();
            activeVisualizer.updateMath(); // Ensure math is updated
            stepInfo.textContent = `Step: ${activeVisualizer.step + 1} / ${activeVisualizer.totalSteps}`;
        }
    }

    function resizeCanvases() {
        const containers = document.querySelectorAll('.canvas-container');
        containers.forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                
                // Notify visualizer of resize if method exists
                if (activeVisualizer && activeVisualizer.canvas === canvas) {
                    if (activeVisualizer.resize) activeVisualizer.resize();
                    activeVisualizer.draw();
                }
            }
        });
    }

    // Initial resize
    window.addEventListener('resize', resizeCanvases);
    // Delay slightly to ensure layout is done
    setTimeout(() => {
        resizeCanvases();
        activeVisualizer.setStep(0); // Initial render
    }, 100);

    // Mouse Interaction
    const canvasContainers = document.querySelectorAll('.canvas-container');
    canvasContainers.forEach(container => {
        const canvas = container.querySelector('canvas');
        let isDragging = false;

        const handleInput = (e) => {
            if (!activeVisualizer) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if visualizer has hit detection
            if (activeVisualizer.getStepAt) {
                const step = activeVisualizer.getStepAt(x, y);
                if (step !== null) {
                    activeVisualizer.setStep(step);
                    updateUI();
                    // Pause if playing to avoid conflict
                    if (isPlaying) togglePlay();
                }
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleInput(e);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleInput(e);
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    });
});
