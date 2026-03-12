document.addEventListener('DOMContentLoaded', () => {
    const moodInput = document.getElementById('moodInput');
    const recommendBtn = document.getElementById('recommendBtn');
    const chips = document.querySelectorAll('.chip');

    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results');

    const musicGrid = document.getElementById('musicGrid');
    const moviesGrid = document.getElementById('moviesGrid');
    const seriesGrid = document.getElementById('seriesGrid');
    const cardTemplate = document.getElementById('cardTemplate');

    let currentMood = '';
    let currentTitles = [];
    let isFetchingMore = false;

    // Replace this with your actual Python backend URL if hosted remotely
    const BE_URL = 'http://127.0.0.1:5000/api/recommend';

    // Dynamic typing effect for placeholder
    const placeholders = [
        "How are you feeling right now?",
        "I need something to pump me up! 🔥",
        "Looking for a cozy, rainy day vibe 🌧️",
        "I'm feeling romantic tonight 💖",
        "Give me something nostalgic 📼",
        "Stressed out but trying to relax 😌"
    ];
    let pIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function typePlaceholder() {
        const currentText = placeholders[pIdx];
        if (isDeleting) {
            moodInput.setAttribute('placeholder', currentText.substring(0, charIdx - 1));
            charIdx--;
        } else {
            moodInput.setAttribute('placeholder', currentText.substring(0, charIdx + 1));
            charIdx++;
        }

        let typeSpeed = isDeleting ? 30 : 80;

        if (!isDeleting && charIdx === currentText.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            pIdx = (pIdx + 1) % placeholders.length;
            typeSpeed = 500; // Pause before new word
        }
        setTimeout(typePlaceholder, typeSpeed);
    }
    typePlaceholder();

    // Handle suggested mood clicks
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const mood = chip.getAttribute('data-mood');
            moodInput.value = mood;
            fetchRecommendations(mood);
        });
    });

    // Handle Enter key
    moodInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchRecommendations(moodInput.value);
        }
    });

    // Handle Button click
    recommendBtn.addEventListener('click', () => {
        fetchRecommendations(moodInput.value);
    });

    // Infinite Scroll logic for sliders
    function handleScroll(e) {
        const grid = e.target;
        if (grid.scrollWidth - grid.scrollLeft - grid.clientWidth < 150) {
            if (!isFetchingMore && currentMood) {
                isFetchingMore = true;
                fetchRecommendations(currentMood, true);
            }
        }
    }

    musicGrid.addEventListener('scroll', handleScroll);
    moviesGrid.addEventListener('scroll', handleScroll);
    seriesGrid.addEventListener('scroll', handleScroll);

    // Explicit slider buttons logic
    const sliderWrappers = document.querySelectorAll('.slider-wrapper');
    sliderWrappers.forEach(wrapper => {
        const leftBtn = wrapper.querySelector('.left-btn');
        const rightBtn = wrapper.querySelector('.right-btn');
        const grid = wrapper.querySelector('.grid');

        leftBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -340, behavior: 'smooth' });
        });

        rightBtn.addEventListener('click', () => {
            grid.scrollBy({ left: 340, behavior: 'smooth' });
        });
    });

    async function fetchRecommendations(mood, isLoadMore = false) {
        if (!mood.trim()) {
            moodInput.focus();
            return;
        }

        currentMood = mood;

        if (!isLoadMore) {
            isFetchingMore = true;
            recommendBtn.disabled = true;
            recommendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';

            resultsSection.classList.add('hidden');
            loader.classList.remove('hidden');

            musicGrid.innerHTML = '';
            moviesGrid.innerHTML = '';
            seriesGrid.innerHTML = '';
            currentTitles = [];
        }

        try {
            const response = await fetch(BE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mood: mood, exclude: currentTitles })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch recommendations');
            }

            const data = await response.json();

            // Track titles so we don't fetch them again
            if (data.music) data.music.forEach(i => currentTitles.push(i.title));
            if (data.movies) data.movies.forEach(i => currentTitles.push(i.title));
            if (data.series) data.series.forEach(i => currentTitles.push(i.title));

            // Render the data
            renderSection(musicGrid, data.music, item => item.artist);
            renderSection(moviesGrid, data.movies, item => item.year);
            renderSection(seriesGrid, data.series, item => item.platform);

            if (!isLoadMore) {
                loader.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            isFetchingMore = false; // allow more scrolls

        } catch (error) {
            console.error('Error fetching recommendations:', error);
            alert(`Oops! Something went wrong: ${error.message}`);
            if (!isLoadMore) loader.classList.add('hidden');
            isFetchingMore = false;
        } finally {
            if (!isLoadMore) {
                recommendBtn.disabled = false;
                recommendBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i> Vibe Check';
            }
        }
    }

    function renderSection(gridElement, items, getSubtitle) {
        if (!items || items.length === 0) {
            gridElement.innerHTML = '<p style="color: var(--text-muted);">No recommendations found for this mood.</p>';
            return;
        }

        items.forEach((item, index) => {
            const clone = cardTemplate.content.cloneNode(true);
            const card = clone.querySelector('.card');

            const titleEl = clone.querySelector('.card-title');
            const subtitleEl = clone.querySelector('.card-subtitle');
            const descEl = clone.querySelector('.card-desc');

            titleEl.textContent = item.title;
            subtitleEl.textContent = getSubtitle(item);
            descEl.textContent = item.reason;

            // Staggered animation effect
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.15}s`;

            gridElement.appendChild(clone);

            // Get the appended card and its image element
            const appendedCard = gridElement.lastElementChild;
            const imgEl = appendedCard.querySelector('.card-img');

            // Set temporary loading placeholder
            imgEl.src = `https://placehold.co/600x600/1e1e2f/8b5cf6?text=Loading...&font=montserrat`;

            // Determine iTunes media type
            let mediaType = 'movie';
            if (gridElement.id === 'musicGrid') mediaType = 'music';
            else if (gridElement.id === 'seriesGrid') mediaType = 'tvShow';

            // 3D Tilt Effect
            appendedCard.addEventListener('mousemove', (e) => {
                const rect = appendedCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                appendedCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                appendedCard.style.transition = 'none';
            });

            appendedCard.addEventListener('mouseleave', () => {
                appendedCard.style.transform = 'translateY(-8px) scale(1.02)';
                appendedCard.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            });

            // Fetch and set real thumbnail
            getThumbnail(item.title, mediaType).then(url => {
                imgEl.src = url;
            });
        });
    }

    async function getThumbnail(term, media) {
        try {
            if (media === 'tvShow') {
                const tvRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`);
                const tvData = await tvRes.json();
                if (tvData.length > 0 && tvData[0].show.image) {
                    return tvData[0].show.image.original || tvData[0].show.image.medium;
                }
            } else if (media === 'movie') {
                // Movie Posters via case-insensitive Wikipedia Search Generator
                const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term + ' film')}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=600&origin=*`);
                const wikiData = await wikiRes.json();
                const pages = wikiData.query?.pages;
                if (pages) {
                    const pageId = Object.keys(pages)[0];
                    if (pages[pageId].thumbnail) {
                        return pages[pageId].thumbnail.source;
                    }
                }
            } else {
                // Music
                const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`);
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    return data.results[0].artworkUrl100.replace('100x100', '600x600');
                }
            }
        } catch (e) {
            console.error("Error fetching thumbnail:", e);
        }
        // Fallback generator
        const colors = ['8b5cf6', 'd946ef', '3b82f6', 'f43f5e', '10b981', 'f59e0b'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `https://placehold.co/600x600/1e1e2f/${color}?text=${encodeURIComponent(term)}&font=montserrat`;
    }
});
