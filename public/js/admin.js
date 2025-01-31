document.addEventListener('DOMContentLoaded', function() {
    // Add sidebar toggle button to the DOM
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-toggle d-lg-none';
    sidebarToggle.innerHTML = '<i class="bi bi-list"></i>';
    document.body.appendChild(sidebarToggle);

    // Add backdrop for mobile sidebar
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    // Get sidebar element
    const sidebar = document.querySelector('.sidebar');

    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('show');
        backdrop.classList.toggle('show');
        document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
    }

    // Event listeners
    sidebarToggle.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', toggleSidebar);

    // Close sidebar on window resize if it's open
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992 && sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    });

    // Close sidebar when clicking a link (for better UX)
    const sidebarLinks = sidebar.querySelectorAll('.nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                toggleSidebar();
            }
        });
    });
}); 