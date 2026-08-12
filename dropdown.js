/* ?v=9 is a cache buster — see the note in index.html. Bump the number
   whenever you edit navbar.html or footer.html so browsers and Cloudflare
   are forced to fetch the new version instead of a stale cached one. */
fetch('navbar.html?v=9')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
    setupMobileDropdowns();
  });

fetch('footer.html?v=9')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
  });

// Bound once, right after the navbar is injected. Previously this whole
// setup (including cloning the trigger links to strip old listeners) was
// re-run on every 'resize' event. On mobile Safari, scrolling alone fires
// 'resize' repeatedly (the address bar hides/shows), so a tap on "Courses"
// could get its link element replaced mid-tap, dropping the click before it
// registered or closing the menu again almost immediately. Binding once and
// checking the screen width at click time avoids that race entirely.
function setupMobileDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector(':scope > a');
    if (!link) return;

    link.addEventListener('click', function(e) {
      // Only intercept the click for the mobile tap-to-open behavior.
      // On wider screens, hover handles the dropdown and the link's
      // normal (no-op) click can pass through untouched.
      if (window.innerWidth > 768) return;

      e.preventDefault();
      e.stopPropagation();

      dropdowns.forEach(other => {
        if (other !== dropdown) {
          other.classList.remove('open');
        }
      });

      dropdown.classList.toggle('open');
    });
  });

  document.addEventListener('click', function() {
    dropdowns.forEach(d => d.classList.remove('open'));
  });

  // If the viewport crosses the mobile breakpoint (e.g. orientation
  // change), just make sure no dropdown is left stuck open — no need to
  // rebind any listeners.
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      dropdowns.forEach(d => d.classList.remove('open'));
    }
  });
}
