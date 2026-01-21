fetch('navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
    setupMobileDropdowns();
  });

fetch('footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
  });

function setupMobileDropdowns() {

  if (window.innerWidth <= 768) {

    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
      const link = dropdown.querySelector('a');
      link.replaceWith(link.cloneNode(true));
    });

    const newDropdowns = document.querySelectorAll('.dropdown');

    newDropdowns.forEach(dropdown => {
      const link = dropdown.querySelector('a');

      link.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        newDropdowns.forEach(other => {
          if (other !== dropdown) {
            other.classList.remove('open');
          }
        });

        dropdown.classList.toggle('open');
      });
    });

    document.addEventListener('click', function() {
      newDropdowns.forEach(d => d.classList.remove('open'));
    });

  }
}

window.addEventListener('resize', setupMobileDropdowns);
