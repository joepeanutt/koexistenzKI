document.addEventListener('DOMContentLoaded', () => {
    const entries = document.querySelectorAll('.timeline-entry');

    if (!window.IntersectionObserver) {
        entries.forEach((entry) => entry.classList.add('visible'));
        return;
    }

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
});