const newsList = document.getElementById('news-list');

const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
// today.setHours(0, 0, 0, 0);

const now = new Date();

// Collect items
const newsItems = Array.from(newsList.querySelectorAll('li')).map(item => {
  const dateStr = item.dataset.date;
  const timeStr = item.dataset.time || '00:00';

  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);

  return {
    element: item,
    date: new Date(y, m - 1, d, hh, mm)
  };
});

// Sort newest first
newsItems.sort((a, b) => b.date - a.date);
newsList.innerHTML = '';

// Render
newsItems.forEach(({ element, date }) => {
  const isRecent = now >= date && (now - date) <= TEN_DAYS;


  const formattedDate =
    `${String(date.getDate()).padStart(2, '0')}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${date.getFullYear()}`;

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const formattedTime = `${hours}:${minutes} ${ampm}`;

  const text = element.textContent.trim();
  const link = element.dataset.link?.trim();

  const hasLink = !!link;

  let newsTextHTML = '';

  if (isRecent) {
    newsTextHTML = `
    <div class="news-text">
    ${text}
    <span class="new-badge ${hasLink ? 'clickable' : ''}">
    ${hasLink
      ? `<a href="${link}" target="_blank" rel="noopener noreferrer">
           <img src="star-new.png" alt="New">
          </a>`
          : `<img src="star-new.png" alt="New">`
      }
    </span>
    </div>
    `;
  } else {
    newsTextHTML = `
      <div class="news-text">
        ${hasLink
          ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a>`
          : text}
      </div>
    `;
  }

  element.className = 'news-item';
  element.innerHTML = `
    <div class="news-header">
      <span class="news-date">${formattedDate}</span>
      <span class="news-time">${formattedTime}</span>
    </div>
    ${newsTextHTML}
  `;

  newsList.appendChild(element);
});
