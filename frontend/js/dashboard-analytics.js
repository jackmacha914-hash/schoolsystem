// Dashboard Analytics Panel Logic (Chart.js required)
document.addEventListener('DOMContentLoaded', async function() {
    const chartUsers = document.getElementById('chart-users');
    const chartClubs = document.getElementById('chart-clubs');
    const chartBooks = document.getElementById('chart-books');
    const chartFees = document.getElementById('chart-fees');
    const chartEvents = document.getElementById('chart-events');

    if (!chartUsers || !chartClubs || !chartBooks || !chartFees || !chartEvents) {
        console.error('One or more chart containers not found');
        return;
    }

    const ctxUsers = chartUsers.getContext('2d');
    const ctxClubs = chartClubs.getContext('2d');
    const ctxBooks = chartBooks.getContext('2d');
    const ctxFees = chartFees.getContext('2d');
    const ctxEvents = chartEvents.getContext('2d');

    // Fetch stats from backend endpoints
    const token = localStorage.getItem('token');
    async function fetchCount(url) {
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            return data.count || (Array.isArray(data) ? data.length : 0);
        } catch { return 0; }
    }
    // Example endpoints, adjust as needed
    const [userCount, clubCount, bookCount, feeCount, eventCount] = await Promise.all([
        fetchCount('http://localhost:5000/api/users'),
        fetchCount('http://localhost:5000/api/clubs'),
        fetchCount('http://localhost:5000/api/library'),
        fetchCount('http://localhost:5000/api/fees'),
        fetchCount('http://localhost:5000/api/events'),
    ]);

    // Users Chart
    new Chart(ctxUsers, {
        type: 'doughnut',
        data: {
            labels: ['Users'],
            datasets: [{ data: [userCount], backgroundColor: ['#4F46E5'] }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
    // Clubs Chart
    new Chart(ctxClubs, {
        type: 'doughnut',
        data: {
            labels: ['Clubs'],
            datasets: [{ data: [clubCount], backgroundColor: ['#059669'] }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
    // Books Chart
    new Chart(ctxBooks, {
        type: 'doughnut',
        data: {
            labels: ['Books'],
            datasets: [{ data: [bookCount], backgroundColor: ['#F59E42'] }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
    // Fees Chart
    new Chart(ctxFees, {
        type: 'doughnut',
        data: {
            labels: ['Fees'],
            datasets: [{ data: [feeCount], backgroundColor: ['#EF4444'] }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
    // Events Chart
    new Chart(ctxEvents, {
        type: 'doughnut',
        data: {
            labels: ['Events'],
            datasets: [{ data: [eventCount], backgroundColor: ['#6366F1'] }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
});
