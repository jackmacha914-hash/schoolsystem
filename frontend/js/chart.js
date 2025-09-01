 // Example of how to update the student chart (dynamic data example)
        var ctx = document.getElementById('studentChart').getContext('2d');
        var studentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['January', 'February', 'March', 'April'],
                datasets: [{
                    label: 'Students Enrolled',
                    data: [12, 19, 3, 5],  // Example data, replace with dynamic data
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Function to show notifications
        function showNotification(message) {
            var notification = document.createElement('div');
            notification.classList.add('notification');
            notification.innerText = message;
            document.getElementById('notifications').appendChild(notification);
        }

        // Example notification
        showNotification("New event created successfully!");