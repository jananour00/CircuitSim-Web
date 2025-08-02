// Modified Nodal Analysis (MNA) Solver
class MNASolver {
    constructor() {
        this.tolerance = 1e-12;
        this.maxIterations = 100;
    }

    solve(components, connections) {
        try {
            // Step 1: Build node map and identify ground
            const nodeInfo = this.buildNodeMap(components);
            const nodeMap = nodeInfo.nodeMap;
            const groundNode = nodeInfo.groundNode;
            const nodeCount = nodeInfo.nodeCount;
            
            // Step 2: Count voltage sources for matrix sizing
            const voltageSourceCount = this.countVoltageSources(components);
            const matrixSize = nodeCount + voltageSourceCount;
            
            if (matrixSize === 0) {
                throw new Error('No circuit elements found');
            }

            // Step 3: Initialize MNA matrices
            const G = this.createMatrix(matrixSize, matrixSize);
            const I = this.createVector(matrixSize);
            
            // Step 4: Stamp components into matrices
            let voltageSourceIndex = nodeCount;
            for (const [id, component] of components) {
                const stamp = component.getStamp(nodeMap, voltageSourceIndex);
                
                if (stamp.voltageSource) {
                    this.applyStamp(G, I, stamp);
                    voltageSourceIndex++;
                } else if (!stamp.isGround) {
                    this.applyStamp(G, I, stamp);
                }
            }

            // Step 5: Handle ground node (reference node = 0V)
            if (groundNode !== null) {
                this.setGroundNode(G, I, groundNode);
            } else {
                // If no ground is explicitly defined, set node 0 as ground
                this.setGroundNode(G, I, 0);
            }

            // Step 6: Solve the linear system G * V = I
            const solution = this.solveLinearSystem(G, I);
            
            // Step 7: Extract and format results
            return this.formatResults(solution, nodeMap, components, nodeCount);
            
        } catch (error) {
            console.error('MNA Solver Error:', error);
            throw new Error(`Circuit analysis failed: ${error.message}`);
        }
    }

    buildNodeMap(components) {
        const nodeSet = new Set();
        let groundNode = null;
        
        // Collect all unique nodes from components
        for (const [id, component] of components) {
            const nodes = component.getNodes();
            nodes.forEach(node => nodeSet.add(node));
            
            // Check if this component is ground
            if (component.type === 'ground') {
                groundNode = component.getNodes()[0];
            }
        }

        // Remove ground node from the set if it exists
        if (groundNode) {
            nodeSet.delete(groundNode);
        }

        // Create node mapping (excluding ground)
        const nodeArray = Array.from(nodeSet).sort();
        const nodeMap = {};
        nodeArray.forEach((node, index) => {
            nodeMap[node] = index;
        });

        // Ground node maps to undefined (not included in matrix)
        if (groundNode) {
            nodeMap[groundNode] = undefined;
        }

        return {
            nodeMap,
            groundNode: groundNode ? nodeMap[groundNode] : null,
            nodeCount: nodeArray.length,
            nodeNames: nodeArray
        };
    }

    countVoltageSources(components) {
        let count = 0;
        for (const [id, component] of components) {
            if (component.type === 'voltage_source') {
                count++;
            }
        }
        return count;
    }

    createMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols).fill(0);
        }
        return matrix;
    }

    createVector(size) {
        return new Array(size).fill(0);
    }

    applyStamp(G, I, stamp) {
        // Apply G matrix entries
        for (const [key, value] of Object.entries(stamp.G)) {
            const [row, col] = key.split(',').map(Number);
            if (row < G.length && col < G[0].length) {
                G[row][col] += value;
            }
        }

        // Apply I vector entries
        for (const [index, value] of Object.entries(stamp.I)) {
            const idx = Number(index);
            if (idx < I.length) {
                I[idx] += value;
            }
        }
    }

    setGroundNode(G, I, groundIndex) {
        // Ground node constraint: V_ground = 0
        // This is typically handled by removing the ground node from the matrix
        // Since we already excluded ground from nodeMap, no additional action needed
        
        // However, if we need to explicitly set a node to ground:
        if (groundIndex !== null && groundIndex < G.length) {
            // Clear the row and column for ground node
            for (let i = 0; i < G.length; i++) {
                G[groundIndex][i] = 0;
                G[i][groundIndex] = 0;
            }
            // Set diagonal element to 1 and RHS to 0
            G[groundIndex][groundIndex] = 1;
            I[groundIndex] = 0;
        }
    }

    solveLinearSystem(G, I) {
        const n = G.length;
        
        // Check for singular matrix
        if (this.isDeterminantZero(G)) {
            throw new Error('Singular matrix - circuit may have no unique solution');
        }

        // Use Gaussian elimination with partial pivoting
        return this.gaussianElimination(G, I);
    }

    gaussianElimination(A, b) {
        const n = A.length;
        const augmented = [];
        
        // Create augmented matrix
        for (let i = 0; i < n; i++) {
            augmented[i] = [...A[i], b[i]];
        }

        // Forward elimination with partial pivoting
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            // Check for zero pivot
            if (Math.abs(augmented[i][i]) < this.tolerance) {
                throw new Error('Matrix is singular or nearly singular');
            }

            // Eliminate column
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }

        // Back substitution
        const solution = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented[i][j] * solution[j];
            }
            solution[i] /= augmented[i][i];
        }

        return solution;
    }

    isDeterminantZero(matrix) {
        // Simple check for very small determinant
        // This is a simplified implementation
        const n = matrix.length;
        if (n === 0) return true;
        if (n === 1) return Math.abs(matrix[0][0]) < this.tolerance;
        if (n === 2) {
            const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
            return Math.abs(det) < this.tolerance;
        }
        
        // For larger matrices, we'll rely on the Gaussian elimination to catch singularity
        return false;
    }

    formatResults(solution, nodeMap, components, nodeCount) {
        const results = {
            nodeVoltages: {},
            branchCurrents: {},
            success: true
        };

        // Extract node voltages
        const nodeNames = Object.keys(nodeMap).filter(name => nodeMap[name] !== undefined);
        nodeNames.forEach((nodeName, index) => {
            if (index < solution.length) {
                results.nodeVoltages[nodeName] = solution[index];
            }
        });

        // Add ground voltage
        results.nodeVoltages['ground'] = 0;

        // Extract voltage source currents
        let vsIndex = 0;
        for (const [id, component] of components) {
            if (component.type === 'voltage_source') {
                const currentIndex = nodeCount + vsIndex;
                if (currentIndex < solution.length) {
                    results.branchCurrents[`${component.id}`] = solution[currentIndex];
                }
                vsIndex++;
            }
        }

        // Calculate branch currents for other components
        for (const [id, component] of components) {
            if (component.type === 'resistor') {
                const nodes = component.getNodes();
                const v1 = results.nodeVoltages[nodes[0]] || 0;
                const v2 = results.nodeVoltages[nodes[1]] || 0;
                const current = (v1 - v2) / component.resistance;
                results.branchCurrents[component.id] = current;
            }
        }

        return results;
    }

    // Utility method for AC analysis (future enhancement)
    solveAC(components, connections, frequency) {
        // This would implement AC analysis using complex numbers
        // For now, return a placeholder
        throw new Error('AC analysis not yet implemented');
    }

    // Utility method for transient analysis (future enhancement)
    solveTransient(components, connections, timeStep, duration) {
        // This would implement time-domain simulation
        // For now, return a placeholder
        throw new Error('Transient analysis not yet implemented');
    }
}

