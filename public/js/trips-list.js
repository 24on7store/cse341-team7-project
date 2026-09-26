// public/js/trips-list.js
// Added on week03 by Mackison

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('trips-loading');
  const errorEl = document.getElementById('trips-error');
  const listContainer = document.getElementById('trips-list');
  const template = document.getElementById('trip-card-template');

  try {
    const response = await fetch('/api/trips');
    if (!response.ok) throw new Error(`Failed to fetch trips. Status: ${response.status}`);

    const trips = await response.json();
    if (loadingEl) loadingEl.hidden = true;

    if (trips.length === 0) {
      if (errorEl) {
        errorEl.textContent = 'No scenic trips found at this moment.';
        errorEl.hidden = false;
      }
      return;
    }

    trips.forEach(trip => {
      const clone = template.content.cloneNode(true);

      // Add the region class to the card container for background colors/styling matching list.ejs
      const cardElement = clone.querySelector('.route-card');
      if (cardElement && trip.region) {
        cardElement.classList.add(trip.region);
      }

      // 1. FIXED TITLE FIELD (Matches data-field="name" in your list.ejs template)
      const name = clone.querySelector('[data-field="name"]');
      if (name) name.textContent = trip.name || trip.title || 'Scenic Route';

      const region = clone.querySelector('[data-field="region"]');
      if (region) region.textContent = trip.region;

      // 2. FIXED STATIONS (Matches start-station and end-station in your list.ejs template)
      const startStation = clone.querySelector('[data-field="start-station"]');
      if (startStation) startStation.textContent = trip.startStation || '';

      const endStation = clone.querySelector('[data-field="end-station"]');
      if (endStation) endStation.textContent = trip.endStation || '';

      const duration = clone.querySelector('[data-field="duration"]');
      if (duration) duration.textContent = trip.duration;

      // 3. FIXED DISTANCE FIELD (Matches data-field="distance" in your list.ejs template)
      const distance = clone.querySelector('[data-field="distance"]');
      if (distance) distance.textContent = trip.distance !== undefined ? trip.distance : '';

      // 4. FIXED SEASON BADGE STATUS
      const badge = clone.querySelector('[data-field="season-badge"]');
      if (badge && trip.bestSeason) {
        badge.className = `season-badge season-${trip.bestSeason}`;
        badge.textContent = `Best in ${trip.bestSeason.charAt(0).toUpperCase() + trip.bestSeason.slice(1)}`;
      }

      const description = clone.querySelector('[data-field="description"]');
      if (description) description.textContent = trip.description || 'No description provided.';

      // 5. DYNAMICALLY APPEND HIGHLIGHT TAGS (Loops over the highlights array from database)
      const highlightsContainer = clone.querySelector('[data-field="highlights-container"]');
      if (highlightsContainer && Array.isArray(trip.highlights)) {
        trip.highlights.forEach(highlight => {
          const span = document.createElement('span');
          span.className = 'highlight-tag';
          span.textContent = highlight;
          highlightsContainer.appendChild(span);
        });
      }

      const link = clone.querySelector('[data-field="link"]');
      if (link) link.href = `/trips/${trip.id}`;

      listContainer.appendChild(clone);
    });

  } catch (error) {
    console.error('Hydration Runtime Error:', error);
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.textContent = 'Unable to load scenic journeys right now. Please try again later.';
      errorEl.hidden = false;
    }
  }
});
