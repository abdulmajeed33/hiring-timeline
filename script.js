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
    
    // Create tooltip container
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
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
    
    // Function to draw the timeline
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
        
        // Process the roles by month
        Object.keys(rolesByMonth).forEach(month => {
            const roles = rolesByMonth[month];
            const monthPos = monthPositionMap[month];
            
            // Add a blue dot for this month
            svg.append('circle')
                .attr('class', 'timeline-point')
                .attr('cx', monthPos)
                .attr('cy', timelineY)
                .attr('r', 5)
                .attr('fill', '#4285F4');
            
            // Add role emojis with proper spacing
            const totalRoles = roles.length;
            roles.forEach((role, i) => {
                // Determine horizontal offset for multiple roles
                let offsetX = 0;
                if (totalRoles > 1) {
                    offsetX = (i - (totalRoles - 1) / 2) * 30;
                }
                
                // Create a group for the role (emoji + label)
                const roleGroup = svg.append('g')
                    .attr('class', 'role-group')
                    .attr('data-id', role.id)
                    .attr('transform', `translate(${monthPos + offsetX}, ${timelineY - 45})`)
                    .style('cursor', 'grab');
                
                // Add emoji
                roleGroup.append('text')
                    .attr('class', 'emoji')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '24px')
                    .text(role.emoji);
                
                // Add role label
                roleGroup.append('text')
                    .attr('class', 'role-label')
                    .attr('x', 0)
                    .attr('y', 20)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .text(role.role);
                
                // Add hover tooltip
                roleGroup
                    .on('mouseenter', function(event) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', 0.9);
                        
                        tooltip.html(`
                            <strong>${role.name}</strong><br/>
                            Role: ${role.role}<br/>
                            Salary: $${role.salary.toLocaleString()}/month<br/>
                            <small>(Click to edit)</small>
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseleave', function() {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    })
                    .on('click', function() {
                        showEditModal(role);
                    });
                
                // Make role draggable
                roleGroup.call(d3.drag()
                    .on('start', function() {
                        d3.select(this).style('cursor', 'grabbing');
                        
                        // Create the triangle connector
                        const connector = svg.append('path')
                            .attr('class', 'drag-connector')
                            .attr('stroke', '#4285F4')
                            .attr('stroke-width', 2)
                            .attr('fill', 'none');
                    })
                    .on('drag', function(event) {
                        // Update position while dragging
                        const x = event.x;
                        const y = Math.min(timelineY - 30, event.y); // Keep it above the timeline
                        
                        d3.select(this).attr('transform', `translate(${x}, ${y})`);
                        
                        // Update the triangle connector
                        const trianglePath = `M ${x} ${y + 25} L ${monthPositionMap[role.month]} ${timelineY}`;
                        svg.select('.drag-connector').attr('d', trianglePath);
                    })
                    .on('end', function(event) {
                        // Determine closest month
                        const newMonth = getMonthFromPosition(event.x);
                        
                        // Update data if month changed
                        if (newMonth !== role.month && newMonth !== '2022') {
                            role.month = newMonth;
                            updateVisualization();
                        } else {
                            // If no change or invalid target, reset position
                            drawTimeline();
                        }
                        
                        // Remove the triangle connector
                        svg.select('.drag-connector').remove();
                        
                        // Reset cursor
                        d3.select(this).style('cursor', 'grab');
                    })
                );
            });
        });
    }
    
    // Function to display the plus button at a specific position
    function showAddButton(xPos) {
        // Remove any existing button
        svg.selectAll('.add-button').remove();
        
        // Get closest month position
        const month = getMonthFromPosition(xPos);
        const monthPos = monthPositionMap[month];
        
        // Only allow adding to actual months (not 2022)
        if (month === '2022') return;
        
        // Create plus button group
        const addButton = svg.append('g')
            .attr('class', 'add-button')
            .attr('transform', `translate(${monthPos}, ${timelineY - 20})`)
            .style('cursor', 'pointer')
            .on('click', function() {
                // When clicked, show the add modal
                showAddModal(month);
            });
        
        // Add circle background
        addButton.append('circle')
            .attr('r', 10)
            .attr('fill', '#4CAF50');
        
        // Add plus sign
        addButton.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '16px')
            .text('+');
    }
    
    // Function to show add modal
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
        
        // Show modal
        modal.style('display', 'block');
    }
    
    // Function to show edit modal
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
        
        // Show modal
        modal.style('display', 'block');
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
        
        // Convert to array format for D3
        return Object.keys(payrollByMonth).map(month => ({
            month: month,
            value: payrollByMonth[month] / 1000 // Convert to thousands
        }));
    }
    
    // Function to render payroll chart
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
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text('↓ Payroll / mo. (k)');
        
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
        
        // Y axis with negative-looking labels
        chart.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y)
                .tickFormat(d => d === 0 ? '$0' : `~$-${d}`)
                .tickValues(d3.range(0, maxValue + 5, 5))
            );
        
        // Add warning icon
        payrollSvg.append('text')
            .attr('x', payrollWidth - 30)
            .attr('y', 20)
            .attr('class', 'warning-icon')
            .attr('text-anchor', 'middle')
            .text('⚠');
        
        // Add bars - first 5 months as red, rest as outlines
        // Determine cutoff index for filled vs outlined bars (maintain 5 filled bars)
        payrollData.slice(0, 5).forEach(d => {
            chart.append('rect')
                .attr('class', 'bar-filled')
                .attr('x', x(d.month))
                .attr('y', y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', chartHeight - y(d.value))
                .on('mouseenter', function(event) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    
                    tooltip.html(`
                        <strong>${d.month} Payroll</strong><br/>
                        Total: $${(d.value * 1000).toLocaleString()}/month<br/>
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
        
        payrollData.slice(5).forEach(d => {
            chart.append('rect')
                .attr('class', 'bar-outline')
                .attr('x', x(d.month))
                .attr('y', y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', chartHeight - y(d.value))
                .on('mouseenter', function(event) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    
                    tooltip.html(`
                        <strong>${d.month} Payroll</strong><br/>
                        Total: $${(d.value * 1000).toLocaleString()}/month<br/>
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
        
        // Update total payroll in header
        const annualPayroll = payrollData.reduce((sum, d) => sum + (d.value * 1000), 0);
        document.getElementById('total-payroll').textContent = `Total payroll: $${annualPayroll.toLocaleString()}`;
    }
    
    // Function to update the entire visualization
    function updateVisualization() {
        drawTimeline();
        drawPayrollChart();
    }
    
    // Initial render
    updateVisualization();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal.node()) {
            modal.style('display', 'none');
        }
    });
});
