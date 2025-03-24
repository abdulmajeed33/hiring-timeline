document.addEventListener('DOMContentLoaded', function() {
    // Set total payroll
    const totalPayroll = 363284;
    document.getElementById('total-payroll').textContent = `Total payroll: $${totalPayroll.toLocaleString()}`;
    document.getElementById('date-range').textContent = 'January 01, 2021 – January 01, 2022';

    // Initial data
    let hiringData = [
        { id: 1, month: "2021", role: "Botanist", emoji: "👩‍🌾", salary: 2500, name: "Emma Thompson" },
        { id: 2, month: "Feb", role: "Sales", emoji: "👩‍💼", salary: 4500, name: "Olivia Martinez" },
        { id: 3, month: "Feb", role: "Eng", emoji: "👩‍🔧", salary: 4000, name: "James Wilson" },
        { id: 4, month: "Mar", role: "Design", emoji: "👩‍🎨", salary: 4000, name: "Sophia Garcia" },
        { id: 5, month: "Apr", role: "Marketing", emoji: "👩‍💻", salary: 4000, name: "Noah Smith" },
        { id: 6, month: "Jun", role: "Eng", emoji: "👨‍🔧", salary: 7000, name: "William Johnson" },
        { id: 7, month: "Jul", role: "Intern", emoji: "👩‍🎓", salary: 2000, name: "Ava Brown" },
        { id: 8, month: "Aug", role: "Writer", emoji: "👨‍💻", salary: 5000, name: "Ethan Davis" },
        { id: 9, month: "Aug", role: "Painter", emoji: "👩‍🎨", salary: 5000, name: "Isabella Miller" },
        { id: 10, month: "Sep", role: "Eng", emoji: "👩‍🔧", salary: 6000, name: "Liam Wilson" },
        { id: 11, month: "Oct", role: "Chef", emoji: "👨‍🍳", salary: 5000, name: "Charlotte Taylor" },
        { id: 12, month: "Dec", role: "Eng", emoji: "👨‍🔧", salary: 7500, name: "Mason Anderson" }
    ];

    // Available roles for new hires
    const availableRoles = [
        { role: "Botanist", emoji: "👩‍🌾", defaultSalary: 2500 },
        { role: "Sales", emoji: "👩‍💼", defaultSalary: 4500 },
        { role: "Eng", emoji: "👩‍🔧", defaultSalary: 6000 },
        { role: "Design", emoji: "👩‍🎨", defaultSalary: 4000 },
        { role: "Marketing", emoji: "👩‍💻", defaultSalary: 4000 },
        { role: "Intern", emoji: "👩‍🎓", defaultSalary: 2000 },
        { role: "Writer", emoji: "👨‍💻", defaultSalary: 5000 },
        { role: "Painter", emoji: "👩‍🎨", defaultSalary: 5000 },
        { role: "Chef", emoji: "👨‍🍳", defaultSalary: 5000 }
    ];

    // Month data
    const months = ["2021", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "2022"];
    
    // Monthly indices (for calculating annual costs)
    const monthIndices = {};
    months.forEach((month, index) => {
        if (month !== '2022') {
            monthIndices[month] = index;
        }
    });
    
    // Setup visualization dimensions
    const svgWidth = 1200;
    const svgHeight = 150;
    const timelineY = 100;
    
    // Create SVG container
    const svg = d3.select('#timeline-chart')
        .append('svg')
        .attr('width', '100%')
        .attr('height', svgHeight)
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add drag instructions
    d3.select('#timeline-chart')
        .append('div')
        .attr('class', 'instruction-container')
        .html('<div class="drag-arrow">↔</div> Drag to move<br><div class="plus-icon">+</div> Click below line to add');
    
    // Define timeline positions
    const timelineStart = 80;
    const timelineEnd = svgWidth - 80;
    const timelineLength = timelineEnd - timelineStart;
    const numPositions = months.length;
    
    // Calculate positions for months
    const monthPositions = months.map((_, i) => 
        timelineStart + (i * (timelineLength / (numPositions - 1)))
    );
    
    // Month position lookup for interactive features
    const monthPositionMap = {};
    months.forEach((month, i) => {
        monthPositionMap[month] = monthPositions[i];
    });
    
    // Find month from position (for dragging)
    function getMonthFromPosition(xPos) {
        let closest = months[0];
        let minDistance = Math.abs(monthPositions[0] - xPos);
        
        monthPositions.forEach((pos, i) => {
            const distance = Math.abs(pos - xPos);
            if (distance < minDistance) {
                minDistance = distance;
                closest = months[i];
            }
        });
        
        return closest;
    }
    
    // Create tooltip container with enhanced styling
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('transform', 'scale(0.95)');
    
    // Create modal for adding/editing roles
    const modal = d3.select('body')
        .append('div')
        .attr('class', 'modal')
        .style('display', 'none');
    
    modal.html(`
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2 id="modal-title">Add New Hire</h2>
            <form id="hire-form">
                <div class="form-group">
                    <label for="hire-name">Name:</label>
                    <input type="text" id="hire-name" required>
                </div>
                <div class="form-group">
                    <label for="hire-role">Role:</label>
                    <select id="hire-role" required>
                        ${availableRoles.map(r => `<option value="${r.role}" data-emoji="${r.emoji}" data-salary="${r.defaultSalary}">${r.emoji} ${r.role}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="hire-month">Month:</label>
                    <select id="hire-month" required>
                        ${months.slice(0, months.length - 1).map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="hire-salary">Monthly Salary ($):</label>
                    <input type="number" id="hire-salary" min="1000" required>
                </div>
                <input type="hidden" id="hire-id">
                <button type="submit" class="btn-submit">Save</button>
                <button type="button" class="btn-delete" style="display:none;">Delete</button>
            </form>
        </div>
    `);
    
    // Close modal when clicking X
    modal.select('.close').on('click', () => {
        modal.style('display', 'none');
    });
    
    // Handle form submission
    document.getElementById('hire-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('hire-name').value;
        const role = document.getElementById('hire-role').value;
        const month = document.getElementById('hire-month').value;
        const salary = parseFloat(document.getElementById('hire-salary').value);
        const id = document.getElementById('hire-id').value;
        const emoji = document.getElementById('hire-role').options[document.getElementById('hire-role').selectedIndex].dataset.emoji;
        
        if (id) {
            // Edit existing
            const index = hiringData.findIndex(d => d.id.toString() === id);
            if (index !== -1) {
                hiringData[index] = { ...hiringData[index], name, role, month, salary, emoji };
            }
        } else {
            // Add new
            const newId = Math.max(...hiringData.map(d => d.id), 0) + 1;
            hiringData.push({ id: newId, name, role, month, emoji, salary });
        }
        
        updateVisualization();
        modal.style('display', 'none');
    });
    
    // Handle delete button click
    modal.select('.btn-delete').on('click', () => {
        const id = document.getElementById('hire-id').value;
        if (id) {
            hiringData = hiringData.filter(d => d.id.toString() !== id);
            updateVisualization();
            modal.style('display', 'none');
        }
    });
    
    // When role dropdown changes, update default salary
    document.getElementById('hire-role').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        document.getElementById('hire-salary').value = selectedOption.dataset.salary;
    });
    
    // Function to calculate annual cost based on hiring date
    function calculateAnnualCost(hire) {
        const startMonthIndex = monthIndices[hire.month];
        const monthsEmployed = months.length - 1 - startMonthIndex;
        return hire.salary * monthsEmployed;
    }
    
    // Function to calculate annual projection
    function calculateAnnualProjection() {
        return hiringData.reduce((total, hire) => total + calculateAnnualCost(hire), 0);
    }
    
    // Function to animate an element
    function animateElement(element, className, duration = 1000) {
        element.classed(className, true);
        setTimeout(() => element.classed(className, false), duration);
    }
    
    // Function to draw the timeline with enhanced animations
    function drawTimeline() {
        // Clear previous elements
        svg.selectAll('*').remove();
        
        // Draw timeline
        svg.append('line')
            .attr('class', 'timeline')
            .attr('x1', timelineStart)
            .attr('x2', timelineEnd)
            .attr('y1', timelineY)
            .attr('y2', timelineY)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1);
        
        // Add month labels
        svg.selectAll('.month-label')
            .data(months)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('x', (d, i) => monthPositions[i])
            .attr('y', timelineY + 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(d => d);
        
        // Add click area for adding new roles
        svg.append('rect')
            .attr('class', 'timeline-click-area')
            .attr('x', timelineStart)
            .attr('y', timelineY - 10)
            .attr('width', timelineLength)
            .attr('height', 20)
            .attr('fill', 'transparent')
            .style('cursor', 'pointer')
            .on('click', function(event) {
                const coords = d3.pointer(event);
                const clickX = coords[0];
                
                // Show plus button at click position
                showAddButton(clickX);
            });
        
        // Group roles by month for proper positioning
        const rolesByMonth = {};
        hiringData.forEach(role => {
            if (!rolesByMonth[role.month]) {
                rolesByMonth[role.month] = [];
            }
            rolesByMonth[role.month].push(role);
        });
        
        // Process the roles by month with improved visuals
        Object.keys(rolesByMonth).forEach(month => {
            const roles = rolesByMonth[month];
            const monthPos = monthPositionMap[month];
            
            // Add a blue dot for this month
            svg.append('circle')
                .attr('class', 'timeline-point')
                .attr('cx', monthPos)
                .attr('cy', timelineY)
                .attr('r', 5)
                .attr('fill', '#1976d2');
            
            // Add role emojis with proper spacing and improved tooltips
            const totalRoles = roles.length;
            roles.forEach((role, i) => {
                // Determine horizontal offset for multiple roles
                let offsetX = 0;
                if (totalRoles > 1) {
                    offsetX = (i - (totalRoles - 1) / 2) * 30;
                }
                
                // Create a group for the role (emoji + label)
                const roleGroup = svg.append('g')
                    .attr('data-id', role.id)
                    .attr('transform', `translate(${monthPos + offsetX}, ${timelineY - 45})`)
                    .style('cursor', 'pointer');
                
                // Add invisible circle for better hover area
                roleGroup.append('circle')
                    .attr('class', 'role-hover-area')
                    .attr('r', 20)
                    .attr('cx', 0)
                    .attr('cy', 0);
                
                // Add emoji with subtle animation but no opacity transition on hover
                roleGroup.append('text')
                    .attr('class', 'emoji')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle') // Better text centering
                    .attr('font-size', '24px')
                    .text(role.emoji)
                    .style('opacity', 0)
                    .transition()
                    .duration(300)
                    .style('opacity', 1);
                
                // Add role label
                roleGroup.append('text')
                    .attr('class', 'role-label')
                    .attr('x', 0)
                    .attr('y', 20)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .text(role.role);
                
                // Add enhanced tooltip - use the group for events, not individual elements
                // roleGroup
                //     .on('mouseenter', function(event) {
                //         // Prevent rapid hover state changes
                //         event.stopPropagation();
                        
                //         tooltip.transition()
                //             .duration(200)
                //             .style('opacity', 0.9)
                //             .style('transform', 'scale(1)');
                        
                //         // Calculate annual cost for this employee
                //         const annualCost = calculateAnnualCost(role);
                        
                //         tooltip.html(`
                //             <strong>${role.name}</strong><br/>
                //             Role: <strong>${role.role}</strong><br/>
                //             Salary: <strong>$${role.salary.toLocaleString()}/month</strong><br/>
                //             Annual cost: <strong>$${annualCost.toLocaleString()}</strong><br/>
                //             <small>(Click to edit)</small>
                //         `)
                //         .style('left', (event.pageX + 10) + 'px')
                //         .style('top', (event.pageY - 28) + 'px');
                //     })
                //     .on('mouseleave', function() {
                //         tooltip.transition()
                //             .duration(300)
                //             .style('opacity', 0)
                //             .style('transform', 'scale(0.95)');
                //     })
                //     .on('click', function() {
                //         showEditModal(role);
                //     });
                
                // Make role draggable with improved visual feedback
                roleGroup.call(d3.drag()
                    .on('start', function(event) {
                        d3.select(this)
                            .style('cursor', 'grabbing')
                            .raise(); // Bring to front
                        
                        // Create the triangle connector
                        const connector = svg.append('path')
                            .attr('class', 'drag-connector')
                            .attr('stroke', '#1976d2')
                            .attr('stroke-width', 2)
                            .attr('fill', 'none');
                            
                        // Add visual indicator for current month
                        svg.append('circle')
                            .attr('class', 'current-month-indicator')
                            .attr('cx', monthPositionMap[role.month])
                            .attr('cy', timelineY)
                            .attr('r', 8)
                            .attr('fill', 'none')
                            .attr('stroke', '#1976d2')
                            .attr('stroke-width', 1)
                            .attr('stroke-dasharray', '3,2');
                    })
                    .on('drag', function(event) {
                        // Update position while dragging
                        const x = event.x;
                        const y = Math.min(timelineY - 30, event.y); // Keep it above the timeline
                        
                        d3.select(this).attr('transform', `translate(${x}, ${y})`);
                        
                        // Update the triangle connector
                        const trianglePath = `M ${x} ${y + 25} L ${monthPositionMap[role.month]} ${timelineY}`;
                        svg.select('.drag-connector').attr('d', trianglePath);
                        
                        // Get target month at current position
                        const targetMonth = getMonthFromPosition(x);
                        
                        // Remove previous target indicator
                        svg.selectAll('.target-month-indicator').remove();
                        
                        // Don't highlight 2022 as a valid target
                        if (targetMonth !== '2022') {
                            // Add visual indicator for target month
                            svg.append('circle')
                                .attr('class', 'target-month-indicator')
                                .attr('cx', monthPositionMap[targetMonth])
                                .attr('cy', timelineY)
                                .attr('r', 8)
                                .attr('fill', 'rgba(25, 118, 210, 0.2)')
                                .attr('stroke', '#1976d2')
                                .attr('stroke-width', 1.5);
                        }
                    })
                    .on('end', function(event) {
                        // Determine closest month
                        const newMonth = getMonthFromPosition(event.x);
                        
                        // Update data if month changed
                        if (newMonth !== role.month && newMonth !== '2022') {
                            // Store original month for undo capability
                            const originalMonth = role.month;
                            
                            // Update month
                            role.month = newMonth;
                            
                            // Add subtle feedback animation
                            d3.select(this).style('transform', 'scale(1.2)')
                                .transition()
                                .duration(300)
                                .style('transform', 'scale(1)');
                            
                            updateVisualization();
                            
                            // Show feedback about change
                            tooltip.transition()
                                .duration(200)
                                .style('opacity', 0.9);
                            
                            // Calculate cost change
                            const oldCost = calculateAnnualCost({...role, month: originalMonth});
                            const newCost = calculateAnnualCost(role);
                            const difference = newCost - oldCost;
                            
                            tooltip.html(`
                                <strong>Moved to ${newMonth}</strong><br/>
                                ${difference > 0 ? 
                                    `Annual cost increased by <span style="color:red">$${difference.toLocaleString()}</span>` : 
                                    `Annual cost reduced by <span style="color:green">$${Math.abs(difference).toLocaleString()}</span>`}
                            `)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                            
                            setTimeout(() => {
                                tooltip.transition()
                                    .duration(500)
                                    .style('opacity', 0);
                            }, 3000);
                            
                        } else {
                            // If no change or invalid target, reset position
                            drawTimeline();
                        }
                        
                        // Remove the triangle connector and indicators
                        svg.select('.drag-connector').remove();
                        svg.select('.current-month-indicator').remove();
                        svg.select('.target-month-indicator').remove();
                        
                        // Reset cursor
                        d3.select(this).style('cursor', 'grab');
                    })
                );
            });
        });
    }
    
    // Function to display the plus button at a specific position with animation
    function showAddButton(xPos) {
        // Remove any existing button
        svg.selectAll('.add-button').remove();
        
        // Get closest month position
        const month = getMonthFromPosition(xPos);
        const monthPos = monthPositionMap[month];
        
        // Only allow adding to actual months (not 2022)
        if (month === '2022') return;
        
        // Create plus button group with animation
        const addButton = svg.append('g')
            .attr('class', 'add-button')
            .attr('transform', `translate(${monthPos}, ${timelineY - 20})`)
            .style('cursor', 'pointer')
            .on('click', function() {
                // When clicked, show the add modal
                showAddModal(month);
            });
        
        // Add circle background with pulse animation
        addButton.append('circle')
            .attr('r', 0)
            .attr('fill', '#4CAF50')
            .transition()
            .duration(300)
            .attr('r', 10);
        
        // Add plus sign
        addButton.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '16px')
            .style('opacity', 0)
            .text('+')
            .transition()
            .duration(300)
            .style('opacity', 1);
    }
    
    // Function to show add modal with improved animation
    function showAddModal(month) {
        // Reset form
        document.getElementById('hire-form').reset();
        document.getElementById('hire-id').value = '';
        document.getElementById('modal-title').textContent = 'Add New Hire';
        document.getElementById('hire-month').value = month;
        
        // Update default salary based on first role
        const defaultSalary = availableRoles[0].defaultSalary;
        document.getElementById('hire-salary').value = defaultSalary;
        
        // Hide delete button for new hires
        modal.select('.btn-delete').style('display', 'none');
        
        // Show modal with animation
        modal.style('display', 'block')
            .classed('fade-in', true);
    }
    
    // Function to show edit modal with improved animation
    function showEditModal(role) {
        // Populate form with existing data
        document.getElementById('hire-name').value = role.name;
        document.getElementById('hire-role').value = role.role;
        document.getElementById('hire-month').value = role.month;
        document.getElementById('hire-salary').value = role.salary;
        document.getElementById('hire-id').value = role.id;
        document.getElementById('modal-title').textContent = 'Edit Hire';
        
        // Show delete button
        modal.select('.btn-delete').style('display', 'inline-block');
        
        // Show modal with animation
        modal.style('display', 'block')
            .classed('fade-in', true);
    }
    
    // Function to calculate payroll data
    function calculatePayroll() {
        const payrollByMonth = {};
        
        // Initialize all months with 0
        months.slice(0, -1).forEach(month => {
            payrollByMonth[month] = 0;
        });
        
        // Sum salaries by month
        hiringData.forEach(hire => {
            payrollByMonth[hire.month] += hire.salary;
        });
        
        // Calculate cumulative payroll
        let cumulativePayroll = {};
        let runningTotal = 0;
        
        months.slice(0, -1).forEach(month => {
            runningTotal += payrollByMonth[month];
            cumulativePayroll[month] = runningTotal;
        });
        
        // Convert to array format for D3
        return Object.keys(payrollByMonth).map(month => ({
            month: month,
            value: payrollByMonth[month] / 1000, // Convert to thousands
            cumulative: cumulativePayroll[month] // Store cumulative for tooltip
        }));
    }
    
    // Function to render payroll chart with improved visuals
    function drawPayrollChart() {
        // Clear previous payroll chart
        d3.select('#payroll-chart').html('');
        
        const payrollData = calculatePayroll();
        
        const payrollWidth = svgWidth;
        const payrollHeight = 350;
        
        const payrollSvg = d3.select('#payroll-chart')
            .append('svg')
            .attr('width', '100%')
            .attr('height', payrollHeight)
            .attr('viewBox', `0 0 ${payrollWidth} ${payrollHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // Add y-axis label
        payrollSvg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -180)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text('Monthly Payroll (in thousands)');
        
        const chartMargin = { top: 30, right: 40, bottom: 40, left: 60 };
        const chartWidth = payrollWidth - chartMargin.left - chartMargin.right;
        const chartHeight = payrollHeight - chartMargin.top - chartMargin.bottom;
        
        const chart = payrollSvg.append('g')
            .attr('transform', `translate(${chartMargin.left}, ${chartMargin.top})`);
        
        // X scale
        const x = d3.scaleBand()
            .domain(payrollData.map(d => d.month))
            .range([0, chartWidth])
            .padding(0.3);
        
        // Determine max value for y scale (ensure it's at least 50 for consistency)
        const maxValue = Math.max(50, d3.max(payrollData, d => d.value) * 1.1);
        
        // Y scale
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .range([chartHeight, 0]);
        
        // X axis
        chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(x));
        
        // Y axis with dollar format
        chart.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y)
                .tickFormat(d => `$${d}k`)
                .tickValues(d3.range(0, maxValue + 5, 5))
            );
        
        // Add mouseover highlight area
        chart.append('rect')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .attr('fill', 'transparent')
            .on('mousemove', function(event) {
                const [mouseX] = d3.pointer(event);
                const xPos = Math.floor(mouseX / x.bandwidth());
                const month = months[xPos];
                
                // Highlight the appropriate bar
                chart.selectAll('.bar-filled, .bar-outline')
                    .attr('opacity', d => d.month === month ? 1 : 0.7);
            })
            .on('mouseleave', function() {
                // Reset all bars
                chart.selectAll('.bar-filled, .bar-outline')
                    .attr('opacity', 1);
            });
        
        // Add bars - first 5 months as filled, rest as outlines with improved visuals
        payrollData.slice(0, 5).forEach((d, i) => {
            chart.append('rect')
                .attr('class', 'bar-filled')
                .attr('x', x(d.month))
                .attr('y', y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', 0) // Start with 0 height
                .transition() // Add animation
                .duration(500)
                .delay(i * 50)
                .attr('height', chartHeight - y(d.value))
                .on('end', function() {
                    // Add interaction after animation is complete
                    d3.select(this)
                        .on('mouseenter', function(event) {
                            tooltip.transition()
                                .duration(200)
                                .style('opacity', 0.9);
                            
                            tooltip.html(`
                                <strong>${d.month} Payroll</strong><br/>
                                Monthly: $${(d.value * 1000).toLocaleString()}<br/>
                                Running total: $${d.cumulative.toLocaleString()}<br/>
                                <hr style="margin: 5px 0; opacity: 0.3">
                                ${hiringData.filter(h => h.month === d.month)
                                    .map(h => `${h.emoji} ${h.name}: $${h.salary.toLocaleString()}`)
                                    .join('<br/>')}
                            `)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                        })
                        .on('mouseleave', function() {
                            tooltip.transition()
                                .duration(500)
                                .style('opacity', 0);
                        });
                });
        });
        
        payrollData.slice(5).forEach((d, i) => {
            chart.append('rect')
                .attr('class', 'bar-outline')
                .attr('x', x(d.month))
                .attr('y', y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', 0) // Start with 0 height
                .transition() // Add animation
                .duration(500)
                .delay((i + 5) * 50) // Continue delay sequence
                .attr('height', chartHeight - y(d.value))
                .on('end', function() {
                    // Add interaction after animation is complete
                    d3.select(this)
                        .on('mouseenter', function(event) {
                            tooltip.transition()
                                .duration(200)
                                .style('opacity', 0.9);
                            
                            tooltip.html(`
                                <strong>${d.month} Payroll</strong><br/>
                                Monthly: $${(d.value * 1000).toLocaleString()}<br/>
                                Running total: $${d.cumulative.toLocaleString()}<br/>
                                <hr style="margin: 5px 0; opacity: 0.3">
                                ${hiringData.filter(h => h.month === d.month)
                                    .map(h => `${h.emoji} ${h.name}: $${h.salary.toLocaleString()}`)
                                    .join('<br/>')}
                            `)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                        })
                        .on('mouseleave', function() {
                            tooltip.transition()
                                .duration(500)
                                .style('opacity', 0);
                        });
                });
        });
        
        // Update total payroll and annual projection in header
        const monthlySumPayroll = payrollData.reduce((sum, d) => sum + (d.value * 1000), 0);
        document.getElementById('total-payroll').textContent = `Total monthly payroll: $${monthlySumPayroll.toLocaleString()}`;
        
        const annualProjection = calculateAnnualProjection();
        document.getElementById('annual-projection').textContent = 
            `Annual projection: $${annualProjection.toLocaleString()}`;
    }
    
    // Function to update the entire visualization
    function updateVisualization() {
        drawTimeline();
        drawPayrollChart();
    }
    
    // Predefined scenarios
    const scenarios = {
        startup: [
            { id: 1, month: "2021", role: "Eng", emoji: "👩‍🔧", salary: 5000, name: "Alex Johnson" },
            { id: 2, month: "Feb", role: "Design", emoji: "👩‍🎨", salary: 4000, name: "Taylor Smith" },
            { id: 3, month: "Mar", role: "Sales", emoji: "👩‍💼", salary: 4500, name: "Jordan Lee" }
        ],
        growth: [
            { id: 1, month: "2021", role: "Eng", emoji: "👩‍🔧", salary: 7000, name: "Alex Johnson" },
            { id: 2, month: "2021", role: "Design", emoji: "👩‍🎨", salary: 6000, name: "Taylor Smith" },
            { id: 3, month: "Feb", role: "Sales", emoji: "👩‍💼", salary: 5000, name: "Jordan Lee" },
            { id: 4, month: "Mar", role: "Marketing", emoji: "👩‍💻", salary: 4500, name: "Casey Brown" },
            { id: 5, month: "Apr", role: "Eng", emoji: "👨‍🔧", salary: 7000, name: "Riley Wilson" },
            { id: 6, month: "Jun", role: "Sales", emoji: "👩‍💼", salary: 5000, name: "Avery Garcia" }
        ],
        enterprise: [
            { id: 1, month: "2021", role: "Eng", emoji: "👩‍🔧", salary: 10000, name: "Alex Johnson" },
            { id: 2, month: "2021", role: "Design", emoji: "👩‍🎨", salary: 8000, name: "Taylor Smith" },
            { id: 3, month: "2021", role: "Sales", emoji: "👩‍💼", salary: 9000, name: "Jordan Lee" },
            { id: 4, month: "Feb", role: "Marketing", emoji: "👩‍💻", salary: 7000, name: "Casey Brown" },
            { id: 5, month: "Feb", role: "Eng", emoji: "👨‍🔧", salary: 10000, name: "Riley Wilson" },
            { id: 6, month: "Mar", role: "Sales", emoji: "👩‍💼", salary: 9000, name: "Avery Garcia" },
            { id: 7, month: "Apr", role: "Eng", emoji: "👩‍🔧", salary: 10000, name: "Morgan Davis" },
            { id: 8, month: "May", role: "Design", emoji: "👩‍🎨", salary: 8000, name: "Quinn Roberts" },
            { id: 9, month: "Jul", role: "Eng", emoji: "👨‍🔧", salary: 12000, name: "Skyler Clark" }
        ]
    };
    
    // Scenario button handlers
    document.querySelectorAll('.scenario-btn').forEach(button => {
        button.addEventListener('click', function() {
            const scenario = this.dataset.scenario;
            if (scenarios[scenario]) {
                // Apply the selected scenario
                hiringData = JSON.parse(JSON.stringify(scenarios[scenario])); // Deep copy
                updateVisualization();
                
                // Show feedback
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                
                tooltip.html(`
                    <strong>${this.textContent} scenario applied</strong><br/>
                    ${hiringData.length} employees<br/>
                    Annual projection: $${calculateAnnualProjection().toLocaleString()}
                `)
                .style('left', (window.innerWidth / 2) + 'px')
                .style('top', '100px');
                
                setTimeout(() => {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                }, 3000);
            }
        });
    });
    
    // Clear all button handler
    document.getElementById('clear-all-btn').addEventListener('click', function() {
        hiringData = [];
        updateVisualization();
    });
    
    // Delay hiring button handler
    document.getElementById('delay-hiring-btn').addEventListener('click', function() {
        // Move each hire two months later (if possible)
        hiringData.forEach(hire => {
            const currentIndex = months.indexOf(hire.month);
            if (currentIndex < months.length - 3) { // Ensure we don't go past December
                hire.month = months[currentIndex + 2];
            }
        });
        updateVisualization();
        
        // Show savings feedback
        const annualProjection = calculateAnnualProjection();
        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
        
        tooltip.html(`
            <strong>Hiring delayed by 2 months</strong><br/>
            New annual projection: $${annualProjection.toLocaleString()}<br/>
            <span style="color:green">This could save you money!</span>
        `)
        .style('left', (window.innerWidth / 2) + 'px')
        .style('top', '100px');
        
        setTimeout(() => {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        }, 3000);
    });
    
    // Initial render
    updateVisualization();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal.node()) {
            modal.style('display', 'none');
        }
    });
});
