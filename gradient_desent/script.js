// Configuration
let currentFunction = 'rugged';
let isRunning = false;
let animationId = null;
let w1 = 8, w2 = 8; // Current position (x, y)
let learningRate = 0.01;
let iteration = 0;
let pathX = [], pathY = [], pathZ = [];

// DOM Elements
const plotDiv = document.getElementById('plot');
const modelVizDiv = document.getElementById('model-viz');
const lossVizDiv = document.getElementById('loss-viz');
const lrInput = document.getElementById('lr');
const lrValue = document.getElementById('lrValue');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const functionSelect = document.getElementById('functionSelect');
const w1Display = document.getElementById('w1');
const w2Display = document.getElementById('w2');
const lossDisplay = document.getElementById('loss');
const iterDisplay = document.getElementById('iter');

// Math Functions
const MathFuncs = {
    rugged: {
        // f(x,y) = x^2 + y^2 - cos(3x) - cos(3y)
        f: (x, y) => x * x + y * y - Math.cos(3 * x) - Math.cos(3 * y),
        grad: (x, y) => ({ 
            dx: 2 * x + 3 * Math.sin(3 * x), 
            dy: 2 * y + 3 * Math.sin(3 * y) 
        }),
        range: [-5, 5]
    },
    ackley: {
        f: (x, y) => {
            const term1 = -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + y * y)));
            const term2 = -Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)));
            return term1 + term2 + 20 + Math.E;
        },
        grad: (x, y) => {
            const sqrtInner = 0.5 * (x * x + y * y);
            const sqrtTerm = Math.sqrt(sqrtInner);
            if (sqrtTerm < 1e-15) return { dx: 0, dy: 0 };

            const exp1 = Math.exp(-0.2 * sqrtTerm);
            const exp2 = Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)));

            const term1_dx = (2 * x * exp1) / sqrtTerm;
            const term2_dx = Math.PI * exp2 * Math.sin(2 * Math.PI * x);
            
            const term1_dy = (2 * y * exp1) / sqrtTerm;
            const term2_dy = Math.PI * exp2 * Math.sin(2 * Math.PI * y);

            return { dx: term1_dx + term2_dx, dy: term1_dy + term2_dy };
        },
        range: [-5, 5]
    }
};

// Initialize
function init() {
    try {
        if (typeof Plotly === 'undefined') {
            throw new Error("Plotly 库未能加载。请检查网络连接。");
        }

        // Event Listeners
        if (!lrInput || !functionSelect || !startBtn || !resetBtn) {
            throw new Error("无法找到控制元素 (DOM Elements missing)");
        }

        lrInput.addEventListener('input', (e) => {
            learningRate = parseFloat(e.target.value);
            lrValue.textContent = learningRate;
        });

        functionSelect.addEventListener('change', (e) => {
            currentFunction = e.target.value;
            reset(false);
            updatePlot(); // Re-draw surface
        });

        startBtn.addEventListener('click', toggleAnimation);
        resetBtn.addEventListener('click', () => reset(true));
        
        reset(false); // Initial setup
        updatePlot();
    } catch (e) {
        console.error(e);
        const plotDiv = document.getElementById('plot');
        if (plotDiv) {
            plotDiv.innerHTML = `<div style="padding: 20px; color: red;">
                <h3>发生错误 (Error)</h3>
                <p>${e.message}</p>
                <p>请尝试刷新页面或检查网络。</p>
            </div>`;
        }
        alert("初始化失败: " + e.message);
    }
}

function generateSurfaceData() {
    const func = MathFuncs[currentFunction];
    const range = func.range;
    const step = (range[1] - range[0]) / 50; // Resolution
    
    let x = [], y = [], z = [];
    
    for (let i = range[0]; i <= range[1]; i += step) {
        x.push(i);
        y.push(i);
    }
    
    for (let j = 0; j < y.length; j++) {
        let zRow = [];
        for (let i = 0; i < x.length; i++) {
            zRow.push(func.f(x[i], y[j]));
        }
        z.push(zRow);
    }
    
    return { x, y, z };
}

function updatePlot() {
    const data = generateSurfaceData();
    const func = MathFuncs[currentFunction];
    
    const surfaceTrace = {
        z: data.z,
        x: data.x,
        y: data.y,
        type: 'surface',
        opacity: 0.8,
        colorscale: 'Viridis',
        showscale: false,
        contours: {
            z: { show: true, usecolormap: true, highlightcolor: "#42f462", project: { z: true } }
        }
    };

    const pointTrace = {
        x: [w1],
        y: [w2],
        z: [func.f(w1, w2)],
        mode: 'markers',
        type: 'scatter3d',
        marker: {
            size: 8,
            color: 'red',
            symbol: 'circle',
            line: {
                color: 'white',
                width: 2
            }
        },
        name: 'Current Position'
    };

    const pathTrace = {
        x: pathX,
        y: pathY,
        z: pathZ,
        mode: 'lines',
        type: 'scatter3d',
        line: {
            color: 'yellow',
            width: 4
        },
        name: 'Trajectory'
    };

    const layout = {
        title: 'Loss Landscape (损失函数曲面)',
        autosize: true,
        scene: {
            xaxis: { title: 'w1 (Weight 1)' },
            yaxis: { title: 'w2 (Weight 2)' },
            zaxis: { title: 'Loss' },
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            }
        },
        margin: { l: 0, r: 0, b: 0, t: 50 }
    };

    Plotly.newPlot(plotDiv, [surfaceTrace, pathTrace, pointTrace], layout);
    updateStatus();
    updateModelViz();
    updateLossViz();
}

function updatePoint() {
    const func = MathFuncs[currentFunction];
    const z = func.f(w1, w2);
    
    // Update path history
    pathX.push(w1);
    pathY.push(w2);
    pathZ.push(z);

    // Efficiently update just the point and path
    Plotly.animate(plotDiv, {
        data: [
            { x: pathX, y: pathY, z: pathZ }, // Trace 1: Path
            { x: [w1], y: [w2], z: [z] }      // Trace 2: Point
        ],
        traces: [1, 2], 
        layout: {}
    }, {
        transition: { duration: 0 },
        frame: { duration: 0, redraw: true }
    });
    
    updateStatus();
    updateModelViz();
    updateLossViz();
}

function step() {
    if (!isRunning) return;

    const func = MathFuncs[currentFunction];
    const grad = func.grad(w1, w2);
    
    w1 = w1 - learningRate * grad.dx;
    w2 = w2 - learningRate * grad.dy;
    
    iteration++;
    updatePoint();
    
    animationId = requestAnimationFrame(step);
}

function toggleAnimation() {
    if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animationId);
        startBtn.textContent = "继续 (Resume)";
        startBtn.style.backgroundColor = "#4CAF50";
    } else {
        isRunning = true;
        startBtn.textContent = "暂停 (Pause)";
        startBtn.style.backgroundColor = "#ff9800";
        step();
    }
}

function reset(updateVisuals = true) {
    isRunning = false;
    cancelAnimationFrame(animationId);
    startBtn.textContent = "开始下降 (Start)";
    startBtn.style.backgroundColor = "#4CAF50";
    
    const func = MathFuncs[currentFunction];
    const range = func.range;
    
    // Random start position within range
    // For parabola, start further out to show descent clearly
    if (currentFunction === 'rugged') {
        w1 = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 1.5);
        w2 = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 1.5);
    } else {
        // For Ackley, random anywhere
        w1 = (Math.random() * (range[1] - range[0])) + range[0];
        w2 = (Math.random() * (range[1] - range[0])) + range[0];
    }

    pathX = [w1];
    pathY = [w2];
    pathZ = [func.f(w1, w2)];

    iteration = 0;
    if (updateVisuals) {
        updatePoint();
    }
}

function updateStatus() {
    const func = MathFuncs[currentFunction];
    w1Display.textContent = w1.toFixed(4);
    w2Display.textContent = w2.toFixed(4);
    lossDisplay.textContent = func.f(w1, w2).toFixed(4);
    iterDisplay.textContent = iteration;
}

function updateModelViz() {
    // Simulate a linear regression task: y = w1*x + w2
    // Target is y = 0 (since optimal w1=0, w2=0 roughly)
    // We show fixed data points around y=0 and the current model line
    
    const xRange = [-2, 2];
    const xPoints = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];
    const yPoints = xPoints.map(x => 0 + (Math.random() - 0.5) * 0.5); // Noisy data around y=0

    const lineX = [-2, 2];
    // Current model prediction: y = w1*x + w2
    // Note: w1 is slope, w2 is intercept
    // Scale down w1/w2 slightly to make visual fit better if weights are large
    const lineY = lineX.map(x => (w1 * 0.2) * x + (w2 * 0.2)); 

    const dataTrace = {
        x: xPoints,
        y: yPoints,
        mode: 'markers',
        type: 'scatter',
        name: 'Target Data',
        marker: { color: 'blue', size: 10 }
    };

    const modelTrace = {
        x: lineX,
        y: lineY,
        mode: 'lines',
        type: 'scatter',
        name: 'Model Prediction',
        line: { color: 'red', width: 3 }
    };

    const layout = {
        title: 'Model Performance (Linear Regression)',
        xaxis: { title: 'Input (x)', range: [-2, 2] },
        yaxis: { title: 'Output (y)', range: [-5, 5] },
        margin: { l: 40, r: 20, b: 40, t: 40 },
        showlegend: true,
        legend: { x: 0, y: 1 }
    };

    Plotly.react(modelVizDiv, [dataTrace, modelTrace], layout);
}

function updateLossViz() {
    const trace = {
        y: pathZ,
        mode: 'lines',
        type: 'scatter',
        name: 'Loss'
    };

    const layout = {
        title: 'Loss over Iterations',
        xaxis: { title: 'Iteration' },
        yaxis: { title: 'Loss' },
        margin: { l: 40, r: 20, b: 40, t: 40 }
    };

    Plotly.react(lossVizDiv, [trace], layout);
}

// Ensure DOM is loaded before running
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}