
            function randomWalker(
                canvas,
                {
                    nodeDensity = 20,
                    numWalkers = 4,
                    walkSpeed = 500,
                    nodeSize = 1.5,
                    linkWidth = 0.8,
                    refreshTime = 80,
                } = {},
            ) {
                const ctx = canvas.getContext("2d");

                // Configuration parameters
                const config = {
                    nodeDensity,
                    numWalkers,
                    walkSpeed,
                    nodeSize,
                    linkWidth,
                    refreshTime,
                };

                // Animation state
                let grid = [];
                let walkers = [];
                let animationFrameId;
                let lastDrawTime = 0;
                let lastWalkTime = 0;

                // from https://easings.net/#easeInOutExpo
                function easeInOutExpo(x) {
                    return x === 0
                        ? 0
                        : x === 1
                          ? 1
                          : x < 0.5
                            ? Math.pow(2, 20 * x - 10) / 2
                            : (2 - Math.pow(2, -20 * x + 10)) / 2;
                }

                // Set canvas size
                function resizeCanvas() {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    initializeGrid();
                    initializeWalkers();
                }

                // Initialize the grid of nodes (just positions)
                function initializeGrid() {
                    grid = [];
                    const cols = Math.floor(canvas.width / config.nodeDensity);
                    const rows = Math.floor(canvas.height / config.nodeDensity);

                    for (let y = 0; y < rows; y++) {
                        grid[y] = [];
                        for (let x = 0; x < cols; x++) {
                            grid[y][x] = {
                                x:
                                    x * config.nodeDensity +
                                    config.nodeDensity / 2,
                                y:
                                    y * config.nodeDensity +
                                    config.nodeDensity / 2,
                            };
                        }
                    }
                }

                // Get all visited positions by all walkers, optionally excluding one walker
                function getAllVisitedPositions(excludedWalker = null) {
                    const visited = new Set();
                    for (const walker of walkers) {
                        if (walker === excludedWalker) continue;
                        for (const pos of walker.path) {
                            visited.add(`${pos.x},${pos.y}`);
                        }
                    }
                    return visited;
                }

                // Initialize walkers at random positions
                function initializeWalkers() {
                    walkers = [];
                    for (let i = 0; i < config.numWalkers; i++) {
                        const walker = {};
                        if (initializeWalker(walker)) {
                            walkers.push(walker);
                        }
                    }
                }

                // Reinitialize a stuck walker to a new position
                function initializeWalker(walker) {
                    let attempts = 0;
                    let newPosition;
                    const visitedPositions = getAllVisitedPositions(walker);

                    do {
                        const gridY = Math.floor(Math.random() * grid.length);
                        const gridX = Math.floor(
                            Math.random() * grid[0].length,
                        );
                        newPosition = { x: gridX, y: gridY };
                        attempts++;
                    } while (
                        visitedPositions.has(
                            `${newPosition.x},${newPosition.y}`,
                        ) &&
                        attempts < 50
                    );

                    if (attempts < 50) {
                        Object.assign(walker, {
                            gridX: newPosition.x,
                            gridY: newPosition.y,
                            path: [{ x: newPosition.x, y: newPosition.y }],
                            active: true,
                            stuckTurns: 0,
                        });
                        return true;
                    }

                    walker.active = false;
                    return false;
                }

                // Get valid neighbors for a walker
                function getValidNeighbors(walker) {
                    const { gridX, gridY } = walker;
                    const neighbors = [];
                    const directions = [
                        { dx: 0, dy: -1 }, // up
                        { dx: 1, dy: 0 }, // right
                        { dx: 0, dy: 1 }, // down
                        { dx: -1, dy: 0 }, // left
                    ];
                    const visitedPositions = getAllVisitedPositions();

                    for (const { dx, dy } of directions) {
                        const newX = gridX + dx;
                        const newY = gridY + dy;

                        if (
                            grid[newY]?.[newX] &&
                            !visitedPositions.has(`${newX},${newY}`)
                        ) {
                            neighbors.push({ x: newX, y: newY });
                        }
                    }

                    return neighbors;
                }

                // Move walkers one step
                function moveWalkers() {
                    for (const walker of walkers) {
                        if (!walker.active) {
                            walker.stuckTurns++;
                            if (walker.stuckTurns >= 5) {
                                initializeWalker(walker);
                            }
                            continue;
                        }

                        const neighbors = getValidNeighbors(walker);

                        if (neighbors.length > 0) {
                            const next =
                                neighbors[
                                    Math.floor(Math.random() * neighbors.length)
                                ];
                            walker.gridX = next.x;
                            walker.gridY = next.y;
                            walker.path.push({ x: next.x, y: next.y });
                        } else {
                            walker.active = false;
                        }
                    }
                }

                // Draw base grid with standard dots
                function drawBaseGrid() {
                    ctx.fillStyle = "rgba(100, 100, 100, 0.15)";
                    for (const row of grid) {
                        for (const node of row) {
                            ctx.beginPath();
                            ctx.arc(
                                node.x,
                                node.y,
                                config.nodeSize,
                                0,
                                Math.PI * 2,
                            );
                            ctx.fill();
                        }
                    }
                }

                // Draw a single walker's path
                function drawWalker(walker, timestamp) {
                    if (walker.path.length < 1) return;

                    const progress = easeInOutExpo(
                        Math.min(
                            1,
                            (timestamp - lastWalkTime) / config.walkSpeed,
                        ),
                    );

                    const { path, active, stuckTurns } = walker;
                    const lastPos = path[path.length - 1];
                    const lastNode = grid[lastPos.y][lastPos.x];
                    let walkerHeadX = lastNode.x;
                    let walkerHeadY = lastNode.y;

                    if (active && path.length > 1) {
                        const prevPos = path[path.length - 2];
                        const prevNode = grid[prevPos.y][prevPos.x];
                        walkerHeadX =
                            prevNode.x + (lastNode.x - prevNode.x) * progress;
                        walkerHeadY =
                            prevNode.y + (lastNode.y - prevNode.y) * progress;
                    }

                    // Draw path links
                    if (path.length > 1) {
                        ctx.lineWidth = config.linkWidth;
                        for (let i = 1; i < path.length; i++) {
                            const fromNode = grid[path[i - 1].y][path[i - 1].x];
                            const toNode = grid[path[i].y][path[i].x];
                            const age = (path.length - i) / path.length;
                            const alpha =
                                Math.max(0.1, 0.6 - age * 0.4) /
                                (stuckTurns + 1);
                            ctx.strokeStyle = `rgba(120, 120, 120, ${alpha})`;
                            ctx.beginPath();
                            ctx.moveTo(fromNode.x, fromNode.y);

                            if (i === path.length - 1 && active) {
                                ctx.lineTo(walkerHeadX, walkerHeadY);
                            } else {
                                ctx.lineTo(toNode.x, toNode.y);
                            }
                            ctx.stroke();
                        }
                    }

                    // Draw path nodes
                    for (let i = 0; i < path.length - (active ? 1 : 0); i++) {
                        const pos = path[i];
                        const node = grid[pos.y][pos.x];
                        const age = (path.length - i - 1) / path.length;
                        const alpha =
                            (0.4 + Math.max(0, 0.3 - age * 0.2)) /
                            (stuckTurns + 1);

                        ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                        ctx.beginPath();
                        ctx.arc(
                            node.x,
                            node.y,
                            config.nodeSize,
                            0,
                            Math.PI * 2,
                        );
                        ctx.fill();
                    }

                    // Draw active walker head
                    if (active) {
                        ctx.fillStyle = `rgba(80, 80, 80, ${0.7 + progress * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(
                            walkerHeadX,
                            walkerHeadY,
                            config.nodeSize + progress * 0.5,
                            0,
                            Math.PI * 2,
                        );
                        ctx.fill();
                    }
                }

                // Render the animation
                function render(timestamp) {
                    animationFrameId = requestAnimationFrame(render);

                    // skip rendering if not enough time has passed
                    if (timestamp - lastDrawTime < config.refreshTime) {
                        return;
                    }
                    lastDrawTime = timestamp;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // move walkers if enough time has passed
                    if (timestamp - lastWalkTime > config.walkSpeed) {
                        moveWalkers();
                        lastWalkTime = timestamp;
                    }

                    // draw grid and walkers
                    drawBaseGrid();
                    for (const walker of walkers) {
                        drawWalker(walker, timestamp);
                    }
                }

                // Event listeners
                window.addEventListener("resize", resizeCanvas);

                // Initialize
                resizeCanvas();
                render(0);
            }

