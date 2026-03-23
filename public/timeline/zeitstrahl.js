document.addEventListener('DOMContentLoaded', () => {
    const entries = document.querySelectorAll('.timeline-entry');
    const backToTopButton = document.getElementById('backToTop');

    if (!window.IntersectionObserver) {
        entries.forEach((entry) => entry.classList.add('visible'));
    } else {
        const observer = new IntersectionObserver((items) => {
            items.forEach((item) => {
                if (item.isIntersecting) {
                    item.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.16,
            rootMargin: '0px 0px -40px 0px'
        });

        entries.forEach((entry) => observer.observe(entry));
    }

    if (!backToTopButton) return;

    const toggleBackToTop = () => {
        if (window.scrollY > 420) {
            backToTopButton.classList.add('is-visible');
        } else {
            backToTopButton.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
