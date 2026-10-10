const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');
    const paginationEl = document.getElementById('trains-pagination');
    const previousButton = document.getElementById('trains-prev');
    const nextButton = document.getElementById('trains-next');
    const pageInfoEl = document.getElementById('trains-page-info');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    const limit = 10;
    let totalPages = 1;

    const loadTrains = async (page) => {
        if (loadingEl) loadingEl.hidden = false;
        if (errorEl) errorEl.hidden = true;

        try {
            const response = await fetch(`/api/trains?page=${page}&limit=${limit}`);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            
            // Fixes payload property overlapping mixing
            const trains = payload.data || [];
            const pagination = payload.pagination || { page: 1, totalPages: 1 };

            currentPage = pagination.page;
            totalPages = pagination.totalPages;

            const fragment = document.createDocumentFragment();

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);
                const imageEl = card.querySelector('[data-field="image"]');

                if (imageEl) {
                    imageEl.src = train.imageUrl;
                    imageEl.alt = train.imageAlt || `${train.name} train`;
                }

                card.querySelector('[data-field="name"]').textContent = train.name;
                card.querySelector('[data-field="operator"]').textContent = train.operator;
                card.querySelector('[data-field="type"]').textContent = train.type;
                card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
                card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
                card.querySelector('[data-field="power"]').textContent = train.powerSource;
                card.querySelector('[data-field="description"]').textContent = train.description;
                card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);

            if (loadingEl) loadingEl.hidden = true;
            if (paginationEl) paginationEl.hidden = false;
            if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
            if (previousButton) previousButton.disabled = currentPage <= 1;
            if (nextButton) nextButton.disabled = currentPage >= totalPages;

        } catch (error) {
            console.error('Error loading trains:', error);
            if (loadingEl) loadingEl.hidden = true;
            if (paginationEl) paginationEl.hidden = true;
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
            }
        }
    };

    previousButton?.addEventListener('click', () => {
        if (currentPage > 1) loadTrains(currentPage - 1);
    });

    nextButton?.addEventListener('click', () => {
        if (currentPage < totalPages) loadTrains(currentPage + 1);
    });

    await loadTrains(currentPage);
};
const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-card-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');
    
    const previousButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');
    const pageInfoEl = document.getElementById('page-indicator');
    
    const filterClass = document.getElementById('filter-class');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    const limit = 10;
    let totalPages = 1;

    const loadBookings = async (page) => {
        if (loadingEl) loadingEl.hidden = false;
        if (errorEl) errorEl.hidden = true;
        if (emptyEl) emptyEl.hidden = true;

        try {
            let url = `/api/bookings?page=${page}&limit=${limit}`;
            if (filterClass && filterClass.value) url += `&ticketClass=${encodeURIComponent(filterClass.value)}`;
            if (filterStartDate && filterStartDate.value) url += `&startDate=${filterStartDate.value}`;
            if (filterEndDate && filterEndDate.value) url += `&endDate=${filterEndDate.value}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load bookings (${response.status})`);
            }

            const payload = await response.json();
            
            const bookings = payload.bookings || [];
            const pagination = payload.pagination || { currentPage: 1, totalPages: 1 };

            currentPage = pagination.currentPage;
            totalPages = pagination.totalPages;

            if (loadingEl) loadingEl.hidden = true;

            if (bookings.length === 0) {
                listEl.innerHTML = '';
                if (emptyEl) emptyEl.hidden = false;
                if (pageInfoEl) pageInfoEl.textContent = 'Page 1 of 1';
                if (previousButton) previousButton.disabled = true;
                if (nextButton) nextButton.disabled = true;
                return;
            }

            const fragment = document.createDocumentFragment();

            bookings.forEach((booking) => {
                const card = templateEl.content.cloneNode(true);

                card.querySelector('[data-field="id"]').textContent = booking.id || booking._id;
                card.querySelector('[data-field="ticketClass"]').textContent = booking.ticketClass || 'N/A';
                card.querySelector('[data-field="scheduleId"]').textContent = booking.scheduleId || 'N/A';
                card.querySelector('[data-field="tripId"]').textContent = booking.tripId || 'N/A';
                card.querySelector('[data-field="selectedDay"]').textContent = booking.selectedDay || 'N/A';
                
                const dateValue = booking.bookingDate || booking.createdAt;
                card.querySelector('[data-field="createdAt"]').textContent = dateValue
                    ? new Date(dateValue).toLocaleDateString()
                    : 'N/A';

                const passengerList = card.querySelector('[data-field="passengers"]');
                if (passengerList && booking.passengers) {
                    passengerList.innerHTML = '';
                    booking.passengers.forEach((passenger) => {
                        const listItem = document.createElement('li');
                        if (typeof passenger === 'string') {
                            listItem.textContent = passenger;
                        } else {
                            listItem.textContent = `${passenger.firstName || ''} ${passenger.lastName || ''} — ` +
                                `${passenger.email || ''} — ${passenger.phone || ''}`;
                        }
                        passengerList.appendChild(listItem);
                    });
                }

                const editForm = card.querySelector('[data-field="edit-form"]');
                const editButton = card.querySelector('[data-action="edit"]');
                const cancelButton = card.querySelector('[data-action="cancel-edit"]');
                const deleteButton = card.querySelector('[data-action="delete"]');

                const scheduleInput = card.querySelector('[data-field="edit-scheduleId"]');
                const tripInput = card.querySelector('[data-field="edit-tripId"]');
                const ticketClassInput = card.querySelector('[data-field="edit-ticketClass"]');
                const selectedDayInput = card.querySelector('[data-field="edit-selectedDay"]');

                if (editButton && editForm) {
                    editButton.addEventListener('click', () => {
                        if (scheduleInput) scheduleInput.value = booking.scheduleId || '';
                        if (tripInput) tripInput.value = booking.tripId || '';
                        if (ticketClassInput) ticketClassInput.value = booking.ticketClass || '';
                        if (selectedDayInput) selectedDayInput.value = booking.selectedDay || '';
                        editForm.hidden = false;
                        editButton.hidden = true;
                    });
                }

                if (cancelButton && editForm && editButton) {
                    cancelButton.addEventListener('click', () => {
                        editForm.hidden = true;
                        editButton.hidden = false;
                    });
                }

                if (editForm) {
                    editForm.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const updatedBooking = {
                            scheduleId: Number(scheduleInput.value),
                            tripId: tripInput.value,
                            ticketClass: ticketClassInput.value,
                            selectedDay: selectedDayInput.value,
                            passengers: booking.passengers
                        };
                        try {
                            const response = await fetch(`/api/bookings/${booking.id || booking._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedBooking)
                            });
                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to update booking.');
                            }
                            await loadBookings(currentPage);
                        } catch (error) {
                            console.error('Error updating booking:', error);
                            alert(error.message);
                        }
                    });
                }

                if (deleteButton) {
                    deleteButton.addEventListener('click', async () => {
                        const confirmed = window.confirm(`Are you sure you want to delete booking ${booking.id || booking._id}?`);
                        if (!confirmed) return;
                        try {
                            const response = await fetch(`/api/bookings/${booking.id || booking._id}`, {
                                method: 'DELETE'
                            });
                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to delete booking.');
                            }
                            await loadBookings(currentPage);
                        } catch (error) {
                            console.error('Error deleting booking:', error);
                            alert(error.message);
                        }
                    });
                }

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            
            if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
            if (previousButton) previousButton.disabled = currentPage <= 1;
            if (nextButton) nextButton.disabled = currentPage >= totalPages;

        } catch (error) {
            console.error('Error loading bookings:', error);
            if (loadingEl) loadingEl.hidden = true;
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load bookings right now. Please try again in a moment.';
            }
        }
    };

    const handleFilterChange = () => {
        currentPage = 1;
        loadBookings(currentPage);
    };

    if (filterClass) filterClass.addEventListener('change', handleFilterChange);
    if (filterStartDate) filterStartDate.addEventListener('change', handleFilterChange);
    if (filterEndDate) filterEndDate.addEventListener('change', handleFilterChange);

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (filterClass) filterClass.value = '';
            if (filterStartDate) filterStartDate.value = '';
            if (filterEndDate) filterEndDate.value = '';
            handleFilterChange();
        });
    }

    previousButton?.addEventListener('click', () => {
        if (currentPage > 1) loadBookings(currentPage - 1);
    });

    nextButton?.addEventListener('click', () => {
        if (currentPage < totalPages) loadBookings(currentPage + 1);
    });

const hookTripSchedules = () => {
    const pageEl = document.querySelector('.route-detail[data-trip-id]');
    const listEl = document.getElementById('schedules-list');
    const templateEl = document.getElementById('schedule-card-template');
    const loadingEl = document.getElementById('schedules-loading');
    const errorEl = document.getElementById('schedules-error');
    const emptyEl = document.getElementById('schedules-empty');
    const monthFilter = document.getElementById('month-filter');

    if (!pageEl || !listEl || !templateEl) {
        return;
    }

    const tripId = pageEl.dataset.tripId;

    const setState = ({ loading = false, error = '', empty = false }) => {
        if (loadingEl) loadingEl.hidden = !loading;
        if (errorEl) {
            errorEl.hidden = !error;
            errorEl.textContent = error;
        }
        if (emptyEl) emptyEl.hidden = !empty;
    };

    const renderSchedules = (schedules) => {
        const fragment = document.createDocumentFragment();

        schedules.forEach((schedule) => {
            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="departureTime"]').textContent = schedule.departureTime;
            card.querySelector('[data-field="arrivalTime"]').textContent = schedule.arrivalTime;

            const daysEl = card.querySelector('[data-field="daysOfWeek"]');
            if (daysEl) {
                (schedule.daysOfWeek || []).forEach((day) => {
                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = day.substring(0, 3);
                    daysEl.appendChild(badge);
                });
            }

            const bookLink = card.querySelector('[data-field="bookUrl"]');
            if (bookLink) bookLink.href = `/trips/booking/${schedule.id}`;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
    };

    const fetchSchedules = async (month) => {
        const url = new URL(`/api/trips/${tripId}/schedules`, window.location.origin);
        if (month && month !== 'all') {
            url.searchParams.set('month', month);
        }

        setState({ loading: true });
        listEl.replaceChildren();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load schedules (${response.status})`);
            }

            const schedules = await response.json();
            renderSchedules(schedules);
            setState({ empty: schedules.length === 0 });
        } catch (error) {
            console.error('Error loading schedules:', error);
            setState({
                error: 'Unable to load schedules right now. Please try again in a moment.'
            });
        }
    };

    if (monthFilter) {
        monthFilter.addEventListener('click', (event) => {
            const button = event.target.closest('[data-month]');
            if (!button || !monthFilter.contains(button)) return;

            monthFilter.querySelectorAll('[data-month]').forEach((badge) => {
                badge.classList.toggle('is-selected', badge === button);
            });

            fetchSchedules(button.dataset.month);
        });
    }

    fetchSchedules('all');
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookBookingsCatalog();
    hookTripSchedules();
});

