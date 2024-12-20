// Initialize Chart.js chart instance
let priceChart = null;

function initializeGraph() {
    const ctx = document.getElementById('priceGraph').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Timestamps
            datasets: [
                {
                    label: 'Price Over Time',
                    data: [], // Prices
                    borderColor: 'blue',
                    borderWidth: 2,
                    tension: 0.2, // Smooth curves
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute', // Adjust based on your data granularity
                        displayFormats: {
                            minute: 'MMM d, HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price'
                    },
                    beginAtZero: false // Prices typically don't start at zero
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Function to update the graph dynamically
function update_graph(data) {
    if (!priceChart) {
        console.error('Graph is not initialized. Call initializeGraph() first.');
        return;
    }

    // Extract timestamps and prices from data
    const timestamps = data.map(entry => new Date(entry[0] * 1000)); // Convert UNIX to JS Date
    const prices = data.map(entry => entry[1]);

    // Update the chart data
    priceChart.data.labels = timestamps;
    priceChart.data.datasets[0].data = prices;

    // Re-render the chart
    priceChart.update();
}

// Call initializeGraph to prepare the graph on page load
initializeGraph();

