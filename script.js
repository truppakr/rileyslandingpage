document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            
            const transition = document.createElement('div');
            transition.className = 'page-transition';
            document.body.appendChild(transition);
            
            requestAnimationFrame(() => {
                transition.classList.add('active');
                
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            });
        });
    });
});