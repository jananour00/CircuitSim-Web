// Circuit Analysis Utility Functions
class CircuitUtils {
    
    // Mathematical utilities
    static formatEngineering(value, unit = '', precision = 3) {
        const prefixes = [
            { threshold: 1e12, symbol: 'T' },
            { threshold: 1e9, symbol: 'G' },
            { threshold: 1e6, symbol: 'M' },
            { threshold: 1e3, symbol: 'k' },
            { threshold: 1, symbol: '' },
            { threshold: 1e-3, symbol: 'm' },
            { threshold: 1e-6, symbol: 'μ' },
            { threshold: 1e-9, symbol: 'n' },
            { threshold: 1e-12, symbol: 'p' },
            { threshold: 1e-15, symbol: 'f' }
        ];

        const absValue = Math.abs(value);
        
        for (const prefix of prefixes) {
            if (absValue >= prefix.threshold) {
                const scaledValue = value / prefix.threshold;
                return `${scaledValue.toFixed(precision)}${prefix.symbol}${unit}`;
            }
        }
        
        return `${value.toExponential(precision)}${unit}`;
    }

    static parseEngineering(valueStr) {
        const multipliers = {
            'T': 1e12, 'G': 1e9, 'M': 1e6, 'k': 1e3,
            'm': 1e-3, 'μ': 1e-6, 'u': 1e-6, 'n': 1e-9, 'p': 1e-12, 'f': 1e-15
        };

        const match = valueStr.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*([TGMkmμunpf]?)/);
        if (!match) return parseFloat(valueStr);

        const value = parseFloat(match[1]);
        const prefix = match[2];
        const multiplier = multipliers[prefix] || 1;

        return value * multiplier;
    }

    // Circuit topology analysis
    static findConnectedComponents(components, connections) {
        const nodeGraph = new Map();
        const componentNodes = new Map();

        // Build node graph
        for (const [id, component] of components) {
            const nodes = component.getNodes();
            componentNodes.set(id, nodes);
            
            nodes.forEach(node => {
                if (!nodeGraph.has(node)) {
                    nodeGraph.set(node, new Set());
                }
            });
        }

        // Add connections
        connections.forEach(conn => {
            const fromNodes = componentNodes.get(conn.from) || [];
            const toNodes = componentNodes.get(conn.to) || [];
            
            fromNodes.forEach(fromNode => {
                toNodes.forEach(toNode => {
                    nodeGraph.get(fromNode).add(toNode);
                    nodeGraph.get(toNode).add(fromNode);
                });
            });
        });

        // Find connected components using DFS
        const visited = new Set();
        const connectedComponents = [];

        for (const node of nodeGraph.keys()) {
            if (!visited.has(node)) {
                const component = [];
                this.dfs(node, nodeGraph, visited, component);
                connectedComponents.push(component);
            }
        }

        return connectedComponents;
    }

    static dfs(node, graph, visited, component) {
        visited.add(node);
        component.push(node);

        const neighbors = graph.get(node) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                this.dfs(neighbor, graph, visited, component);
            }
        }
    }

    // Circuit validation
    static validateCircuit(components, connections) {
        const errors = [];
        const warnings = [];

        // Check for ground node
        const hasGround = Array.from(components.values()).some(comp => comp.type === 'ground');
        if (!hasGround) {
            errors.push('Circuit must have at least one ground node');
        }

        // Check for floating nodes
        const connectedComponents = this.findConnectedComponents(components, connections);
        if (connectedComponents.length > 1) {
            warnings.push(`Circuit has ${connectedComponents.length} disconnected sections`);
        }

        // Check component values
        for (const [id, component] of components) {
            switch (component.type) {
                case 'resistor':
                    if (component.resistance <= 0) {
                        errors.push(`Resistor ${id} has invalid resistance: ${component.resistance}`);
                    }
                    break;
                case 'capacitor':
                    if (component.capacitance <= 0) {
                        errors.push(`Capacitor ${id} has invalid capacitance: ${component.capacitance}`);
                    }
                    break;
                case 'inductor':
                    if (component.inductance <= 0) {
                        errors.push(`Inductor ${id} has invalid inductance: ${component.inductance}`);
                    }
                    break;
            }
        }

        // Check for short circuits (voltage sources in parallel)
        const voltageSourceNodes = [];
        for (const [id, component] of components) {
            if (component.type === 'voltage_source') {
                voltageSourceNodes.push({
                    id,
                    nodes: component.getNodes(),
                    voltage: component.voltage
                });
            }
        }

        for (let i = 0; i < voltageSourceNodes.length; i++) {
            for (let j = i + 1; j < voltageSourceNodes.length; j++) {
                const vs1 = voltageSourceNodes[i];
                const vs2 = voltageSourceNodes[j];
                
                // Check if voltage sources share the same nodes
                if (this.arraysEqual(vs1.nodes, vs2.nodes) || 
                    this.arraysEqual(vs1.nodes, vs2.nodes.reverse())) {
                    if (vs1.voltage !== vs2.voltage) {
                        errors.push(`Voltage sources ${vs1.id} and ${vs2.id} are in parallel with different voltages`);
                    } else {
                        warnings.push(`Voltage sources ${vs1.id} and ${vs2.id} are in parallel with same voltage`);
                    }
                }
            }
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    static arraysEqual(a, b) {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    // Power calculations
    static calculatePower(components, results) {
        const powerResults = {};

        for (const [id, component] of components) {
            let power = 0;

            switch (component.type) {
                case 'resistor':
                    const current = results.branchCurrents[id] || 0;
                    power = current * current * component.resistance;
                    break;

                case 'voltage_source':
                    const vsCurrent = results.branchCurrents[id] || 0;
                    power = -component.voltage * vsCurrent; // Negative because source supplies power
                    break;

                case 'current_source':
                    const nodes = component.getNodes();
                    const v1 = results.nodeVoltages[nodes[0]] || 0;
                    const v2 = results.nodeVoltages[nodes[1]] || 0;
                    power = -(v1 - v2) * component.current; // Negative because source supplies power
                    break;
            }

            powerResults[id] = power;
        }

        return powerResults;
    }

    // Frequency response utilities (for future AC analysis)
    static generateFrequencyPoints(startFreq, stopFreq, pointsPerDecade = 10) {
        const points = [];
        const startLog = Math.log10(startFreq);
        const stopLog = Math.log10(stopFreq);
        const decades = stopLog - startLog;
        const totalPoints = Math.ceil(decades * pointsPerDecade);

        for (let i = 0; i <= totalPoints; i++) {
            const logFreq = startLog + (i / totalPoints) * decades;
            points.push(Math.pow(10, logFreq));
        }

        return points;
    }

    // Time domain utilities (for future transient analysis)
    static generateTimePoints(duration, timeStep) {
        const points = [];
        for (let t = 0; t <= duration; t += timeStep) {
            points.push(t);
        }
        return points;
    }

    // Matrix utilities
    static printMatrix(matrix, label = 'Matrix') {
        console.log(`${label}:`);
        matrix.forEach((row, i) => {
            console.log(`Row ${i}: [${row.map(val => val.toFixed(6)).join(', ')}]`);
        });
    }

    static printVector(vector, label = 'Vector') {
        console.log(`${label}: [${vector.map(val => val.toFixed(6)).join(', ')}]`);
    }

    // Component placement utilities
    static snapToGrid(x, y, gridSize = 20) {
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    static findNearestComponent(x, y, components, maxDistance = 50) {
        let nearest = null;
        let minDistance = maxDistance;

        for (const [id, component] of components) {
            const dx = x - component.x;
            const dy = y - component.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { id, component, distance };
            }
        }

        return nearest;
    }

    // Export utilities
    static exportToSPICE(components, connections) {
        let spiceNetlist = '* Circuit exported from Circuit Simulator\n';
        spiceNetlist += '.title Circuit Simulation\n\n';

        // Add components
        for (const [id, component] of components) {
            switch (component.type) {
                case 'resistor':
                    spiceNetlist += `R${id} ${component.getNodes().join(' ')} ${component.resistance}\n`;
                    break;
                case 'capacitor':
                    spiceNetlist += `C${id} ${component.getNodes().join(' ')} ${component.capacitance}\n`;
                    break;
                case 'inductor':
                    spiceNetlist += `L${id} ${component.getNodes().join(' ')} ${component.inductance}\n`;
                    break;
                case 'voltage_source':
                    spiceNetlist += `V${id} ${component.getNodes().join(' ')} DC ${component.voltage}\n`;
                    break;
                case 'current_source':
                    spiceNetlist += `I${id} ${component.getNodes().join(' ')} DC ${component.current}\n`;
                    break;
            }
        }

        spiceNetlist += '\n.op\n.end\n';
        return spiceNetlist;
    }

    // Debug utilities
    static debugCircuit(components, connections, results) {
        console.group('Circuit Debug Information');
        
        console.log('Components:', components.size);
        for (const [id, component] of components) {
            console.log(`  ${id}: ${component.type} at (${component.x}, ${component.y})`);
        }

        console.log('Connections:', connections.length);
        connections.forEach((conn, i) => {
            console.log(`  ${i}: ${conn.from} -> ${conn.to}`);
        });

        if (results) {
            console.log('Node Voltages:');
            for (const [node, voltage] of Object.entries(results.nodeVoltages)) {
                console.log(`  ${node}: ${voltage.toFixed(6)}V`);
            }

            console.log('Branch Currents:');
            for (const [branch, current] of Object.entries(results.branchCurrents)) {
                console.log(`  ${branch}: ${current.toFixed(6)}A`);
            }
        }

        console.groupEnd();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitUtils;
}

