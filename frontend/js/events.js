(function() {
// Events Management Logic
const eventForm = document.getElementById('event-form');
const eventList = document.getElementById('event-list');
const eventSearch = document.getElementById('event-search');

// --- Universal Modal Logic (Events) ---
const universalEditModal = document.getElementById('universal-edit-modal');
const closeUniversalEditModal = document.getElementById('close-universal-edit-modal');
const universalEditForm = document.getElementById('universal-edit-form');
const universalEditMsg = document.getElementById('universal-edit-msg');

const universalConfirmModal = document.getElementById('universal-confirm-modal');
const closeUniversalConfirmModal = document.getElementById('close-universal-confirm-modal');
const universalConfirmTitle = document.getElementById('universal-confirm-title');
const universalConfirmMessage = document.getElementById('universal-confirm-message');
const universalConfirmYes = document.getElementById('universal-confirm-yes');
const universalConfirmNo = document.getElementById('universal-confirm-no');

function openUniversalModal(modal) { modal.style.display = 'block'; }
function closeUniversalModal(modal) { modal.style.display = 'none'; }

if (closeUniversalEditModal) closeUniversalEditModal.onclick = () => closeUniversalModal(universalEditModal);
if (closeUniversalConfirmModal) closeUniversalConfirmModal.onclick = () => closeUniversalModal(universalConfirmModal);
window.onclick = function(event) {
  if (event.target === universalEditModal) closeUniversalModal(universalEditModal);
  if (event.target === universalConfirmModal) closeUniversalModal(universalConfirmModal);
};

// --- Bulk Actions Logic for Events ---
const eventsBulkToolbar = document.getElementById('events-bulk-toolbar');
const eventsBulkDelete = document.getElementById('events-bulk-delete');
const eventsBulkExport = document.getElementById('events-bulk-export');
const selectAllEvents = document.getElementById('select-all-events');
const eventsTableBody = document.getElementById('events-table-body');

let selectedEventIds = new Set();

function renderEventRow(event) {
    return `<tr>
        <td><input type="checkbox" class="event-select-checkbox" data-id="${event._id}"></td>
        <td>${event.title}</td>
        <td>${event.date ? new Date(event.date).toLocaleDateString() : ''}</td>
        <td>${event.description || ''}</td>
        <td>
            <button class="edit-event-btn" data-id="${event._id}">Edit</button>
            <button class="delete-event-btn" data-id="${event._id}">Delete</button>
        </td>
    </tr>`;
}

function updateEventsBulkToolbarState() {
    const hasSelection = selectedEventIds.size > 0;
    eventsBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    eventsBulkDelete.disabled = !hasSelection;
    eventsBulkExport.disabled = !hasSelection;
}

function clearEventSelections() {
    selectedEventIds.clear();
    document.querySelectorAll('.event-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllEvents) selectAllEvents.checked = false;
    updateEventsBulkToolbarState();
}

// --- Advanced Filters for Events ---
const eventsSearch = document.getElementById('events-search');
const eventsTypeFilter = document.getElementById('events-type-filter');
const eventsDateFilter = document.getElementById('events-date-filter');

function getEventsFilters() {
    return {
        search: eventsSearch.value.trim(),
        type: eventsTypeFilter.value,
        date: eventsDateFilter.value
    };
}

function buildEventsQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.type) params.push(`type=${encodeURIComponent(filters.type)}`);
    if (filters.date) params.push(`date=${encodeURIComponent(filters.date)}`);
    return params.length ? '?' + params.join('&') : '';
}

async function loadEventsWithFilters() {
    const token = localStorage.getItem('token');
    const filters = getEventsFilters();
    let url = 'http://localhost:5000/api/events' + buildEventsQueryString(filters);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const events = await res.json();
        eventsTableBody.innerHTML = '';
        if (Array.isArray(events) && events.length > 0) {
            events.forEach(event => {
        }

        const filters = getEventsFilters();
        const queryString = buildEventsQueryString(filters);
        const response = await fetch(`/api/events${queryString}`);
        const events = await response.json();

        eventsTableBody.innerHTML = events.map(event =>
            `<tr>
                <td><input type="checkbox" class="event-select-checkbox" data-id="${event._id}"></td>
                <td>${event.title}</td>
                <td>${event.type}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.description}</td>
                <td>
                    <button class="action-btn edit" onclick="openEditEventModal('${event._id}')">Edit</button>
                    <button class="action-btn delete" onclick="deleteEvent('${event._id}')">Delete</button>
                </td>
            </tr>`
        ).join('');

        // Update bulk selection state if toolbar exists
        if (eventsBulkToolbar) {
            document.querySelectorAll('.event-select-checkbox').forEach(cb => {
                cb.checked = false;
                selectedEventIds.delete(cb.getAttribute('data-id'));
            });
            updateEventsBulkToolbarState();
        }
    } catch (err) {
        console.error('Error loading events:', err);
        if (eventsTableBody) {
            eventsTableBody.innerHTML = '<tr><td colspan="6">Error loading events.</td></tr>';
        }
    }
}

// Attach filter listeners
if (eventsSearch) eventsSearch.addEventListener('input', () => loadEventsWithFilters());
if (eventsTypeFilter) eventsTypeFilter.addEventListener('change', () => loadEventsWithFilters());
if (eventsDateFilter) eventsDateFilter.addEventListener('change', () => loadEventsWithFilters());

async function handleEventFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title, date, description })
        });
        if (res.ok) {
            eventForm.reset();
            loadEventsWithFilters();
        } else {
            alert('Failed to add event');
        }
    } catch (err) {
        alert('Network error');
    }
}

async function handleEventListClick(e) {
    const btn = e.target;
    const eventId = btn.getAttribute('data-id');
    if (!eventId) return;
    const token = localStorage.getItem('token');
    // Edit Event (universal modal)
    if (btn.classList.contains('edit-event-btn')) {
        const li = btn.closest('tr');
        const currentTitle = li.querySelector('td:nth-child(2)').textContent;
        const currentDate = li.querySelectorAll('td')[1].textContent;
        const currentDesc = li.querySelectorAll('td')[2].textContent;
        universalEditForm.innerHTML = `
            <input type="hidden" name="eventId" value="${eventId}" />
            <div class='form-group'><label>Title:</label><input type='text' name='title' value='${currentTitle}' required /></div>
            <div class='form-group'><label>Date:</label><input type='date' name='date' value='${currentDate ? new Date(currentDate).toISOString().split('T')[0] : ''}' required /></div>
            <div class='form-group'><label>Description:</label><input type='text' name='description' value='${currentDesc}' /></div>
            <button type='submit'>Save Changes</button>
        `;
        universalEditMsg.style.display = 'none';
        openUniversalModal(universalEditModal);
        universalEditForm.onsubmit = async (ev) => {
            ev.preventDefault();
            universalEditMsg.style.display = 'none';
            const formData = new FormData(universalEditForm);
            const title = formData.get('title');
            const date = formData.get('date');
            const description = formData.get('description');
            try {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title, date, description })
                });
                if (res.ok) {
                    universalEditMsg.textContent = 'Event updated successfully!';
                    universalEditMsg.style.color = 'green';
                    universalEditMsg.style.display = 'block';
                    setTimeout(() => {
                        closeUniversalModal(universalEditModal);
                        loadEventsWithFilters();
                    }, 1000);
                } else {
                    universalEditMsg.textContent = 'Failed to update event.';
                    universalEditMsg.style.color = 'red';
                    universalEditMsg.style.display = 'block';
                }
            } catch {
                universalEditMsg.textContent = 'Network error.';
                universalEditMsg.style.color = 'red';
                universalEditMsg.style.display = 'block';
            }
        };
    }
    // Delete Event (universal confirm modal)
    else if (btn.classList.contains('delete-event-btn')) {
        universalConfirmTitle.textContent = 'Delete Event';
        universalConfirmMessage.textContent = 'Are you sure you want to delete this event?';
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            try {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    loadEventsWithFilters();
                }
            } catch {}
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    }
}

// Ensure the DOM element exists before adding event listeners
if (eventForm) {
  eventForm.addEventListener('submit', async (e) => {
    await handleEventFormSubmit(e);
  });
}
if (eventList) {
  eventList.addEventListener('click', async (e) => {
    await handleEventListClick(e);
  });
}

// Bulk Delete
if (eventsBulkDelete) {
    eventsBulkDelete.onclick = async function() {
        if (selectedEventIds.size === 0) return;
        universalConfirmTitle.textContent = 'Delete Selected Events';
        universalConfirmMessage.textContent = `Are you sure you want to delete ${selectedEventIds.size} selected event(s)?`;
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            const token = localStorage.getItem('token');
            for (const eventId of selectedEventIds) {
                try {
                    await fetch(`http://localhost:5000/api/events/${eventId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch {}
            }
            clearEventSelections();
            loadEventsWithFilters();
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    };
}

// Bulk Export
if (eventsBulkExport) {
    eventsBulkExport.onclick = async function() {
        if (selectedEventIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/events';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const events = await res.json();
        const selected = events.filter(e => selectedEventIds.has(e._id));
        let csv = 'Title,Date,Description\n';
        selected.forEach(e => {
            csv += `${e.title},${e.date ? new Date(e.date).toLocaleDateString() : ''},${e.description || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_events.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadEventsWithFilters();
});

})();
