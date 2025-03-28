document.addEventListener('DOMContentLoaded', function() {
    const dropdownButton = document.querySelector('.button-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Ocultar el menú inicialmente
    dropdownMenu.style.display = 'none';
    
    dropdownButton.addEventListener('click', function(e) {
        e.preventDefault();
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
});