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

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

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
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
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