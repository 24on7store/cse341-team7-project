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

    const searchInput = document.getElementById('trains-search');
    const searchButton = document.getElementById('trains-search-button');
    const sortSelect = document.getElementById('trains-sort');
    const orderSelect = document.getElementById('trains-order');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    const limit = 10;
    let totalPages = 1;

    const loadTrains = async (page = 1) => {
        if (loadingEl) {
            loadingEl.hidden = false;
        }

        if (errorEl) {
            errorEl.hidden = true;
        }

        try {
            const url = new URL('/api/trains', window.location.origin);

            url.searchParams.set('page', page);
            url.searchParams.set('limit', limit);

            const search = searchInput?.value.trim() || '';
            const sort = sortSelect?.value || '';
            const order = orderSelect?.value || 'asc';

            if (search) {
                url.searchParams.set('q', search);
            }

            if (sort) {
                url.searchParams.set('sort', sort);
                url.searchParams.set('order', order);
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.data || [];
            const pagination = payload.pagination;

            currentPage = pagination.page;
            totalPages = pagination.totalPages;

            const fragment = document.createDocumentFragment();

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);
                const imageEl = card.querySelector('[data-field="image"]');

                imageEl.src = train.imageUrl;
                imageEl.alt = train.imageAlt || `${train.name} train`;

                card.querySelector('[data-field="name"]').textContent =
                    train.name;
                card.querySelector('[data-field="operator"]').textContent =
                    train.operator;
                card.querySelector('[data-field="type"]').textContent =
                    train.type;
                card.querySelector('[data-field="speed"]').textContent =
                    `${train.maxSpeedKmh} km/h`;
                card.querySelector('[data-field="seats"]').textContent =
                    `${train.capacity} seats`;
                card.querySelector('[data-field="power"]').textContent =
                    train.powerSource;
                card.querySelector('[data-field="description"]').textContent =
                    train.description;
                card.querySelector('[data-field="best-for"]').textContent =
                    train.bestFor;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);

            if (loadingEl) {
                loadingEl.hidden = true;
            }

            if (paginationEl) {
                paginationEl.hidden = false;
            }

            if (pageInfoEl) {
                pageInfoEl.textContent =
                    `Page ${currentPage} of ${totalPages}`;
            }

            if (previousButton) {
                previousButton.disabled = currentPage <= 1;
            }

            if (nextButton) {
                nextButton.disabled = currentPage >= totalPages;
            }
        } catch (error) {
            console.error('Error loading trains:', error);

            if (loadingEl) {
                loadingEl.hidden = true;
            }

            if (paginationEl) {
                paginationEl.hidden = true;
            }

            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent =
                    'Unable to load trains right now. Please try again in a moment.';
            }
        }
    };

    searchButton?.addEventListener('click', () => {
        currentPage = 1;
        loadTrains(1);
    });

    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            currentPage = 1;
            loadTrains(1);
        }
    });

    sortSelect?.addEventListener('change', () => {
        currentPage = 1;
        loadTrains(1);
    });

    orderSelect?.addEventListener('change', () => {
        if (sortSelect?.value) {
            currentPage = 1;
            loadTrains(1);
        }
    });

    previousButton?.addEventListener('click', () => {
        if (currentPage > 1) {
            loadTrains(currentPage - 1);
        }
    });

    nextButton?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadTrains(currentPage + 1);
        }
    });

    await loadTrains(currentPage);
};

const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-card-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/bookings');

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const bookings = await response.json();
        const fragment = document.createDocumentFragment();

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (bookings.length === 0) {
            if (emptyEl) {
                emptyEl.hidden = false;
            }
            return;
        }

        bookings.forEach((booking) => {

            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="id"]').textContent = booking.id;
            card.querySelector('[data-field="ticketClass"]').textContent =
                booking.ticketClass;
            card.querySelector('[data-field="scheduleId"]').textContent =
                booking.scheduleId;
            card.querySelector('[data-field="tripId"]').textContent =
                booking.tripId;
            card.querySelector('[data-field="selectedDay"]').textContent =
                booking.selectedDay;
            card.querySelector('[data-field="createdAt"]').textContent =
                booking.createdAt
                    ? new Date(booking.createdAt).toLocaleString()
                    : 'N/A';

            const passengerList = card.querySelector(
                '[data-field="passengers"]'
            );

            booking.passengers.forEach((passenger) => {
                const listItem = document.createElement('li');

                listItem.textContent =
                    `${passenger.firstName} ${passenger.lastName} — ` +
                    `${passenger.email} — ${passenger.phone}`;

                passengerList.appendChild(listItem);
            });

            const editForm = card.querySelector('[data-field="edit-form"]');
            const editButton = card.querySelector('[data-action="edit"]');
            const cancelButton = card.querySelector(
                '[data-action="cancel-edit"]'
            );
            const deleteButton = card.querySelector('[data-action="delete"]');

            const scheduleInput = card.querySelector(
                '[data-field="edit-scheduleId"]'
            );
            const tripInput = card.querySelector(
                '[data-field="edit-tripId"]'
            );
            const ticketClassInput = card.querySelector(
                '[data-field="edit-ticketClass"]'
            );
            const selectedDayInput = card.querySelector(
                '[data-field="edit-selectedDay"]'
            );

            editButton.addEventListener('click', () => {
                scheduleInput.value = booking.scheduleId;
                tripInput.value = booking.tripId;
                ticketClassInput.value = booking.ticketClass;
                selectedDayInput.value = booking.selectedDay;

                editForm.hidden = false;
                editButton.hidden = true;
            });

            cancelButton.addEventListener('click', () => {
                editForm.hidden = true;
                editButton.hidden = false;
            });

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
                    const response = await fetch(
                        `/api/bookings/${booking.id}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updatedBooking)
                        }
                    );

                    if (!response.ok) {
                        const error = await response.json();

                        throw new Error(
                            error.error || 'Failed to update booking.'
                        );
                    }

                    await hookBookingsCatalog();
                } catch (error) {
                    console.error('Error updating booking:', error);
                    alert(error.message);
                }
            });

            deleteButton.addEventListener('click', async () => {
                const confirmed = window.confirm(
                    `Are you sure you want to delete booking ${booking.id}?`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/bookings/${booking.id}`,
                        {
                            method: 'DELETE'
                        }
                    );

                    if (!response.ok) {
                        const error = await response.json();

                        throw new Error(
                            error.error || 'Failed to delete booking.'
                        );
                    }

                    await hookBookingsCatalog();
                } catch (error) {
                    console.error('Error deleting booking:', error);
                    alert(error.message);
                }
            });

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
                'Unable to load bookings right now. Please try again in a moment.';
        }

        console.error('Error loading bookings:', error);
    }
};

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
        if (loadingEl) {
            loadingEl.hidden = !loading;
        }

        if (errorEl) {
            errorEl.hidden = !error;
            errorEl.textContent = error;
        }

        if (emptyEl) {
            emptyEl.hidden = !empty;
        }
    };

    const renderSchedules = (schedules) => {
        const fragment = document.createDocumentFragment();

        schedules.forEach((schedule) => {
            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="departureTime"]').textContent =
                schedule.departureTime;
            card.querySelector('[data-field="arrivalTime"]').textContent =
                schedule.arrivalTime;

            const daysEl = card.querySelector('[data-field="daysOfWeek"]');
            (schedule.daysOfWeek || []).forEach((day) => {
                const badge = document.createElement('span');
                badge.className = 'day-badge';
                badge.textContent = day.substring(0, 3);
                daysEl.appendChild(badge);
            });

            const bookLink = card.querySelector('[data-field="bookUrl"]');
            bookLink.href = `/trips/booking/${schedule.id}`;

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

            if (!button || !monthFilter.contains(button)) {
                return;
            }

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