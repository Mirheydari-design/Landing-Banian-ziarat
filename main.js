/* == Source: script.js == */
// Global Variables
let selectedAmount = null;
let showUpsell = false;
let playingStory = null;
let currentAudio = null;
let countdownInterval = null;
let upsellIncrement = 100000; // 100k by default; becomes 250k for >= 1,000,000

// DOM Elements
const video = document.getElementById('mainVideo');
const muteButton = document.getElementById('muteButton');
const playButton = document.getElementById('playButton');
const amountOptions = document.querySelectorAll('.amount-option');
const upsellMessage = document.getElementById('upsellMessage');
const upsellButton = document.getElementById('upsellButton');
const paymentButton = document.getElementById('paymentButton');
const paymentText = document.getElementById('paymentText');
const customAmountInput = document.getElementById('customAmount');
const customAmountToggle = document.getElementById('customAmountToggle');
const customAmountCollapsible = document.getElementById('customAmountCollapsible');
const dedicationInput = document.getElementById('dedicationInput');
const phoneModal = document.getElementById('phoneModal');
const phoneInput = document.getElementById('phoneInput');
const phoneError = document.getElementById('phoneError');
const cancelPhone = document.getElementById('cancelPhone');
const confirmPhone = document.getElementById('confirmPhone');
const playButtons = document.querySelectorAll('.play-button');
const storyTexts = document.querySelectorAll('.story-text');
const moreAmountsToggle = document.getElementById('moreAmountsToggle');
const moreAmountsCollapsible = document.getElementById('moreAmountsCollapsible');

// Countdown Elements
const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeVideoControls();
    initializePaymentModule();
    initializeAudioStories();
    initializeCountdown();
    initializeGallery();
    initializeVideoFolderSlider().finally(() => {
        initializeVideoSlider();
    });
});

// Video Controls
function initializeVideoControls() {
    if (!video || !muteButton) return;

    const playButton = document.getElementById('playButton');
    if (!playButton) return;

    const togglePlayPause = () => {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    video.addEventListener('play', () => {
        playButton.style.display = 'none';
    });

    video.addEventListener('pause', () => {
        playButton.style.display = 'flex';
    });

    video.addEventListener('click', togglePlayPause);
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    muteButton.addEventListener('click', function(e) {
        e.stopPropagation();
        video.muted = !video.muted;
        const icon = muteButton.querySelector('.volume-icon');
        if (video.muted) {
            icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
            muteButton.setAttribute('aria-label', 'فعال کردن صدا');
        } else {
            icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
            muteButton.setAttribute('aria-label', 'قطع صدا');
        }
    });
    
    // Set initial mute icon state
    if (video.muted) {
        const icon = muteButton.querySelector('.volume-icon');
        icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
        muteButton.setAttribute('aria-label', 'فعال کردن صدا');
    }
}

// Payment Module
function initializePaymentModule() {
    // Amount selection
    amountOptions.forEach(option => {
        option.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            selectAmount(amount);
        });
    });

    // Handle extra amounts toggle
    if (moreAmountsToggle && moreAmountsCollapsible) {
        moreAmountsCollapsible.classList.remove('open');
        moreAmountsToggle.setAttribute('aria-expanded', 'false');
        moreAmountsToggle.addEventListener('click', () => {
            const isOpen = moreAmountsCollapsible.classList.toggle('open');
            moreAmountsToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // Custom amount typing
    if (customAmountInput) {
        customAmountInput.addEventListener('input', () => {
            const sanitized = customAmountInput.value.replace(/[^0-9۰-۹]/g, '');
            const num = parseInt(toEnglishDigits(sanitized) || '0', 10);
            // adjust upsell increment based on threshold
            upsellIncrement = num >= 1000000 ? 250000 : 100000;
            if (Number.isFinite(num) && num > 0) {
                selectedAmount = num;
                updatePaymentButton();
                highlightNoPreset();
                if (num >= 9000000) {
                    hideUpsell();
                } else {
                    showUpsellMessage();
                }
            } else {
                if (!Array.from(amountOptions).some(o => o.classList.contains('selected'))) {
                    selectedAmount = null;
                    updatePaymentButton();
                }
            }
            customAmountInput.value = formatRial(num);
        });
    }

    // Upsell button
    if (upsellButton) {
        upsellButton.addEventListener('click', function() {
            if (selectedAmount) {
                selectedAmount += upsellIncrement;
                updatePaymentButton();
                hideUpsell();
                updateSelectedAmount();
            }
        });
    }

    // Payment button
    if (paymentButton) {
        paymentButton.addEventListener('click', function() {
            if (selectedAmount) {
                openPhoneModal();
            }
        });
    }
}

function selectAmount(amount) {
    selectedAmount = amount;
    // adjust upsell increment based on threshold
    upsellIncrement = amount >= 1000000 ? 250000 : 100000;
    
    // Update visual selection
    amountOptions.forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.dataset.amount) === amount) {
            option.classList.add('selected');
        }
    });
    
    // Show/hide upsell
    if (amount < 9000000) {
        showUpsellMessage();
    } else {
        hideUpsell();
    }
    
    updatePaymentButton();
}

function updateSelectedAmount() {
    amountOptions.forEach(option => {
        if (parseInt(option.dataset.amount) === selectedAmount) {
            option.classList.add('selected');
            const valueElement = option.querySelector('.amount-value');
            valueElement.textContent = selectedAmount.toLocaleString('fa-IR') + ' تومان';
        } else {
            option.classList.remove('selected');
        }
    });
}

function showUpsellMessage() {
    if (upsellMessage) {
        const textEl = upsellMessage.querySelector('.upsell-text');
        if (textEl) {
            const thousands = (upsellIncrement / 1000).toLocaleString('fa-IR');
            textEl.textContent = `با افزودن فقط ${thousands} هزار تومان دیگر، هزینه پذیرایی بین راه او را هم تقبل می‌کنی؟`;
        }
        if (upsellButton) {
            const thousandsBtn = (upsellIncrement / 1000).toLocaleString('fa-IR');
            upsellButton.textContent = `بله، ${thousandsBtn} هزار تومان اضافه کن`;
        }
        upsellMessage.style.display = 'block';
        upsellMessage.classList.add('fade-in');
    }
}

function hideUpsell() {
    if (upsellMessage) {
        upsellMessage.style.display = 'none';
        upsellMessage.classList.remove('fade-in');
    }
}

function updatePaymentButton() {
    if (paymentButton && paymentText) {
        if (selectedAmount) {
            paymentButton.disabled = false;
            paymentText.textContent = `هدیه‌ام را برای زائر ارسال می‌کنم (${selectedAmount.toLocaleString('fa-IR')} تومان)`;
        } else {
            paymentButton.disabled = true;
            paymentText.textContent = 'مبلغی را انتخاب کنید';
        }
    }
}

function processPayment() {
    if (selectedAmount) {
        // Simulate payment processing
        const originalText = paymentText.textContent;
        paymentText.textContent = 'در حال پردازش...';
        paymentButton.disabled = true;
        
        setTimeout(() => {
            alert(`پرداخت ${selectedAmount.toLocaleString('fa-IR')} تومان با موفقیت انجام شد!`);
            paymentText.textContent = originalText;
            paymentButton.disabled = false;
        }, 2000);
    }
}

// Audio Stories
function initializeAudioStories() {
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const storyId = this.dataset.story;
            toggleStory(storyId);
        });
    });
}

function toggleStory(storyId) {
    const storyItem = document.querySelector(`[data-story="${storyId}"]`);
    const playButton = storyItem.querySelector('.play-button');
    const storyText = storyItem.querySelector('.story-text');
    const audioBars = storyItem.querySelectorAll('.audio-bar');
    
    if (playingStory === storyId) {
        // Stop current story
        stopStory(storyId);
    } else {
        // Stop any other playing story
        if (playingStory) {
            stopStory(playingStory);
        }
        
        // Start new story
        startStory(storyId);
    }
}

function startStory(storyId) {
    const storyItem = document.querySelector(`[data-story="${storyId}"]`);
    const playButton = storyItem.querySelector('.play-button');
    const storyText = storyItem.querySelector('.story-text');
    const audio = storyItem.querySelector('.story-audio');
    
    playingStory = storyId;
    
    // Update button
    playButton.classList.add('playing');
    playButton.innerHTML = `
        <svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
    
    // Update story item
    storyItem.classList.add('playing');
    
    // Show and type text
    storyText.style.display = 'block';
    typeText(storyText);

    // Play audio if available
    if (audio) {
        // Stop any previous audio
        if (currentAudio && currentAudio !== audio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentAudio = audio;
        audio.play().catch(() => {});

        // When audio ends, stop story
        audio.onended = () => {
            if (playingStory === storyId) {
                stopStory(storyId);
            }
        };
    }
}

function stopStory(storyId) {
    const storyItem = document.querySelector(`[data-story="${storyId}"]`);
    const playButton = storyItem.querySelector('.play-button');
    const storyText = storyItem.querySelector('.story-text');
    const audio = storyItem.querySelector('.story-audio');
    
    playingStory = null;
    
    // Update button
    playButton.classList.remove('playing');
    playButton.innerHTML = `
        <svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
    `;
    
    // Update story item
    storyItem.classList.remove('playing');
    
    // Hide text
    storyText.style.display = 'none';

    // Stop audio if exists
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        if (currentAudio === audio) {
            currentAudio = null;
        }
    }
}

function typeText(element) {
    const text = element.querySelector('p').textContent;
    const cursor = element.querySelector('.typing-cursor');
    
    element.querySelector('p').textContent = '';
    
    let index = 0;
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            element.querySelector('p').textContent += text[index];
            index++;
        } else {
            clearInterval(typeInterval);
            // Keep cursor blinking
            if (cursor) {
                cursor.style.animation = 'blink 1s infinite';
            }
        }
    }, 50);
}

// Countdown Timer
function initializeCountdown() {
    // Set target date (2 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(targetDate.getHours() + 3);
    targetDate.setMinutes(targetDate.getMinutes() + 20);
    
    updateCountdown(targetDate);
    
    // Update every second
    countdownInterval = setInterval(() => {
        updateCountdown(targetDate);
    }, 1000);
}

function updateCountdown(targetDate) {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        if (daysElement) daysElement.textContent = String(days).padStart(2, '0');
        if (hoursElement) hoursElement.textContent = String(hours).padStart(2, '0');
        if (minutesElement) minutesElement.textContent = String(minutes).padStart(2, '0');
        if (secondsElement) secondsElement.textContent = String(seconds).padStart(2, '0');
    } else {
        // Countdown finished
        if (daysElement) daysElement.textContent = '00';
        if (hoursElement) hoursElement.textContent = '00';
        if (minutesElement) minutesElement.textContent = '00';
        if (secondsElement) secondsElement.textContent = '00';
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    }
}

// Video Gallery
function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Simulate video play
            const caption = this.querySelector('.gallery-caption p').textContent;
            alert(`پخش ویدیو: ${caption}`);
        });
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Build video slides from assets/video/videos.json if present
async function initializeVideoFolderSlider() {
    const viewport = document.querySelector('.slider-viewport');
    const track = document.querySelector('.slider-track');
    if (!viewport || !track) return;

    try {
        const res = await fetch('assets/video/videos.json', { cache: 'no-store' });
        if (!res.ok) return; // No manifest; keep existing slides
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return;

        // Build slides
        track.innerHTML = '';
        list.forEach((item) => {
            const src = typeof item === 'string' ? item : item.src;
            if (!src) return;
            const title = '';

            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.setAttribute('data-caption', title);

            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const video = document.createElement('video');
            video.className = 'gallery-image';
            video.setAttribute('preload', 'metadata');
            video.setAttribute('controls', '');
            const source = document.createElement('source');
            source.src = src;
            source.type = guessMimeType(src);
            video.appendChild(source);

            const overlay = document.createElement('div');
            overlay.className = 'gallery-overlay';
            const playOverlay = document.createElement('div');
            playOverlay.className = 'play-overlay';
            const playBtnLarge = document.createElement('div');
            playBtnLarge.className = 'play-button-large';
            const playTriangle = document.createElement('div');
            playTriangle.className = 'play-triangle';
            playBtnLarge.appendChild(playTriangle);
            playOverlay.appendChild(playBtnLarge);

            // no caption

            galleryItem.appendChild(video);
            galleryItem.appendChild(overlay);
            galleryItem.appendChild(playOverlay);
            // no caption
            slide.appendChild(galleryItem);
            track.appendChild(slide);
        });
    } catch (_) {
        // ignore if manifest missing or JSON invalid
    }
}

function deriveCaptionFromPath(path) {
    try {
        const raw = decodeURIComponent(path.split('/').pop() || path);
        return raw.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    } catch {
        return 'ویدیو';
    }
}

function guessMimeType(src) {
    const ext = src.split('?')[0].split('.').pop().toLowerCase();
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'ogg' || ext === 'ogv') return 'video/ogg';
    return 'video/mp4';
}

// Video Slider (horizontal, dots)
function initializeVideoSlider() {
    const viewport = document.querySelector('.slider-viewport');
    const track = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');

    if (!viewport || !track || slides.length === 0 || !dotsContainer) return;

    // Create dots
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `اسلاید ${idx + 1}`);
        dot.addEventListener('click', () => scrollToSlide(idx));
        dotsContainer.appendChild(dot);
    });

    function updateActiveDot(activeIndex) {
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
    }

    function getActiveIndex() {
        // Viewport in LTR, but track is row-reverse؛ فعال‌ترین اسلاید نزدیک‌ترین به لبه چپ ویوپورت است
        const viewportRect = viewport.getBoundingClientRect();
        const viewportLeft = viewportRect.left;
        let minDelta = Infinity;
        let active = 0;
        slides.forEach((slide, i) => {
            const r = slide.getBoundingClientRect();
            const delta = Math.abs(r.left - viewportLeft);
            if (delta < minDelta) {
                minDelta = delta;
                active = i;
            }
        });
        return active;
    }

    function scrollToSlide(index) {
        const slide = slides[index];
        if (!slide) return;
        // LTR viewport + row-reverse track: به offsetLeft اسلاید اسکرول می‌کنیم
        const left = slide.offsetLeft - parseInt(getComputedStyle(track).paddingInlineStart || '0', 10);
        viewport.scrollTo({ left, behavior: 'smooth' });
    }

    // Sync on scroll
    const onScroll = () => updateActiveDot(getActiveIndex());
    viewport.addEventListener('scroll', debounce(onScroll, 50));

    // Initialize state
    updateActiveDot(0);
}

// Utility Functions
function formatNumber(number) {
    return number.toLocaleString('fa-IR');
}

function toEnglishDigits(str) {
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

function formatRial(n) {
    if (!Number.isFinite(n) || n <= 0) return '';
    return n.toLocaleString('fa-IR');
}

function highlightNoPreset() {
    amountOptions.forEach(o => o.classList.remove('selected'));
}

// Phone modal handlers
function openPhoneModal() {
    if (!phoneModal) return processPayment();
    phoneModal.classList.remove('hidden');
    phoneError.classList.add('hidden');
    phoneInput.value = '';
    setTimeout(() => phoneInput && phoneInput.focus(), 0);
}

function closePhoneModal() {
    if (phoneModal) phoneModal.classList.add('hidden');
}

function isValidIranPhone(value) {
    const v = toEnglishDigits(String(value || '').trim());
    return /^09\d{9}$/.test(v);
}

if (cancelPhone) {
    cancelPhone.addEventListener('click', closePhoneModal);
}

if (confirmPhone) {
    confirmPhone.addEventListener('click', () => {
        const val = phoneInput ? phoneInput.value : '';
        if (!isValidIranPhone(val)) {
            phoneError.classList.remove('hidden');
            return;
        }
        phoneError.classList.add('hidden');
        closePhoneModal();
        processPayment();
    });
}

// Logo Marquee is now handled by HTML and CSS

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    showNotification('خطایی رخ داده است. لطفاً صفحه را رفرش کنید.', 'error');
});

// Performance Optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading if supported
if ('IntersectionObserver' in window) {
    initializeLazyLoading();
}

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    // ESC key to close modals or stop animations
    if (e.key === 'Escape') {
        if (playingStory) {
            stopStory(playingStory);
        }
    }
    
    // Space key to play/pause video
    if (e.key === ' ' && e.target === video) {
        e.preventDefault();
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

