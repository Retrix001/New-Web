gsap.registerPlugin(ScrollTrigger);

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
    
    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // 1. Hero Cinematic Animation
    let heroTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#hero-scroll-container",
            start: "top top",
            end: "+=1000",
            scrub: 1,
            pin: true,
        }
    });

    heroTl.to("#hero-video-wrapper", {
        scale: 0.9,
        borderRadius: "40px",
        ease: "none"
    }, 0);

    heroTl.to(".hero-overlay", {
        opacity: 0.75, // Capped at 75% as requested
        ease: "none"
    }, 0);

    heroTl.to("#hero-text", {
        opacity: 1,
        y: -20,
        ease: "power2.out"
    }, 0.2);

    // 1b. Hero Slider Logic
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('hero-next');
    const prevBtn = document.getElementById('hero-prev');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
        prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    }
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => showSlide(i));
    });



    // 2. Shop Category Horizontal 3D Scroll
    // Cards slide in from the right, flattening out as they reach the center.
    let catContainer = document.getElementById("shop-category-section");
    let catWrapper = document.getElementById("category-cards-wrapper");
    let cards = gsap.utils.toArray(".cat-card");

    // Calculate total horizontal scroll width needed - increased for more "movement"
    let totalScrollWidth = catWrapper.scrollWidth - window.innerWidth + 1500;

    let catTl = gsap.timeline({
        scrollTrigger: {
            trigger: catContainer,
            start: "top top",
            end: () => "+=" + totalScrollWidth,
            scrub: 1.5, // Slightly more smoothing for premium feel
            pin: true,
        }
    });

    // Translate the wrapper to the left - ensuring all 8 cards pass through
    catTl.to(catWrapper, {
        x: () => -(catWrapper.scrollWidth - window.innerWidth + 400), 
        ease: "none"
    }, 0);

    // Optional 3D Rotation effect on cards during scroll
    // Changed to a very subtle scale/fade instead of extreme 3D rotation to ensure clear front view
    cards.forEach((card, i) => {
        gsap.fromTo(card, 
            { scale: 0.9, opacity: 1 },
            {
                scale: 1,
                opacity: 1,
                scrollTrigger: {
                    trigger: catContainer,
                    start: "top top",
                    end: () => "+=" + totalScrollWidth,
                    scrub: 1,
                    containerAnimation: catTl // Link to horizontal scroll
                }
            }
        );
    });

    // 5. Zoom Image Animation (Marquee to Fullscreen)
    let zoomContainer = document.getElementById("zoom-scroll-container");
    if (zoomContainer) {
        let zoomTl = gsap.timeline({
            scrollTrigger: {
                trigger: zoomContainer,
                start: "top top",
                end: "+=1500",
                scrub: 1,
                pin: true,
            }
        });

        // The image starts from 0px and invisible, then grows to fill the screen
        zoomTl.to("#zoom-center-image", {
            width: "100vw",
            height: "100vh",
            opacity: 1,
            borderRadius: "0px",
            ease: "none"
        }, 0);

        // Fade in the text overlay
        zoomTl.to("#zoom-text-overlay", {
            opacity: 1,
            y: 0,
            ease: "power2.out"
        }, 0.5);
    }

    // 6. Thumbnail Switcher (Product Page)
    const productThumbs = document.querySelectorAll('.product-thumbnails .thumb-item');
    const productMainImg = document.getElementById('main-product-img');

    if (productThumbs && productMainImg) {
        productThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                productThumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                
                const newSrc = thumb.getAttribute('data-img');
                productMainImg.style.opacity = 0;
                setTimeout(() => {
                    productMainImg.src = "assets/jumpsuit.png"; 
                    productMainImg.style.opacity = 1;
                }, 200);
            });
        });
    }

    // 7. Activity Cards Scroll Animation
    const activityCards = document.querySelectorAll('.activity-card-v2');
    if (activityCards.length > 0) {
        gsap.from(activityCards, {
            x: 200,
            opacity: 0,
            stagger: 0.1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".activity-card-container",
                start: "top 80%",
            }
        });
    }

    // 3. Hotspots Pulse and Hover
    // We can add simple JS for hotspots if needed, but CSS animation handles pulse.
    
    // 4. Shop the Look Thumbnail Switch (Interactive)
    const lookThumbs = document.querySelectorAll('.thumb-circle');
    const lookMainImg = document.querySelector('.shop-the-look-section .large-card img');
    
    if (lookThumbs && lookMainImg) {
        lookThumbs.forEach(thumb => {
            thumb.addEventListener('click', function() {
                lookThumbs.forEach(t => {
                    t.classList.remove('active');
                    t.style.border = 'none';
                    t.style.padding = '0';
                    t.querySelector('img').style.opacity = '0.6';
                });
                this.classList.add('active');
                this.style.border = '2px solid var(--color-primary)';
                this.style.padding = '2px';
                this.querySelector('img').style.opacity = '1';
            });
        });
    }

});
