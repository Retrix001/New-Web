(function () {
    const hasGsap = typeof window.gsap !== 'undefined';
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

    if (hasGsap && hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initHeader();
        initHeroSlider();
        initHeroScroll();
        initCategoryScroll();
        initZoomScroll();
        initProductGallery();
        initLookSwitcher();
        initActivityAnimation();
        initProductFilters();
        initQuantityControls();
        initNewsletter();
    });

    function initHeader() {
        const header = document.getElementById('header');
        const nav = document.querySelector('.nav-menu');
        const toggle = document.getElementById('mobile-menu-toggle');

        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }, { passive: true });
        }

        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                const open = nav.classList.toggle('open');
                toggle.setAttribute('aria-expanded', String(open));
            });

            nav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    function initHeroSlider() {
        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        const dots = Array.from(document.querySelectorAll('.dot'));
        const nextBtn = document.getElementById('hero-next');
        const prevBtn = document.getElementById('hero-prev');
        if (!slides.length) return;

        let currentSlide = 0;

        const showSlide = index => {
            currentSlide = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
        };

        nextBtn?.addEventListener('click', () => showSlide(currentSlide + 1));
        prevBtn?.addEventListener('click', () => showSlide(currentSlide - 1));
        dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));

        window.setInterval(() => showSlide(currentSlide + 1), 6500);
    }

    function initHeroScroll() {
        if (!hasGsap || !hasScrollTrigger) {
            const text = document.getElementById('hero-text');
            if (text) text.style.opacity = 1;
            return;
        }

        const container = document.getElementById('hero-scroll-container');
        const wrapper = document.getElementById('hero-video-wrapper');
        const text = document.getElementById('hero-text');
        const overlay = document.querySelector('.hero-overlay');
        if (!container || !wrapper || !text || !overlay) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || window.innerWidth < 768) {
            gsap.set(text, { opacity: 1, y: 0 });
            gsap.set(overlay, { opacity: 0.45 });
            return;
        }

        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: 'top top',
                end: '+=900',
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        heroTl.to(wrapper, {
            scale: 0.92,
            borderRadius: '38px',
            ease: 'none'
        }, 0);

        heroTl.to(overlay, {
            opacity: 0.68,
            ease: 'none'
        }, 0);

        heroTl.to(text, {
            opacity: 1,
            y: -18,
            ease: 'power2.out'
        }, 0.18);
    }

    function initCategoryScroll() {
        const section = document.getElementById('shop-category-section');
        const pinned = document.getElementById('shop-category-pinned');
        const wrapper = document.getElementById('category-cards-wrapper');
        const cards = Array.from(document.querySelectorAll('.cat-card'));
        if (!section || !pinned || !wrapper || !cards.length) return;

        if (!hasGsap || !hasScrollTrigger || window.innerWidth < 981) {
            wrapper.style.transform = 'none';
            return;
        }

        const getDistance = () => Math.max(0, wrapper.scrollWidth - window.innerWidth + 160);

        gsap.set(cards, { transformOrigin: 'center center' });

        const catTl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${getDistance() + window.innerHeight * 0.7}`,
                scrub: 1,
                pin: pinned,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        catTl.to(wrapper, {
            x: () => -getDistance(),
            ease: 'none'
        });

        cards.forEach(card => {
            gsap.fromTo(card,
                { y: 26, scale: 0.96 },
                {
                    y: 0,
                    scale: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: catTl,
                        start: 'left 85%',
                        end: 'left 40%',
                        scrub: true
                    }
                }
            );
        });
    }

    function initZoomScroll() {
        if (!hasGsap || !hasScrollTrigger || window.innerWidth < 768) {
            const image = document.getElementById('zoom-center-image');
            const text = document.getElementById('zoom-text-overlay');
            if (image) {
                image.style.width = 'min(92vw, 900px)';
                image.style.height = '70vh';
                image.style.opacity = 1;
            }
            if (text) text.style.opacity = 1;
            return;
        }

        const zoomContainer = document.getElementById('zoom-scroll-container');
        const image = document.getElementById('zoom-center-image');
        const text = document.getElementById('zoom-text-overlay');
        if (!zoomContainer || !image || !text) return;

        const zoomTl = gsap.timeline({
            scrollTrigger: {
                trigger: zoomContainer,
                start: 'top top',
                end: '+=1300',
                scrub: 1,
                pin: true,
                anticipatePin: 1
            }
        });

        zoomTl.to(image, {
            width: '100vw',
            height: '100vh',
            opacity: 1,
            borderRadius: 0,
            ease: 'none'
        }, 0);

        zoomTl.to(text, {
            opacity: 1,
            ease: 'power2.out'
        }, 0.45);
    }

    function initProductGallery() {
        const thumbs = Array.from(document.querySelectorAll('.product-thumbnails .thumb-item'));
        const mainImg = document.getElementById('main-product-img');
        if (!thumbs.length || !mainImg) return;

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const newSrc = thumb.getAttribute('data-img');
                if (!newSrc) return;
                thumbs.forEach(item => item.classList.remove('active'));
                thumb.classList.add('active');
                mainImg.style.opacity = 0.35;
                mainImg.src = newSrc;
                window.setTimeout(() => {
                    mainImg.style.opacity = 1;
                }, 120);
            });
        });
    }

    function initLookSwitcher() {
        const lookThumbs = Array.from(document.querySelectorAll('.thumb-circle'));
        const lookMainImg = document.querySelector('.shop-the-look-section .large-card img');
        if (!lookThumbs.length || !lookMainImg) return;

        lookThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                lookThumbs.forEach(item => {
                    item.classList.remove('active');
                    const image = item.querySelector('img');
                    if (image) image.style.opacity = '0.6';
                });
                thumb.classList.add('active');
                const image = thumb.querySelector('img');
                if (image) {
                    image.style.opacity = '1';
                    lookMainImg.src = image.src;
                }
            });
        });
    }

    function initActivityAnimation() {
        const cards = Array.from(document.querySelectorAll('.activity-card-v2'));
        if (!cards.length || !hasGsap || !hasScrollTrigger || window.innerWidth < 768) return;

        gsap.from(cards, {
            x: 120,
            opacity: 0,
            stagger: 0.08,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.activity-card-container',
                start: 'top 82%'
            }
        });
    }

    function initProductFilters() {
        const filterButtons = Array.from(document.querySelectorAll('.product-filters .filter-btn'));
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        if (!filterButtons.length || !productCards.length) return;

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(item => {
                    item.classList.remove('active');
                    item.style.background = '#f7f7f7';
                    item.style.color = '#121212';
                });
                button.classList.add('active');
                button.style.background = '#4A3A3D';
                button.style.color = '#fff';

                productCards.forEach((card, index) => {
                    card.style.display = index < 4 ? '' : '';
                    card.animate?.([
                        { opacity: 0.65, transform: 'translateY(8px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], { duration: 260, easing: 'ease-out' });
                });
            });
        });
    }

    function initQuantityControls() {
        document.querySelectorAll('.product-sidebar-compact span').forEach(span => {
            if (span.textContent.trim() !== '+' && span.textContent.trim() !== '-') return;
            span.addEventListener('click', () => {
                const row = span.closest('div');
                const valueNode = row?.querySelector('span:nth-child(2)');
                if (!valueNode) return;
                const current = Number(valueNode.textContent) || 1;
                const delta = span.textContent.trim() === '+' ? 1 : -1;
                valueNode.textContent = String(Math.max(1, current + delta));
            });
        });
    }

    function initNewsletter() {
        const form = document.querySelector('.email-signup');
        const input = form?.querySelector('input');
        const button = form?.querySelector('button');
        if (!form || !input || !button) return;

        button.addEventListener('click', event => {
            event.preventDefault();
            input.value = '';
            button.textContent = 'Subscribed';
            window.setTimeout(() => {
                button.textContent = 'Subscribe ->';
            }, 1600);
        });
    }
})();
