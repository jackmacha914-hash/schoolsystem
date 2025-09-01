document.addEventListener("DOMContentLoaded", function () {
    // Mobile Menu Toggle
    const menuToggle = document.createElement("button");
    menuToggle.innerHTML = "&#9776;"; // Hamburger icon
    menuToggle.classList.add("menu-toggle");
    document.querySelector("header").prepend(menuToggle);
    
    const navMenu = document.querySelector("nav ul");
    menuToggle.addEventListener("click", function () {
        navMenu.classList.toggle("active");
        menuToggle.classList.toggle("open");
    });

    // FAQ Toggle Functionality
    document.querySelectorAll(".faq-question").forEach(question => {
        question.addEventListener("click", function () {
            const parent = this.closest(".faq-item");
            parent.classList.toggle("active");
        });
    });

    // Slider Functionality with Smooth Transitions
    let slideIndex = 0;
    const slides = document.querySelectorAll(".slide");

    function showSlides() {
        slides.forEach(slide => {
            slide.style.opacity = "0";
            slide.style.transform = "scale(0.95)";
        });

        slides[slideIndex].style.opacity = "1";
        slides[slideIndex].style.transform = "scale(1)";

        slideIndex = (slideIndex + 1) % slides.length;
        setTimeout(showSlides, 3000);
    }

    if (slides.length) {
        showSlides();
    }

    // Smooth Scrolling for Navigation (only for in-page anchors)
    document.querySelectorAll("nav ul li a").forEach(anchor => {
        anchor.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (href && href.startsWith("#")) {
                event.preventDefault();
                const section = document.querySelector(href);
                if (section) {
                    window.scrollTo({
                        top: section.offsetTop - 50,
                        behavior: "smooth"
                    });
                }
            }
            // For links to other pages, let the browser navigate normally
        });
    });

    // Back to Top Button
    const backToTop = document.createElement("button");
    backToTop.innerText = "↑";
    backToTop.classList.add("back-to-top");
    document.body.appendChild(backToTop);

    window.addEventListener("scroll", function () {
        backToTop.style.display = window.scrollY > 300 ? "block" : "none";
    });

    backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Animated Counter for Statistics Section
    const counters = document.querySelectorAll(".counter");
    const speed = 200;
    
    function runCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute("data-target");
            let count = 0;
            const increment = target / speed;

            function updateCount() {
                if (count < target) {
                    count += increment;
                    counter.innerText = Math.ceil(count);
                    setTimeout(updateCount, 30);
                } else {
                    counter.innerText = target;
                }
            }
            updateCount();
        });
    }

    function checkCountersInView() {
        const section = document.querySelector(".stats");
        if (section && section.getBoundingClientRect().top < window.innerHeight) {
            runCounters();
            window.removeEventListener("scroll", checkCountersInView);
        }
    }

    window.addEventListener("scroll", checkCountersInView);
    checkCountersInView();

    // Section Fade-In Effect
    const sections = document.querySelectorAll("section");
    
    function revealSections() {
        sections.forEach(section => {
            if (section.getBoundingClientRect().top < window.innerHeight - 100) {
                section.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", revealSections);
    revealSections();

    // Countdown Timer for Multiple Events
    function startCountdown(eventId, eventDate) {
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = eventDate - now;

            if (distance < 0) {
                document.getElementById(eventId).innerText = "Event Started!";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById(eventId).innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // Assign countdowns to different events
    startCountdown("countdown-science", new Date("2025-06-01T00:00:00").getTime());
    startCountdown("countdown-sports", new Date("2025-07-15T00:00:00").getTime());
    startCountdown("countdown-graduation", new Date("2025-09-10T00:00:00").getTime());

    // Sticky Navigation Bar
    const navbar = document.querySelector("nav");
    window.addEventListener("scroll", function () {
        navbar.classList.toggle("sticky", window.scrollY > 50);
    });

    // WhatsApp Floating Button
    const whatsappButton = document.createElement("a");
    whatsappButton.href = "https://wa.me/1234567890"; // Replace with your WhatsApp number
    whatsappButton.classList.add("whatsapp-button");
    whatsappButton.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp">`;
    document.body.appendChild(whatsappButton);
});
//go to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
//principal video
function openVideo() {
    document.getElementById("videoModal").style.display = "flex";
}

function closeVideo() {
    document.getElementById("videoModal").style.display = "none";
    document.getElementById("videoFrame").src = document.getElementById("videoFrame").src; // Stop video
}
//success stories//
let index = 0;
const slides = document.querySelectorAll(".carousel-container .story");
const dots = document.querySelectorAll(".dot");
const totalSlides = slides.length;
const container = document.querySelector(".carousel-container");

// Function to move slides
function showSlide(n) {
    if (n >= totalSlides) index = 0;
    if (n < 0) index = totalSlides - 1;

    // Move the container to the new position
    container.style.transform = `translateX(${-index * 100}%)`;

    // Update dots
    dots.forEach(dot => dot.classList.remove("active"));
    dots[index].classList.add("active");
}

// Auto-slide every 4 seconds
function startAutoSlide() {
    setInterval(() => {
        index++;
        showSlide(index);
    }, 4000);
}

// Function for manual navigation (dots)
function goToSlide(n) {
    index = n;
    showSlide(index);
}

// Initialize
showSlide(index);
startAutoSlide();
//school facilities sliding//
document.addEventListener("DOMContentLoaded", function () {
    const facilityCarousel = document.querySelector(".facilities-carousel .carousel");
    let facilityIndex = 0;

    function moveFacilitySlide() {
        facilityIndex++;
        if (facilityIndex >= facilityCarousel.children.length) {
            facilityIndex = 0;
        }
        facilityCarousel.style.transform = `translateX(-${facilityIndex * 100}%)`;
    }

    setInterval(moveFacilitySlide, 3000); // Adjust speed if needed
});
