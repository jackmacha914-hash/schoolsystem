// Backup Management Logic
const backupBtn = document.getElementById('backup-now-btn');
const backupList = document.getElementById('backup-list');
const restoreBtns = document.getElementsByClassName('restore-backup-btn');
const downloadBtns = document.getElementsByClassName('download-backup-btn');

async function loadBackups() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:5000/api/backups', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const backups = await res.json();
        backupList.innerHTML = '';
        if (Array.isArray(backups) && backups.length > 0) {
            backups.forEach(backup => {
                const li = document.createElement('li');
                li.className = 'backup-item bg-white p-4 rounded shadow flex justify-between items-center';
                li.innerHTML = `
                    <div>
                        <strong>${backup.name}</strong><br>
                        <span>${backup.date ? new Date(backup.date).toLocaleString() : ''}</span>
                    </div>
                    <div>
                        <button class="download-backup-btn" data-id="${backup._id}">Download</button>
                        <button class="restore-backup-btn" data-id="${backup._id}">Restore</button>
                    </div>
                `;
                backupList.appendChild(li);
            });
        } else {
            backupList.innerHTML = '<li>No backups found.</li>';
        }
    } catch (err) {
        backupList.innerHTML = '<li>Error loading backups.</li>';
    }
}

if (backupBtn) {
    backupBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        backupBtn.disabled = true;
        backupBtn.textContent = 'Backing up...';
        try {
            const res = await fetch('http://localhost:5000/api/backups', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadBackups();
                alert('Backup created successfully!');
            } else {
                alert('Failed to create backup');
            }
        } catch {
            alert('Network error');
        }
        backupBtn.disabled = false;
        backupBtn.textContent = 'Backup Now';
    });
}

backupList.addEventListener('click', async (e) => {
    const btn = e.target;
    const backupId = btn.getAttribute('data-id');
    const token = localStorage.getItem('token');
    if (!backupId) return;
    // Download Backup
    if (btn.classList.contains('download-backup-btn')) {
        window.open(`http://localhost:5000/api/backups/${backupId}/download`, '_blank');
    }
    // Restore Backup
    else if (btn.classList.contains('restore-backup-btn')) {
        if (confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
            try {
                const res = await fetch(`http://localhost:5000/api/backups/${backupId}/restore`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    alert('Backup restored successfully!');
                } else {
                    alert('Failed to restore backup');
                }
            } catch {
                alert('Network error');
            }
        }
    }
});

if (backupList) loadBackups();
