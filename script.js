 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const canvasScroll = document.getElementById('canvasScroll');
            const circuitGrid = document.getElementById('circuitGrid');
            const zoomInBtn = document.getElementById('zoomInBtn');
            const zoomOutBtn = document.getElementById('zoomOutBtn');
            const snapToGridBtn = document.getElementById('snapToGridBtn');
            const deleteBtn = document.getElementById('deleteBtn');
            const zoomLevel = document.getElementById('zoomLevel');
            const paletteItems = document.querySelectorAll('.palette-item');
            const simulateBtn = document.getElementById('simulateBtn');
            const resultsModal = document.getElementById('resultsModal');
            const closeModal = document.getElementById('closeModal');
            const nodeTable = document.getElementById('nodeTable').querySelector('tbody');
            const componentTable = document.getElementById('componentTable').querySelector('tbody');
            const propertyEditor = document.getElementById('propertyEditor');
            const propValue = document.getElementById('propValue');
            const propUnit = document.getElementById('propUnit');
            const applyProperties = document.getElementById('applyProperties');
            const newBtn = document.getElementById('newBtn');
            const saveBtn = document.getElementById('saveBtn');
            const loadBtn = document.getElementById('loadBtn');
            const showNodesBtn = document.getElementById('showNodesBtn');
            const debugBtn = document.getElementById('debugBtn');
            const debugPanel = document.getElementById('debugPanel');
            const debugContent = document.getElementById('debugContent');
            const componentCount = document.getElementById('componentCount');
            const nodeCount = document.getElementById('nodeCount');
            const simulationStatus = document.getElementById('simulationStatus');
            
            // State variables
            let scale = 1;
            let isDragging = false;
            let currentComponent = null;
            let offsetX, offsetY;
            let isSnapToGrid = true;
            let selectedComponent = null;
            let isCreatingWire = false;
            let wireStartPoint = null;
            let tempWireSegments = [];
            let components = [];
            let wires = [];
            let nodes = {};
            let nextNodeId = 1;
            let nextComponentId = 1;
            let componentCounters = {
                resistor: 0,
                capacitor: 0,
                inductor: 0,
                voltageSource: 0,
                currentSource: 0,
                ground: 0,
                diode: 0,
                led: 0
            };
            let showNodes = false;
            let nodeIndicators = [];
            let debugMode = false;
            
            // Component SVG templates
            const componentSVGs = {
                resistor: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <rect x="10" y="20" width="30" height="10" fill="none" stroke="black" stroke-width="2"/>
                        <line x1="5" y1="25" x2="10" y2="25" stroke="black" stroke-width="2"/>
                        <line x1="40" y1="25" x2="45" y2="25" stroke="black" stroke-width="2"/>
                    </svg>
                `,
                capacitor: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <line x1="5" y1="25" x2="20" y2="25" stroke="black" stroke-width="2"/>
                        <line x1="20" y1="15" x2="20" y2="35" stroke="black" stroke-width="2"/>
                        <line x1="30" y1="15" x2="30" y2="35" stroke="black" stroke-width="2"/>
                        <line x1="30" y1="25" x2="45" y2="25" stroke="black" stroke-width="2"/>
                    </svg>
                `,
                inductor: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <line x1="5" y1="25" x2="10" y2="25" stroke="black" stroke-width="2"/>
                        <path d="M 10 25 Q 15 15, 20 25 T 30 25 T 40 25" fill="none" stroke="black" stroke-width="2"/>
                        <line x1="40" y1="25" x2="45" y2="25" stroke="black" stroke-width="2"/>
                    </svg>
                `,
                voltageSource: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" stroke="black" stroke-width="2" fill="none"/>
                        <text x="25" y="20" text-anchor="middle" font-size="16" font-weight="bold">+</text>
                        <text x="25" y="35" text-anchor="middle" font-size="16" font-weight="bold">-</text>
                    </svg>
                `,
                currentSource: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" stroke="black" stroke-width="2" fill="none"/>
                        <line x1="15" y1="25" x2="35" y2="25" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="black"/>
                            </marker>
                        </defs>
                    </svg>
                `,
                ground: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <line x1="25" y1="15" x2="25" y2="30" stroke="black" stroke-width="2"/>
                        <line x1="15" y1="30" x2="35" y2="30" stroke="black" stroke-width="2"/>
                        <line x1="18" y1="35" x2="32" y2="35" stroke="black" stroke-width="2"/>
                        <line x1="21" y1="40" x2="29" y2="40" stroke="black" stroke-width="2"/>
                    </svg>
                `,
                diode: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <line x1="5" y1="25" x2="20" y2="25" stroke="black" stroke-width="2"/>
                        <polygon points="20,15 20,35 35,25" fill="black"/>
                        <line x1="35" y1="15" x2="35" y2="35" stroke="black" stroke-width="2"/>
                        <line x1="35" y1="25" x2="45" y2="25" stroke="black" stroke-width="2"/>
                    </svg>
                `,
                led: `
                    <svg class="component-svg" viewBox="0 0 50 50">
                        <line x1="5" y1="25" x2="20" y2="25" stroke="black" stroke-width="2"/>
                        <polygon points="20,15 20,35 35,25" fill="black"/>
                        <line x1="35" y1="15" x2="35" y2="35" stroke="black" stroke-width="2"/>
                        <line x1="35" y1="25" x2="45" y2="25" stroke="black" stroke-width="2"/>
                        <!-- Light rays -->
                        <line x1="25" y1="10" x2="25" y2="5" stroke="black" stroke-width="1.5"/>
                        <line x1="30" y1="12" x2="34" y2="8" stroke="black" stroke-width="1.5"/>
                        <line x1="20" y1="12" x2="16" y2="8" stroke="black" stroke-width="1.5"/>
                    </svg>
                `
            };
            
            // Default component properties
            const defaultProperties = {
                resistor: { value: 1000, unit: 'Ω' },
                capacitor: { value: 1, unit: 'μF' },
                inductor: { value: 1, unit: 'mH' },
                voltageSource: { value: 1, unit: 'V' },
                currentSource: { value: 0.01, unit: 'A' },
                ground: { value: 0, unit: 'V' },
                diode: { value: 0.7, unit: 'V' },
                led: { value: 2, unit: 'V' }
            };
            
            // Initialize grid
            updateZoom();
            updateStatusBar();
            
            // Event Listeners
            zoomInBtn.addEventListener('click', zoomIn);
            zoomOutBtn.addEventListener('click', zoomOut);
            snapToGridBtn.addEventListener('click', toggleSnapToGrid);
            deleteBtn.addEventListener('click', deleteSelected);
            simulateBtn.addEventListener('click', runSimulation);
            closeModal.addEventListener('click', () => resultsModal.style.display = 'none');
            applyProperties.addEventListener('click', updateComponentProperties);
            newBtn.addEventListener('click', clearCircuit);
            saveBtn.addEventListener('click', saveCircuit);
            loadBtn.addEventListener('click', loadCircuit);
            showNodesBtn.addEventListener('click', toggleNodeDisplay);
            debugBtn.addEventListener('click', toggleDebug);
            
            // Component palette drag
            paletteItems.forEach(item => {
                item.addEventListener('mousedown', function(e) {
                    const type = this.getAttribute('data-type');
                    createNewComponent(type, e);
                });
            });
            
            // Canvas interaction
            circuitGrid.addEventListener('mousedown', handleCanvasMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Double-click to edit properties
            circuitGrid.addEventListener('dblclick', function(e) {
                if (e.target.closest('.component')) {
                    const component = e.target.closest('.component');
                    showPropertyEditor(component, e);
                }
            });
            
            // Prevent context menu on canvas
            circuitGrid.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Functions
            function zoomIn() {
                scale = Math.min(scale + 0.1, 2);
                updateZoom();
            }
            
            function zoomOut() {
                scale = Math.max(scale - 0.1, 0.5);
                updateZoom();
            }
            
            function updateZoom() {
                circuitGrid.style.transform = `scale(${scale})`;
                zoomLevel.textContent = `${Math.round(scale * 100)}%`;
            }
            
            function toggleSnapToGrid() {
                isSnapToGrid = !isSnapToGrid;
                snapToGridBtn.classList.toggle('active', isSnapToGrid);
            }
            
            function toggleNodeDisplay() {
                showNodes = !showNodes;
                showNodesBtn.classList.toggle('active', showNodes);
                
                if (showNodes) {
                    displayNodes();
                } else {
                    hideNodes();
                }
            }
            
            function toggleDebug() {
                debugMode = !debugMode;
                debugBtn.classList.toggle('active', debugMode);
                debugPanel.style.display = debugMode ? 'block' : 'none';
            }
            
            function displayNodes() {
                // Remove existing node indicators
                hideNodes();
                
                // Create new node indicators
                const nodePositions = getNodePositions();
                
                for (const nodeId in nodePositions) {
                    const pos = nodePositions[nodeId];
                    const indicator = document.createElement('div');
                    indicator.className = 'node-indicator';
                    indicator.textContent = nodeId;
                    indicator.style.left = `${pos.x - 10}px`;
                    indicator.style.top = `${pos.y - 10}px`;
                    circuitGrid.appendChild(indicator);
                    nodeIndicators.push(indicator);
                }
            }
            
            function hideNodes() {
                nodeIndicators.forEach(indicator => indicator.remove());
                nodeIndicators = [];
            }
            
            function getNodePositions() {
                const positions = {};
                
                // Get positions of all connection points
                components.forEach(comp => {
                    const leftPoint = comp.element.querySelector('.connection-point[data-terminal="left"]');
                    const rightPoint = comp.element.querySelector('.connection-point[data-terminal="right"]');
                    
                    if (leftPoint) {
                        const leftTerminal = `${comp.id}:left`;
                        const nodeId = nodes[leftTerminal];
                        if (nodeId !== undefined) {
                            const pos = getPointPosition(leftPoint);
                            positions[nodeId] = pos;
                        }
                    }
                    
                    if (rightPoint) {
                        const rightTerminal = `${comp.id}:right`;
                        const nodeId = nodes[rightTerminal];
                        if (nodeId !== undefined) {
                            const pos = getPointPosition(rightPoint);
                            positions[nodeId] = pos;
                        }
                    }
                });
                
                return positions;
            }
            
            function updateStatusBar() {
                componentCount.textContent = `Components: ${components.length}`;
                nodeCount.textContent = `Nodes: ${Object.keys(nodes).length > 0 ? new Set(Object.values(nodes)).size : 0}`;
            }
            
            function debugLog(message) {
                if (debugMode) {
                    debugContent.textContent += message + '\n';
                    debugPanel.scrollTop = debugPanel.scrollHeight;
                }
            }
            
            function deleteSelected() {
                if (selectedComponent) {
                    // Remove associated wires
                    const componentId = selectedComponent.getAttribute('data-id');
                    wires = wires.filter(wire => {
                        if (wire.startComponentId === componentId || wire.endComponentId === componentId) {
                            wire.segments.forEach(segment => segment.element.remove());
                            return false;
                        }
                        return true;
                    });
                    
                    // Remove component
                    selectedComponent.remove();
                    components = components.filter(comp => comp.id !== componentId);
                    selectedComponent = null;
                    updateStatusBar();
                    
                    if (showNodes) {
                        displayNodes();
                    }
                }
            }
            
            function createNewComponent(type, e) {
                const componentId = `comp_${nextComponentId++}`;
                componentCounters[type]++;
                const component = document.createElement('div');
                component.className = 'component';
                component.setAttribute('data-type', type);
                component.setAttribute('data-id', componentId);
                
                // Set default properties
                const defaultProps = defaultProperties[type];
                component.setAttribute('data-value', defaultProps.value);
                component.setAttribute('data-unit', defaultProps.unit);
                
                // Position the component near the mouse
                const rect = canvasScroll.getBoundingClientRect();
                let x = e.clientX - rect.left - 40;
                let y = e.clientY - rect.top - 40;
                
                if (isSnapToGrid) {
                    const gridSize = 20 * scale;
                    x = Math.round(x / gridSize) * gridSize;
                    y = Math.round(y / gridSize) * gridSize;
                }
                
                component.style.left = `${x}px`;
                component.style.top = `${y}px`;
                
                // Generate component label
                let label = '';
                let labelPrefix = '';
                
                switch (type) {
                    case 'resistor':
                        labelPrefix = 'R';
                        break;
                    case 'capacitor':
                        labelPrefix = 'C';
                        break;
                    case 'inductor':
                        labelPrefix = 'L';
                        break;
                    case 'voltageSource':
                        labelPrefix = 'Vs';
                        break;
                    case 'currentSource':
                        labelPrefix = 'Is';
                        break;
                    case 'ground':
                        labelPrefix = 'GND';
                        break;
                    case 'diode':
                        labelPrefix = 'D';
                        break;
                    case 'led':
                        labelPrefix = 'LED';
                        break;
                }
                
                label = `${labelPrefix}${componentCounters[type]} ${defaultProps.value}${defaultProps.unit}`;
                
                // Add component content with SVG
                component.innerHTML = `
                    <div class="component-svg-container">
                        ${componentSVGs[type]}
                    </div>
                    <span class="component-label">${label}</span>
                    <div class="connection-point" data-terminal="left" style="left: -6px; top: 50%; transform: translateY(-50%);"></div>
                    <div class="connection-point" data-terminal="right" style="right: -6px; top: 50%; transform: translateY(-50%);"></div>
                `;
                
                circuitGrid.appendChild(component);
                
                // Add to components array
                components.push({
                    id: componentId,
                    type: type,
                    element: component,
                    value: defaultProps.value,
                    unit: defaultProps.unit,
                    label: label
                });
                
                // Select the new component
                selectComponent(component);
                currentComponent = component;
                isDragging = true;
                
                // Calculate offset for proper dragging
                const componentRect = component.getBoundingClientRect();
                offsetX = e.clientX - componentRect.left;
                offsetY = e.clientY - componentRect.top;
                
                updateStatusBar();
            }
            
            function handleCanvasMouseDown(e) {
                if (e.target.classList.contains('connection-point')) {
                    // Start creating a wire
                    isCreatingWire = true;
                    wireStartPoint = e.target;
                    
                    // Create temporary wire segments
                    const startPoint = getPointPosition(wireStartPoint);
                    createTempWireSegments(startPoint);
                    
                    return;
                }
                
                // Only start dragging if clicking on the component SVG container
                if (e.target.classList.contains('component-svg-container') || 
                    e.target.closest('.component-svg-container')) {
                    const component = e.target.closest('.component');
                    selectComponent(component);
                    currentComponent = component;
                    isDragging = true;
                    
                    const rect = component.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                } else if (e.target.classList.contains('component') || e.target.closest('.component')) {
                    // Clicked on component but not the SVG - just select it
                    const component = e.target.classList.contains('component') ? e.target : e.target.closest('.component');
                    selectComponent(component);
                } else {
                    // Clicked on empty space - deselect
                    if (selectedComponent) {
                        selectedComponent.classList.remove('selected');
                        selectedComponent = null;
                    }
                }
            }
            
            function handleMouseMove(e) {
                if (isDragging && currentComponent) {
                    const rect = canvasScroll.getBoundingClientRect();
                    let x = e.clientX - rect.left - offsetX;
                    let y = e.clientY - rect.top - offsetY;
                    
                    if (isSnapToGrid) {
                        const gridSize = 20 * scale;
                        x = Math.round(x / gridSize) * gridSize;
                        y = Math.round(y / gridSize) * gridSize;
                    }
                    
                    currentComponent.style.left = `${x}px`;
                    currentComponent.style.top = `${y}px`;
                    
                    // Update connected wires
                    updateComponentWires(currentComponent);
                    
                    if (showNodes) {
                        displayNodes();
                    }
                }
                
                if (isCreatingWire && tempWireSegments.length > 0) {
                    const rect = canvasScroll.getBoundingClientRect();
                    const endX = e.clientX - rect.left;
                    const endY = e.clientY - rect.top;
                    
                    // Update temporary wire segments
                    updateTempWireSegments(endX, endY);
                }
            }
            
            function handleMouseUp(e) {
                if (isCreatingWire && tempWireSegments.length > 0) {
                    // Check if we're over a connection point
                    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
                    
                    if (targetElement && targetElement.classList.contains('connection-point') && targetElement !== wireStartPoint) {
                        // Create a permanent wire
                        createWire(wireStartPoint, targetElement);
                    }
                    
                    // Remove temporary wire segments
                    tempWireSegments.forEach(segment => segment.element.remove());
                    tempWireSegments = [];
                }
                
                isDragging = false;
                currentComponent = null;
                isCreatingWire = false;
                wireStartPoint = null;
            }
            
            function createTempWireSegments(startPoint) {
                // Clear any existing temp segments
                tempWireSegments.forEach(segment => segment.element.remove());
                tempWireSegments = [];
                
                // Create initial horizontal segment
                const hSegment = document.createElement('div');
                hSegment.className = 'wire-segment horizontal';
                hSegment.style.left = `${startPoint.x}px`;
                hSegment.style.top = `${startPoint.y}px`;
                hSegment.style.width = '0px';
                circuitGrid.appendChild(hSegment);
                tempWireSegments.push({ element: hSegment, type: 'horizontal' });
                
                // Create initial vertical segment
                const vSegment = document.createElement('div');
                vSegment.className = 'wire-segment vertical';
                vSegment.style.left = `${startPoint.x}px`;
                vSegment.style.top = `${startPoint.y}px`;
                vSegment.style.height = '0px';
                circuitGrid.appendChild(vSegment);
                tempWireSegments.push({ element: vSegment, type: 'vertical' });
            }
            
            function updateTempWireSegments(endX, endY) {
                if (tempWireSegments.length < 2) return;
                
                const startPoint = getPointPosition(wireStartPoint);
                
                // Calculate orthogonal path (L-shaped)
                // Option 1: Horizontal then vertical
                const h1Length = endX - startPoint.x;
                const v1Length = endY - startPoint.y;
                
                // Option 2: Vertical then horizontal
                const v2Length = endY - startPoint.y;
                const h2Length = endX - startPoint.x;
                
                // Choose the option with the shortest total length
                const option1Length = Math.abs(h1Length) + Math.abs(v1Length);
                const option2Length = Math.abs(v2Length) + Math.abs(h2Length);
                
                if (option1Length <= option2Length) {
                    // Use horizontal then vertical
                    tempWireSegments[0].element.style.width = `${Math.abs(h1Length)}px`;
                    tempWireSegments[0].element.style.left = `${Math.min(startPoint.x, endX)}px`;
                    
                    tempWireSegments[1].element.style.height = `${Math.abs(v1Length)}px`;
                    tempWireSegments[1].element.style.left = `${endX}px`;
                    tempWireSegments[1].element.style.top = `${Math.min(startPoint.y, endY)}px`;
                } else {
                    // Use vertical then horizontal
                    tempWireSegments[0].element.style.height = `${Math.abs(v2Length)}px`;
                    tempWireSegments[0].element.style.top = `${Math.min(startPoint.y, endY)}px`;
                    
                    tempWireSegments[1].element.style.width = `${Math.abs(h2Length)}px`;
                    tempWireSegments[1].element.style.left = `${Math.min(startPoint.x, endX)}px`;
                    tempWireSegments[1].element.style.top = `${endY}px`;
                }
            }
            
            function createWire(startPoint, endPoint) {
                const wireId = `wire_${Date.now()}`;
                const startPos = getPointPosition(startPoint);
                const endPos = getPointPosition(endPoint);
                
                // Calculate orthogonal path (L-shaped)
                // Option 1: Horizontal then vertical
                const h1Length = endPos.x - startPos.x;
                const v1Length = endPos.y - startPos.y;
                
                // Option 2: Vertical then horizontal
                const v2Length = endPos.y - startPos.y;
                const h2Length = endPos.x - startPos.x;
                
                // Choose the option with the shortest total length
                const option1Length = Math.abs(h1Length) + Math.abs(v1Length);
                const option2Length = Math.abs(v2Length) + Math.abs(h2Length);
                
                const segments = [];
                
                if (option1Length <= option2Length) {
                    // Use horizontal then vertical
                    const hSegment = document.createElement('div');
                    hSegment.className = 'wire-segment horizontal';
                    hSegment.setAttribute('data-wire-id', wireId);
                    hSegment.style.left = `${Math.min(startPos.x, endPos.x)}px`;
                    hSegment.style.top = `${startPos.y}px`;
                    hSegment.style.width = `${Math.abs(h1Length)}px`;
                    circuitGrid.appendChild(hSegment);
                    segments.push({ element: hSegment, type: 'horizontal' });
                    
                    const vSegment = document.createElement('div');
                    vSegment.className = 'wire-segment vertical';
                    vSegment.setAttribute('data-wire-id', wireId);
                    vSegment.style.left = `${endPos.x}px`;
                    vSegment.style.top = `${Math.min(startPos.y, endPos.y)}px`;
                    vSegment.style.height = `${Math.abs(v1Length)}px`;
                    circuitGrid.appendChild(vSegment);
                    segments.push({ element: vSegment, type: 'vertical' });
                } else {
                    // Use vertical then horizontal
                    const vSegment = document.createElement('div');
                    vSegment.className = 'wire-segment vertical';
                    vSegment.setAttribute('data-wire-id', wireId);
                    vSegment.style.left = `${startPos.x}px`;
                    vSegment.style.top = `${Math.min(startPos.y, endPos.y)}px`;
                    vSegment.style.height = `${Math.abs(v2Length)}px`;
                    circuitGrid.appendChild(vSegment);
                    segments.push({ element: vSegment, type: 'vertical' });
                    
                    const hSegment = document.createElement('div');
                    hSegment.className = 'wire-segment horizontal';
                    hSegment.setAttribute('data-wire-id', wireId);
                    hSegment.style.left = `${Math.min(startPos.x, endPos.x)}px`;
                    hSegment.style.top = `${endPos.y}px`;
                    hSegment.style.width = `${Math.abs(h2Length)}px`;
                    circuitGrid.appendChild(hSegment);
                    segments.push({ element: hSegment, type: 'horizontal' });
                }
                
                // Get component IDs
                const startComponent = startPoint.closest('.component');
                const endComponent = endPoint.closest('.component');
                const startComponentId = startComponent.getAttribute('data-id');
                const endComponentId = endComponent.getAttribute('data-id');
                const startTerminal = startPoint.getAttribute('data-terminal');
                const endTerminal = endPoint.getAttribute('data-terminal');
                
                // Add to wires array
                wires.push({
                    id: wireId,
                    segments: segments,
                    startComponentId: startComponentId,
                    endComponentId: endComponentId,
                    startTerminal: startTerminal,
                    endTerminal: endTerminal
                });
                
                // Mark connection points as connected
                startPoint.classList.add('connected');
                endPoint.classList.add('connected');
                
                updateStatusBar();
            }
            
            function getPointPosition(point) {
                const rect = point.getBoundingClientRect();
                const gridRect = circuitGrid.getBoundingClientRect();
                
                return {
                    x: rect.left - gridRect.left + rect.width / 2,
                    y: rect.top - gridRect.top + rect.height / 2
                };
            }
            
            function updateComponentWires(component) {
                const componentId = component.getAttribute('data-id');
                
                wires.forEach(wire => {
                    if (wire.startComponentId === componentId || wire.endComponentId === componentId) {
                        // Find the connection points
                        let startPoint, endPoint;
                        
                        if (wire.startComponentId === componentId) {
                            startPoint = component.querySelector(`.connection-point[data-terminal="${wire.startTerminal}"]`);
                            const endComponent = components.find(c => c.id === wire.endComponentId).element;
                            endPoint = endComponent.querySelector(`.connection-point[data-terminal="${wire.endTerminal}"]`);
                        } else {
                            const startComponent = components.find(c => c.id === wire.startComponentId).element;
                            startPoint = startComponent.querySelector(`.connection-point[data-terminal="${wire.startTerminal}"]`);
                            endPoint = component.querySelector(`.connection-point[data-terminal="${wire.endTerminal}"]`);
                        }
                        
                        // Update wire segments
                        const startPos = getPointPosition(startPoint);
                        const endPos = getPointPosition(endPoint);
                        
                        // Calculate orthogonal path (L-shaped)
                        // Option 1: Horizontal then vertical
                        const h1Length = endPos.x - startPos.x;
                        const v1Length = endPos.y - startPos.y;
                        
                        // Option 2: Vertical then horizontal
                        const v2Length = endPos.y - startPos.y;
                        const h2Length = endPos.x - startPos.x;
                        
                        // Choose the option with the shortest total length
                        const option1Length = Math.abs(h1Length) + Math.abs(v1Length);
                        const option2Length = Math.abs(v2Length) + Math.abs(h2Length);
                        
                        if (option1Length <= option2Length) {
                            // Use horizontal then vertical
                            wire.segments[0].element.style.width = `${Math.abs(h1Length)}px`;
                            wire.segments[0].element.style.left = `${Math.min(startPos.x, endPos.x)}px`;
                            wire.segments[0].element.style.top = `${startPos.y}px`;
                            
                            wire.segments[1].element.style.height = `${Math.abs(v1Length)}px`;
                            wire.segments[1].element.style.left = `${endPos.x}px`;
                            wire.segments[1].element.style.top = `${Math.min(startPos.y, endPos.y)}px`;
                        } else {
                            // Use vertical then horizontal
                            wire.segments[0].element.style.height = `${Math.abs(v2Length)}px`;
                            wire.segments[0].element.style.left = `${startPos.x}px`;
                            wire.segments[0].element.style.top = `${Math.min(startPos.y, endPos.y)}px`;
                            
                            wire.segments[1].element.style.width = `${Math.abs(h2Length)}px`;
                            wire.segments[1].element.style.left = `${Math.min(startPos.x, endPos.x)}px`;
                            wire.segments[1].element.style.top = `${endPos.y}px`;
                        }
                    }
                });
                
                if (showNodes) {
                    displayNodes();
                }
            }
            
            function selectComponent(component) {
                if (selectedComponent) {
                    selectedComponent.classList.remove('selected');
                }
                selectedComponent = component;
                component.classList.add('selected');
                component.style.zIndex = 10;
                
                // Bring other components back to normal z-index
                document.querySelectorAll('.component').forEach(comp => {
                    if (comp !== component) {
                        comp.style.zIndex = 2;
                    }
                });
            }
            
            function showPropertyEditor(component, e) {
                const type = component.getAttribute('data-type');
                const value = component.getAttribute('data-value');
                const unit = component.getAttribute('data-unit');
                
                propValue.value = value;
                propUnit.value = unit;
                
                // Position the editor near the component
                const rect = component.getBoundingClientRect();
                const gridRect = circuitGrid.getBoundingClientRect();
                
                propertyEditor.style.left = `${rect.left - gridRect.left + rect.width + 10}px`;
                propertyEditor.style.top = `${rect.top - gridRect.top}px`;
                propertyEditor.style.display = 'block';
                
                // Store the component being edited
                propertyEditor.setAttribute('data-component-id', component.getAttribute('data-id'));
            }
            
            function updateComponentProperties() {
                const componentId = propertyEditor.getAttribute('data-component-id');
                const component = components.find(c => c.id === componentId);
                
                if (component) {
                    component.value = parseFloat(propValue.value) || 0;
                    component.unit = propUnit.value;
                    
                    component.element.setAttribute('data-value', component.value);
                    component.element.setAttribute('data-unit', component.unit);
                    
                    // Update label
                    const type = component.type;
                    let labelPrefix = '';
                    
                    switch (type) {
                        case 'resistor':
                            labelPrefix = 'R';
                            break;
                        case 'capacitor':
                            labelPrefix = 'C';
                            break;
                        case 'inductor':
                            labelPrefix = 'L';
                            break;
                        case 'voltageSource':
                            labelPrefix = 'Vs';
                            break;
                        case 'currentSource':
                            labelPrefix = 'Is';
                            break;
                        case 'ground':
                            labelPrefix = 'GND';
                            break;
                        case 'diode':
                            labelPrefix = 'D';
                            break;
                        case 'led':
                            labelPrefix = 'LED';
                            break;
                    }
                    
                    const compNum = componentCounters[type];
                    component.label = `${labelPrefix}${compNum} ${component.value}${component.unit}`;
                    component.element.querySelector('.component-label').textContent = component.label;
                }
                
                propertyEditor.style.display = 'none';
            }
            
            function runSimulation() {
                // Clear debug log
                if (debugMode) {
                    debugContent.textContent = '';
                }
                
                simulationStatus.textContent = 'Building circuit...';
                simulationStatus.style.color = '#f59e0b';
                
                // Build circuit graph
                buildCircuitGraph();
                
                simulationStatus.textContent = 'Solving circuit...';
                
                // Solve circuit
                const results = solveCircuit();
                
                simulationStatus.textContent = 'Simulation complete';
                simulationStatus.style.color = '#10b981';
                
                // Display results
                displayResults(results);
                
                // Show modal
                resultsModal.style.display = 'flex';
                
                // Reset status after delay
                setTimeout(() => {
                    simulationStatus.textContent = 'Ready';
                    simulationStatus.style.color = '';
                }, 3000);
            }
            
            function buildCircuitGraph() {
                // Reset nodes
                nodes = {};
                nextNodeId = 1;
                
                // Create a map of all terminals
                const terminals = {};
                components.forEach(comp => {
                    terminals[`${comp.id}:left`] = null;
                    terminals[`${comp.id}:right`] = null;
                });
                
                // Create a union-find structure to merge connected terminals
                const parent = {};
                const rank = {};
                
                // Initialize each terminal as its own set
                Object.keys(terminals).forEach(terminal => {
                    parent[terminal] = terminal;
                    rank[terminal] = 0;
                });
                
                // Find function with path compression
                function find(u) {
                    if (parent[u] !== u) {
                        parent[u] = find(parent[u]);
                    }
                    return parent[u];
                }
                
                // Union function by rank
                function union(u, v) {
                    const rootU = find(u);
                    const rootV = find(v);
                    
                    if (rootU === rootV) return;
                    
                    if (rank[rootU] > rank[rootV]) {
                        parent[rootV] = rootU;
                    } else if (rank[rootU] < rank[rootV]) {
                        parent[rootU] = rootV;
                    } else {
                        parent[rootV] = rootU;
                        rank[rootU]++;
                    }
                }
                
                // Process wires to merge connected terminals
                wires.forEach(wire => {
                    const terminal1 = `${wire.startComponentId}:${wire.startTerminal}`;
                    const terminal2 = `${wire.endComponentId}:${wire.endTerminal}`;
                    union(terminal1, terminal2);
                });
                
                // Assign node IDs to each set
                const terminalToNodeId = {};
                Object.keys(terminals).forEach(terminal => {
                    const root = find(terminal);
                    if (!terminalToNodeId[root]) {
                        terminalToNodeId[root] = nextNodeId++;
                    }
                    nodes[terminal] = terminalToNodeId[root];
                });
                
                // Find ground node and set it to 0
                const groundComponent = components.find(c => c.type === 'ground');
                if (groundComponent) {
                    const groundTerminal = `${groundComponent.id}:left`; // Ground only has one terminal
                    const groundNodeId = nodes[groundTerminal];
                    
                    // Set ground node to 0
                    Object.keys(nodes).forEach(terminal => {
                        if (nodes[terminal] === groundNodeId) {
                            nodes[terminal] = 0;
                        }
                    });
                }
                
                updateStatusBar();
                
                if (showNodes) {
                    displayNodes();
                }
                
                debugLog(`Node mapping:`);
                for (const terminal in nodes) {
                    debugLog(`  ${terminal} -> Node ${nodes[terminal]}`);
                }
            }
            
            function solveCircuit() {
                debugLog(`\n=== Circuit Analysis ===`);
                
                // Get all unique nodes
                const nodeIds = new Set();
                Object.values(nodes).forEach(nodeId => {
                    nodeIds.add(nodeId);
                });
                
                const numNodes = nodeIds.size;
                debugLog(`Total nodes: ${numNodes}`);
                
                // Get voltage sources
                const voltageSources = components.filter(c => c.type === 'voltageSource');
                const numVoltageSources = voltageSources.length;
                debugLog(`Voltage sources: ${numVoltageSources}`);
                
                // Initialize MNA matrices
                const G = math.zeros(numNodes, numNodes); // Conductance matrix
                const B = math.zeros(numNodes, numVoltageSources); // Voltage source incidence matrix
                const C = math.zeros(numVoltageSources, numNodes); // Transpose of B
                const D = math.zeros(numVoltageSources, numVoltageSources); // For voltage sources, usually zero
                const I = math.zeros(numNodes, 1); // Current source vector
                const E = math.zeros(numVoltageSources, 1); // Voltage source vector
                
                // Create a mapping from node ID to matrix index
                const nodeToIndex = {};
                let index = 0;
                nodeIds.forEach(nodeId => {
                    nodeToIndex[nodeId] = index++;
                    debugLog(`Node ${nodeId} -> Index ${nodeToIndex[nodeId]}`);
                });
                
                // Create a mapping from voltage source ID to matrix index
                const vsToIndex = {};
                voltageSources.forEach((vs, i) => {
                    vsToIndex[vs.id] = i;
                    debugLog(`Voltage source ${vs.id} -> Index ${i}`);
                });
                
                // Process each component
                components.forEach(comp => {
                    const leftTerminal = `${comp.id}:left`;
                    const rightTerminal = `${comp.id}:right`;
                    
                    const node1 = nodes[leftTerminal];
                    const node2 = nodes[rightTerminal];
                    
                    const idx1 = nodeToIndex[node1];
                    const idx2 = nodeToIndex[node2];
                    
                    debugLog(`Processing ${comp.type} ${comp.id}: Node ${node1} (idx ${idx1}) to Node ${node2} (idx ${idx2})`);
                    
                    switch (comp.type) {
                        case 'resistor':
                            const R = parseFloat(comp.value) || 1;
                            const conductance = 1 / R;
                            
                            // Add to conductance matrix
                            if (idx1 !== undefined) {
                                G.set([idx1, idx1], G.get([idx1, idx1]) + conductance);
                                if (idx2 !== undefined && node1 !== node2) {
                                    G.set([idx1, idx2], G.get([idx1, idx2]) - conductance);
                                    G.set([idx2, idx1], G.get([idx2, idx1]) - conductance);
                                    G.set([idx2, idx2], G.get([idx2, idx2]) + conductance);
                                }
                            }
                            debugLog(`  Added resistor: R=${R}Ω, G=${conductance}S`);
                            break;
                            
                        case 'voltageSource':
                            const V = parseFloat(comp.value) || 0;
                            const vsIdx = vsToIndex[comp.id];
                            
                            // Add to B matrix
                            if (idx1 !== undefined) {
                                B.set([idx1, vsIdx], B.get([idx1, vsIdx]) + 1);
                            }
                            if (idx2 !== undefined && node1 !== node2) {
                                B.set([idx2, vsIdx], B.get([idx2, vsIdx]) - 1);
                            }
                            
                            // Add to E vector
                            E.set([vsIdx, 0], V);
                            debugLog(`  Added voltage source: V=${V}V`);
                            break;
                            
                        case 'currentSource':
                            const current = parseFloat(comp.value) || 0;
                            
                            // Add to current vector
                            if (idx1 !== undefined) {
                                I.set([idx1, 0], I.get([idx1, 0]) + current);
                            }
                            if (idx2 !== undefined && node1 !== node2) {
                                I.set([idx2, 0], I.get([idx2, 0]) - current);
                            }
                            debugLog(`  Added current source: I=${current}A`);
                            break;
                            
                        // Add cases for other components as needed
                    }
                });
                
                // Set C as transpose of B
                for (let i = 0; i < numVoltageSources; i++) {
                    for (let j = 0; j < numNodes; j++) {
                        C.set([i, j], B.get([j, i]));
                    }
                }
                
                // Form the MNA matrix: A = [[G, B], [C, D]]
                const A = math.zeros(numNodes + numVoltageSources, numNodes + numVoltageSources);
                
                // Fill G
                for (let i = 0; i < numNodes; i++) {
                    for (let j = 0; j < numNodes; j++) {
                        A.set([i, j], G.get([i, j]));
                    }
                }
                
                // Fill B
                for (let i = 0; i < numNodes; i++) {
                    for (let j = 0; j < numVoltageSources; j++) {
                        A.set([i, numNodes + j], B.get([i, j]));
                    }
                }
                
                // Fill C
                for (let i = 0; i < numVoltageSources; i++) {
                    for (let j = 0; j < numNodes; j++) {
                        A.set([numNodes + i, j], C.get([i, j]));
                    }
                }
                
                // Fill D
                for (let i = 0; i < numVoltageSources; i++) {
                    for (let j = 0; j < numVoltageSources; j++) {
                        A.set([numNodes + i, numNodes + j], D.get([i, j]));
                    }
                }
                
                // Form the right-hand side vector: z = [I, E]
                const z = math.zeros(numNodes + numVoltageSources, 1);
                
                // Fill I
                for (let i = 0; i < numNodes; i++) {
                    z.set([i, 0], I.get([i, 0]));
                }
                
                // Fill E
                for (let i = 0; i < numVoltageSources; i++) {
                    z.set([numNodes + i, 0], E.get([i, 0]));
                }
                
                debugLog(`\nMNA Matrix A (${A.size()[0]}x${A.size()[1]}):`);
                debugLog(math.format(A, 4));
                
                debugLog(`\nRHS Vector z (${z.size()[0]}x${z.size()[1]}):`);
                debugLog(math.format(z, 4));
                
                // Remove ground node (node 0) from the system if it exists
                let reducedA, reducedZ, groundIndex = -1;
                
                if (nodeIds.has(0)) {
                    groundIndex = nodeToIndex[0];
                    debugLog(`\nRemoving ground node at index ${groundIndex}`);
                    
                    // Create reduced matrices without the ground row and column
                    const size = numNodes + numVoltageSources - 1;
                    reducedA = math.zeros(size, size);
                    reducedZ = math.zeros(size, 1);
                    
                    // Copy non-ground rows and columns
                    let r = 0;
                    for (let i = 0; i < numNodes + numVoltageSources; i++) {
                        if (i === groundIndex) continue;
                        
                        let c = 0;
                        for (let j = 0; j < numNodes + numVoltageSources; j++) {
                            if (j === groundIndex) continue;
                            
                            reducedA.set([r, c], A.get([i, j]));
                            c++;
                        }
                        
                        reducedZ.set([r, 0], z.get([i, 0]));
                        r++;
                    }
                    
                    debugLog(`\nReduced MNA Matrix (${reducedA.size()[0]}x${reducedA.size()[1]}):`);
                    debugLog(math.format(reducedA, 4));
                    
                    debugLog(`\nReduced RHS Vector (${reducedZ.size()[0]}x${reducedZ.size()[1]}):`);
                    debugLog(math.format(reducedZ, 4));
                } else {
                    reducedA = A;
                    reducedZ = z;
                }
                
                let solution;
                
                try {
                    // Solve the system: A * x = z
                    debugLog(`\nSolving linear system...`);
                    solution = math.lusolve(reducedA, reducedZ);
                    
                    debugLog(`\nSolution vector (${solution.size()[0]}x${solution.size()[1]}):`);
                    debugLog(math.format(solution, 6));
                } catch (e) {
                    console.error("Failed to solve circuit:", e);
                    debugLog(`\nERROR: Failed to solve circuit: ${e.message}`);
                    alert("Failed to solve circuit. Please check your circuit connections.");
                    return {
                        nodeVoltages: {},
                        componentCurrents: {},
                        componentPowers: {}
                    };
                }
                
                // Extract node voltages and voltage source currents
                const nodeVoltages = {};
                const voltageSourceCurrents = {};
                
                // Reinsert ground node voltage (0V)
                if (groundIndex !== -1) {
                    nodeVoltages[0] = 0;
                    debugLog(`\nGround node (0) voltage: 0V`);
                }
                
                // Extract node voltages
                nodeIds.forEach(nodeId => {
                    if (nodeId === 0) return; // Skip ground
                    
                    let voltage;
                    const originalIndex = nodeToIndex[nodeId];
                    
                    if (groundIndex !== -1) {
                        if (originalIndex > groundIndex) {
                            // This node was after the ground node in the original matrix
                            voltage = solution.get([originalIndex - 1, 0]);
                        } else {
                            // This node was before the ground node in the original matrix
                            voltage = solution.get([originalIndex, 0]);
                        }
                    } else {
                        // No ground node was removed
                        voltage = solution.get([originalIndex, 0]);
                    }
                    
                    nodeVoltages[nodeId] = voltage;
                    debugLog(`Node ${nodeId} voltage: ${voltage.toFixed(6)}V`);
                });
                
                // Extract voltage source currents
                voltageSources.forEach(vs => {
                    const vsIdx = vsToIndex[vs.id];
                    let current;
                    
                    if (groundIndex !== -1) {
                        // Calculate the correct index in the solution vector
                        let solutionIndex = numNodes - 1; // Start after all node voltages
                        
                        if (vsIdx >= groundIndex) {
                            // This voltage source was after the ground node
                            solutionIndex += vsIdx - 1;
                        } else {
                            // This voltage source was before the ground node
                            solutionIndex += vsIdx;
                        }
                        
                        current = solution.get([solutionIndex, 0]);
                    } else {
                        // No ground node was removed
                        current = solution.get([numNodes + vsIdx, 0]);
                    }
                    
                    voltageSourceCurrents[vs.id] = current;
                    debugLog(`Voltage source ${vs.id} current: ${current.toFixed(6)}A`);
                });
                
                // Calculate component currents and powers
                const componentCurrents = {};
                const componentPowers = {};
                
                components.forEach(comp => {
                    const leftTerminal = `${comp.id}:left`;
                    const rightTerminal = `${comp.id}:right`;
                    
                    const node1 = nodes[leftTerminal];
                    const node2 = nodes[rightTerminal];
                    
                    const V1 = node1 !== undefined ? nodeVoltages[node1] || 0 : 0;
                    const V2 = node2 !== undefined ? nodeVoltages[node2] || 0 : 0;
                    const V = V1 - V2;
                    
                    let current = 0;
                    let power = 0;
                    
                    switch (comp.type) {
                        case 'resistor':
                            const R = parseFloat(comp.value) || 1;
                            current = V / R;
                            power = V * current;
                            debugLog(`${comp.label}: V=${V.toFixed(6)}V, I=${current.toFixed(6)}A, P=${power.toFixed(6)}W`);
                            break;
                            
                        case 'voltageSource':
                            current = voltageSourceCurrents[comp.id] || 0;
                            power = V * current;
                            debugLog(`${comp.label}: V=${V.toFixed(6)}V, I=${current.toFixed(6)}A, P=${power.toFixed(6)}W`);
                            break;
                            
                        case 'currentSource':
                            current = parseFloat(comp.value) || 0;
                            power = V * current;
                            debugLog(`${comp.label}: V=${V.toFixed(6)}V, I=${current.toFixed(6)}A, P=${power.toFixed(6)}W`);
                            break;
                            
                        default:
                            current = 0;
                            power = 0;
                    }
                    
                    componentCurrents[comp.id] = current;
                    componentPowers[comp.id] = power;
                });
                
                return {
                    nodeVoltages,
                    componentCurrents,
                    componentPowers
                };
            }
            
            function displayResults(results) {
                // Clear previous results
                nodeTable.innerHTML = '';
                componentTable.innerHTML = '';
                
                // Display node voltages
                for (const nodeId in results.nodeVoltages) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="node-id">${nodeId === '0' ? 'Ground (0)' : `Node ${nodeId}`}</td>
                        <td class="voltage-value">${results.nodeVoltages[nodeId].toFixed(4)} V</td>
                    `;
                    nodeTable.appendChild(row);
                }
                
                // Display component currents and powers
                components.forEach(comp => {
                    const current = results.componentCurrents[comp.id] || 0;
                    const power = results.componentPowers[comp.id] || 0;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${comp.label}</td>
                        <td>${comp.type}</td>
                        <td class="current-value">${current.toFixed(6)} A</td>
                        <td class="current-value">${power.toFixed(6)} W</td>
                    `;
                    componentTable.appendChild(row);
                });
                
                // Animate wires to show current flow
                wires.forEach(wire => {
                    wire.segments.forEach(segment => {
                        segment.element.classList.add('active');
                        setTimeout(() => {
                            segment.element.classList.remove('active');
                        }, 2000);
                    });
                });
            }
            
            function clearCircuit() {
                if (confirm('Are you sure you want to clear the circuit?')) {
                    // Remove all components
                    document.querySelectorAll('.component').forEach(comp => comp.remove());
                    document.querySelectorAll('.wire-segment').forEach(segment => segment.remove());
                    hideNodes();
                    
                    // Reset state
                    components = [];
                    wires = [];
                    nodes = {};
                    nextNodeId = 1;
                    nextComponentId = 1;
                    selectedComponent = null;
                    
                    // Reset component counters
                    for (const type in componentCounters) {
                        componentCounters[type] = 0;
                    }
                    
                    updateStatusBar();
                }
            }
            
            function saveCircuit() {
                const circuitData = {
                    components: components.map(comp => ({
                        id: comp.id,
                        type: comp.type,
                        x: parseInt(comp.element.style.left),
                        y: parseInt(comp.element.style.top),
                        value: comp.value,
                        unit: comp.unit,
                        label: comp.label
                    })),
                    wires: wires.map(wire => ({
                        startComponentId: wire.startComponentId,
                        endComponentId: wire.endComponentId,
                        startTerminal: wire.startTerminal,
                        endTerminal: wire.endTerminal
                    })),
                    counters: componentCounters
                };
                
                const dataStr = JSON.stringify(circuitData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportName = 'circuit_' + new Date().toISOString().slice(0, 10) + '.json';
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportName);
                linkElement.click();
            }
            
            function loadCircuit() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.onchange = e => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = event => {
                        try {
                            const circuitData = JSON.parse(event.target.result);
                            
                            // Clear existing circuit
                            clearCircuit();
                            
                            // Restore component counters
                            if (circuitData.counters) {
                                for (const type in circuitData.counters) {
                                    componentCounters[type] = circuitData.counters[type];
                                }
                            }
                            
                            // Load components
                            circuitData.components.forEach(compData => {
                                const component = document.createElement('div');
                                component.className = 'component';
                                component.setAttribute('data-type', compData.type);
                                component.setAttribute('data-id', compData.id);
                                component.setAttribute('data-value', compData.value);
                                component.setAttribute('data-unit', compData.unit);
                                component.style.left = `${compData.x}px`;
                                component.style.top = `${compData.y}px`;
                                
                                // Add component content with SVG
                                component.innerHTML = `
                                    <div class="component-svg-container">
                                        ${componentSVGs[compData.type]}
                                    </div>
                                    <span class="component-label">${compData.label}</span>
                                    <div class="connection-point" data-terminal="left" style="left: -6px; top: 50%; transform: translateY(-50%);"></div>
                                    <div class="connection-point" data-terminal="right" style="right: -6px; top: 50%; transform: translateY(-50%);"></div>
                                `;
                                
                                circuitGrid.appendChild(component);
                                
                                components.push({
                                    id: compData.id,
                                    type: compData.type,
                                    element: component,
                                    value: compData.value,
                                    unit: compData.unit,
                                    label: compData.label
                                });
                                
                                // Update nextComponentId
                                const idNum = parseInt(compData.id.replace('comp_', ''));
                                if (idNum >= nextComponentId) {
                                    nextComponentId = idNum + 1;
                                }
                            });
                            
                            // Load wires
                            circuitData.wires.forEach(wireData => {
                                const startComponent = components.find(c => c.id === wireData.startComponentId).element;
                                const endComponent = components.find(c => c.id === wireData.endComponentId).element;
                                
                                const startPoint = startComponent.querySelector(`.connection-point[data-terminal="${wireData.startTerminal}"]`);
                                const endPoint = endComponent.querySelector(`.connection-point[data-terminal="${wireData.endTerminal}"]`);
                                
                                if (startPoint && endPoint) {
                                    createWire(startPoint, endPoint);
                                }
                            });
                            
                            updateStatusBar();
                            
                            if (showNodes) {
                                displayNodes();
                            }
                            
                        } catch (error) {
                            alert('Error loading circuit file: ' + error.message);
                        }
                    };
                    
                    reader.readAsText(file);
                };
                
                input.click();
            }
        });