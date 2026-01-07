const newsContainer = document.querySelector('#updated-news .news-container');
const newsList = document.getElementById('news-list');

const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
const today = new Date();
today.setHours(0,0,0,0);

/* Prepare announcements */
const newsItems = Array.from(newsList.querySelectorAll('li')).map(item => {
  const dateStr = item.getAttribute('data-date');
  const timeStr = item.getAttribute('data-time') || '00:00';

  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);

  const date = new Date(y, m - 1, d, hh, mm);
  return { element: item, date };
});

/* Sort latest first */
newsItems.sort((a, b) => b.date - a.date);
newsList.innerHTML = '';

/* Render announcements */
newsItems.forEach(({ element, date }) => {
  const isRecent = (today - date) <= TEN_DAYS && today >= date;

  const formattedDate =
    `${String(date.getDate()).padStart(2,'0')}-` +
    `${String(date.getMonth()+1).padStart(2,'0')}-` +
    `${date.getFullYear()}`;

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2,'0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  const text = element.textContent;
  const newBadge = isRecent ? '<span class="new-badge">New</span>' : '';

  element.className = 'news-item';

  element.innerHTML = `
    <div class="news-header">
      <span class="news-date">${formattedDate}</span>
      <span class="news-time">${formattedTime}</span>
    </div>
    <div class="news-text">${text} ${newBadge}</div>
  `;

  newsList.appendChild(element);
});
