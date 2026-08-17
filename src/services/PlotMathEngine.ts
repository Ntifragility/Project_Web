/**
 * @file PlotMathEngine.ts
 * @description Centralized engine for processing MATH  blueprints and generating interactive plots.
 * Features include:
 * - Robust YAML-like parser for blueprint definitions.
 * - Dynamic mathematical evaluation sandbox with common engineering functions.
 * - Automatic Chart.js configuration generation for high-performance simulations.
 * 
 * MATH functions are defined in line 145
**/

/**
 * BLUEPRINT: Interface representing the structured data of a plotting blueprint.
 */
export interface PlotBlueprint {
    /** The title displayed on the control panel */
    title: string;
    /** The actual mathematical expression to evaluate (e.g., "sin(x)") */
    equation: string;
    /** Number of data points to sample (higher = smoother curve) */
    steps: number;
    /** Standard color code for the plot line */
    color: string;
    /** Dictionary of intermediate mathematical variables used in the equation */
    vars: Record<string, string>;
    /** Dictionary of user-adjustable parameters (sliders) */
    parameters: Record<string, { label: string; value: number; min: number; max: number; step?: number }>;
    /** Configuration for X and Y axes (titles, ranges) */
    axis: {
        x: { title?: string; min?: number; max?: number };
        y: { title?: string; min?: number; max?: number };
    };

    /** Function to initialize the Chart.js configuration */
    init?: (params: any) => any;
}

/**
 * PLOT: Core service responsible for turning declarative blueprints into functional plots.
 */
export class PlotMathEngine {

    /**
     * PARSER: TRANSLATOR ()
     * Parses a YAML-like blueprint string into a structured PlotBlueprint object.
     * This parser is designed to be indentation-agnostic and robust against varying input styles.
     * 
     * @param raw The raw string content from the blueprint:plot code block.
     * @returns A PlotBlueprint object filled with the parsed data.
     */
    public static parseBlueprint(raw: string): PlotBlueprint {
        const lines = raw.split(/\r?\n/);
        const config: PlotBlueprint = {
            title: '',
            equation: '0',
            steps: 500,
            color: 'rgb(255, 149, 0)',
            parameters: {},
            vars: {},
            axis: { x: {}, y: {} }
        };

        let currentSection = '';

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return; // Ignore empty lines and comments

            // Check if this line starts a new section (e.g., "params:", "vars:")
            const isSectionHeader = /^\S/.test(line);

            if (trimmed.includes(':') && isSectionHeader) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const val = line.substring(colonIndex + 1).trim();

                if (key === 'params' || key === 'parameters') {
                    currentSection = 'params';
                } else if (key === 'vars' || key === 'variables') {
                    currentSection = 'vars';
                } else if (key === 'axis') {
                    currentSection = 'axis';
                } else {
                    currentSection = ''; // Root level keys
                    if (key === 'title') config.title = val;
                    else if (key === 'equation') config.equation = val;
                    else if (key === 'steps') config.steps = parseInt(val) || 500;
                    else if (key === 'color') config.color = val;
                }
            } else if (trimmed.includes(':')) {
                // Secondary level keys (nested under params, vars, or axis)
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                const val = line.substring(colonIndex + 1).trim();

                // Detection for object-style values like { label: "...", value: 10 }
                const objMatch = val.match(/\{(.*)\}/);

                if (objMatch) {
                    const props: any = {};
                    objMatch[1].split(',').forEach(p => {
                        const [propKey, propVal] = p.split(':').map(s => s.trim());
                        if (propKey && propVal) {
                            let cleanVal: any = propVal.replace(/['"]/g, '').trim();
                            if (!isNaN(Number(cleanVal))) cleanVal = Number(cleanVal);
                            props[propKey] = cleanVal;
                        }
                    });

                    if (currentSection === 'params') config.parameters[key] = props;
                    if (currentSection === 'axis' && (key === 'x' || key === 'y')) (config.axis as any)[key] = props;
                } else if (currentSection === 'vars') {
                    config.vars[key] = val; // Store intermediate math formulas
                }
            }
        });

        // Bind the initialization logic so the UI can easily create the chart
        config.init = (params: any) => this.generateChartConfig(config, params);

        return config;
    }

    /**
     * Generates a Chart.js compatible configuration object from a blueprint and set of parameters.
     * This is where the mathematical evaluation actually occurs.
     * 
     * @param blueprint The parsed blueprint data.
     * @param params The numeric values from the sliders.
     * @returns An object formatted for the Chart.js constructor.
     */
    private static generateChartConfig(blueprint: PlotBlueprint, params: any) {
        // --- 1. SETUP BOUNDARIES ---
        const xMin = !isNaN(blueprint.axis.x.min as any) ? blueprint.axis.x.min! : -10;
        const xMax = !isNaN(blueprint.axis.x.max as any) ? blueprint.axis.x.max! : 10;
        const yMin = !isNaN(blueprint.axis.y.min as any) ? blueprint.axis.y.min! : -10;
        const yMax = !isNaN(blueprint.axis.y.max as any) ? blueprint.axis.y.max! : 10;

        // --- 2. MATH SANDBOX ---
        const math = {
            sin: Math.sin, cos: Math.cos, tan: Math.tan,
            exp: Math.exp, sqrt: Math.sqrt, pow: Math.pow,
            abs: Math.abs, PI: Math.PI, E: Math.E,
            log: Math.log, log10: Math.log10,
            floor: Math.floor, ceil: Math.ceil, round: Math.round,
            min: Math.min, max: Math.max
        };
        const paramKeys = Object.keys(params);
        const paramValues = Object.values(params);
        const mathKeys = Object.keys(math);
        const mathValues = Object.values(math);

        // Build var logic string
        let varLogic = '';
        for (const vKey in blueprint.vars) {
            varLogic += `const ${vKey} = ${blueprint.vars[vKey]}; `;
        }

        const isImplicit = blueprint.equation.includes('=');
        let chartData: any[] = [];
        let chartType: 'line' | 'scatter' = 'line';

        try {
            if (isImplicit) {
                // --- IMPLICIT MODE (Marching Squares) ---
                chartType = 'scatter';
                const parts = blueprint.equation.split('=');
                const diffEquation = `(${parts[0]}) - (${parts[1]})`;

                // 2D Evaluator: receives x AND y
                const evalFn2D = new Function('x', 'y', ...paramKeys, ...mathKeys, `
                    ${varLogic}
                    try { return ${diffEquation}; } catch(e) { return NaN; }
                `);

                // Create a 2D grid
                const gridSize = 120; // Increased for better resolution
                const dx = (xMax - xMin) / gridSize;
                const dy = (yMax - yMin) / gridSize;

                // 1. Sample the grid
                const gridRows = gridSize + 1;
                const values = new Float64Array(gridRows * gridRows);
                for (let j = 0; j < gridRows; j++) {
                    const py = yMin + j * dy;
                    for (let i = 0; i < gridRows; i++) {
                        const px = xMin + i * dx;
                        values[j * gridRows + i] = evalFn2D(px, py, ...paramValues, ...mathValues);
                    }
                }

                // Helper: Interpolate to find exact zero-crossing
                const getInterp = (p1: number, p2: number, v1: number, v2: number) => {
                    if (Math.abs(v1 - v2) < 0.000001) return p1;
                    const mu = (0 - v1) / (v2 - v1);
                    return p1 + mu * (p2 - p1);
                };

                // 2. Marching Squares with Interpolation
                for (let j = 0; j < gridSize; j++) {
                    for (let i = 0; i < gridSize; i++) {
                        const idx0 = j * gridRows + i;         // Bottom-left
                        const idx1 = idx0 + 1;                  // Bottom-right
                        const idx2 = (j + 1) * gridRows + (i + 1); // Top-right
                        const idx3 = (j + 1) * gridRows + i;    // Top-left

                        const v0 = values[idx0], v1 = values[idx1], v2 = values[idx2], v3 = values[idx3];
                        if (isNaN(v0) || isNaN(v1) || isNaN(v2) || isNaN(v3)) continue;

                        let configCode = 0;
                        if (v0 > 0) configCode |= 1;
                        if (v1 > 0) configCode |= 2;
                        if (v2 > 0) configCode |= 4;
                        if (v3 > 0) configCode |= 8;

                        // Only process mixed-sign squares (crosses zero)
                        if (configCode > 0 && configCode < 15) {
                            const xL = xMin + i * dx, xR = xL + dx;
                            const yB = yMin + j * dy, yT = yB + dy;

                            // Find crossing points on edges (only need 1 or 2 per cell to represent the curve)
                            // We'll pick edges based on sign changes
                            if ((v0 > 0) !== (v1 > 0)) chartData.push({ x: getInterp(xL, xR, v0, v1), y: yB });
                            if ((v1 > 0) !== (v2 > 0)) chartData.push({ x: xR, y: getInterp(yB, yT, v1, v2) });
                            if ((v2 > 0) !== (v3 > 0)) chartData.push({ x: getInterp(xR, xL, v2, v3), y: yT });
                            if ((v3 > 0) !== (v0 > 0)) chartData.push({ x: xL, y: getInterp(yT, yB, v3, v0) });
                        }
                    }
                }
            } else {
                // --- FUNCTION MODE (Standard Sweep) ---
                const evalFn = new Function('x', ...paramKeys, ...mathKeys, `
                    ${varLogic}
                    return ${blueprint.equation};
                `);

                for (let i = 0; i <= blueprint.steps; i++) {
                    const x = xMin + ((xMax - xMin) * i) / blueprint.steps;
                    const y = evalFn(x, ...paramValues, ...mathValues);
                    chartData.push({ x, y });
                }
            }
        } catch (e) {
            console.error('Math Engine Evaluation Error:', e);
            throw new Error(`Equation Error: ${e}`);
        }

        return {
            type: chartType,
            data: {
                datasets: [{
                    label: blueprint.title || 'Plot',
                    data: chartData,
                    borderColor: blueprint.color,
                    backgroundColor: isImplicit ? blueprint.color : blueprint.color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    borderWidth: isImplicit ? 1 : 3,
                    pointRadius: isImplicit ? 1 : 0,
                    showLine: !isImplicit,
                    tension: 0.4,
                    fill: !isImplicit
                }]
            },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: blueprint.axis.x.title || 'X', color: 'rgba(255,255,255,0.6)', font: { family: 'JetBrains Mono', size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 10 } },
                        min: xMin, max: xMax
                    },
                    y: {
                        type: 'linear',
                        title: { display: true, text: blueprint.axis.y.title || 'Y', color: 'rgba(255,255,255,0.6)', font: { family: 'JetBrains Mono', size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 10 } },
                        min: yMin, max: yMax
                    }
                }
            }
        };
    }
}
