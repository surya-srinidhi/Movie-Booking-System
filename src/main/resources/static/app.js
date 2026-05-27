/* ==========================================================================
   CINELUV PREMIUM THEATER - SPA CONTROLLER & STATE ENGINE
   ========================================================================== */

// Client State Container
const state = {
    user: null,         // Active logged-in user object {id, name, email, role}
    movies: [],         // Cached list of all movies
    selectedMovie: null, // Movie object currently selected
    selectedShowtime: null, // Showtime object currently selected
    selectedSeats: [],   // Array of seat codes currently selected (e.g. ["A3", "A4"])
    bookings: []        // Customer's booking history
};

// API Endpoint Constants
const API = {
    auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        me: '/api/auth/me'
    },
    movies: '/api/movies',
    showtimes: '/api/showtimes',
    bookings: '/api/bookings'
};

// ==========================================================================
// INITIALIZER & BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupViewNavigation();
    setupAuthListeners();
    setupFilterListeners();
    setupBookingListeners();
    setupAdminListeners();

    // Check active session on page startup
    await checkActiveSession();

    // Initial fetch of movies
    await fetchMovies();
});

// ==========================================================================
// SESSION MANAGEMENT & SECURITY
// ==========================================================================
async function checkActiveSession() {
    try {
        const response = await fetch(API.auth.me);
        if (response.ok) {
            const userData = await response.json();
            handleSuccessfulLoginState(userData);
        } else {
            handleSuccessfulLogoutState();
        }
    } catch (error) {
        console.error('Session check error:', error);
        handleSuccessfulLogoutState();
    }
}

function handleSuccessfulLoginState(userData) {
    state.user = userData;
    
    // Update Header Auth Section to show user profile details & logout
    const authSection = document.getElementById('auth-header-section');
    authSection.innerHTML = `
        <div class="user-profile-badge">
            <span class="user-name"><i class="fa-solid fa-circle-user"></i> ${userData.name}</span>
            <span class="user-role-tag">${userData.role}</span>
            <button class="btn btn-outline" id="btn-header-logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
        </div>
    `;

    document.getElementById('btn-header-logout').addEventListener('click', logoutUser);

    // Unhide customer ticketing history tab
    document.getElementById('nav-history').style.display = 'flex';

    // Unhide admin dashboard navigation if user has ADMIN authority
    if (userData.role === 'ADMIN') {
        document.getElementById('nav-admin').style.display = 'flex';
    } else {
        document.getElementById('nav-admin').style.display = 'none';
    }
}

function handleSuccessfulLogoutState() {
    state.user = null;
    
    // Update Header Auth Section to standard login CTA
    const authSection = document.getElementById('auth-header-section');
    authSection.innerHTML = `
        <button class="btn btn-primary" id="btn-header-login"><i class="fa-solid fa-user"></i> Login / Register</button>
    `;

    document.getElementById('btn-header-login').addEventListener('click', () => {
        switchView('view-auth');
    });

    // Hide history and admin navigation tabs
    document.getElementById('nav-history').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'none';

    // If currently on a secure dashboard, redirect back to movies landing
    const currentActiveView = document.querySelector('.app-view.active');
    if (currentActiveView && (currentActiveView.id === 'view-history' || currentActiveView.id === 'view-admin')) {
        switchView('view-movies');
    }
}

async function logoutUser() {
    try {
        const response = await fetch(API.auth.logout, { method: 'POST' });
        if (response.ok) {
            handleSuccessfulLogoutState();
            switchView('view-movies');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==========================================================================
// CLIENT-SIDE ROUTER / VIEW CONTROLLER
// ==========================================================================
function setupViewNavigation() {
    // Nav Bar click handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-target');
            
            // Highlight active navigation tab
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            switchView(targetView);
        });
    });

    // Logo click redirects home
    document.getElementById('nav-logo').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('view-movies');
    });

    // Action button back navigations
    document.getElementById('back-to-movies').addEventListener('click', () => {
        switchView('view-movies');
    });

    document.getElementById('back-to-showtimes').addEventListener('click', () => {
        if (state.selectedMovie) {
            renderShowtimeView(state.selectedMovie);
        } else {
            switchView('view-movies');
        }
    });

    document.getElementById('hero-book-btn').addEventListener('click', () => {
        // Quick book first movie listed as featured spotlight
        if (state.movies.length > 0) {
            renderShowtimeView(state.movies[0]);
        }
    });
}

function switchView(viewId) {
    // Hide all views first
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        
        // Trigger specific data loads on active dashboard screens
        if (viewId === 'view-history') {
            fetchBookingHistory();
        } else if (viewId === 'view-admin') {
            loadAdminPortalData();
        } else if (viewId === 'view-movies') {
            // Keep home link highlighted
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector('[data-target="view-movies"]').classList.add('active');
        }
    }
    
    // Scroll window smoothly back to top on transitions
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// VIEW 1: MOVIE BROWSING & SEARCH
// ==========================================================================
async function fetchMovies() {
    try {
        const response = await fetch(API.movies);
        if (response.ok) {
            state.movies = await response.json();
            renderMoviesGrid(state.movies);
        }
    } catch (error) {
        console.error('Fetch movies error:', error);
    }
}

function renderMoviesGrid(movieList) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';

    if (movieList.length === 0) {
        container.innerHTML = `<div class="no-sessions-msg" style="grid-column: 1/-1;">No movies found. Please try a different search or genre filter.</div>`;
        return;
    }

    movieList.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="card-poster">
                <img src="${movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300'}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300'">
                <div class="poster-overlay">
                    <button class="btn btn-gold btn-full-width"><i class="fa-solid fa-ticket"></i> Book Tickets</button>
                </div>
            </div>
            <div class="card-details">
                <h4>${movie.title}</h4>
                <div class="genre">${movie.genre}</div>
                <div class="card-meta">
                    <span><i class="fa-solid fa-clock"></i> ${movie.duration} min</span>
                    <span><i class="fa-solid fa-language"></i> ${movie.language}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            renderShowtimeView(movie);
        });

        container.appendChild(card);
    });
}

function setupFilterListeners() {
    const searchInput = document.getElementById('movie-search');
    const genreSelect = document.getElementById('genre-filter');
    const langSelect = document.getElementById('lang-filter');

    const filterMovies = () => {
        const query = searchInput.value.toLowerCase().trim();
        const selectedGenre = genreSelect.value.toLowerCase();
        const selectedLang = langSelect.value.toLowerCase();

        const filtered = state.movies.filter(movie => {
            const matchesQuery = movie.title.toLowerCase().includes(query) || movie.genre.toLowerCase().includes(query);
            const matchesGenre = selectedGenre === '' || movie.genre.toLowerCase().includes(selectedGenre);
            const matchesLang = selectedLang === '' || movie.language.toLowerCase().includes(selectedLang);
            return matchesQuery && matchesGenre && matchesLang;
        });

        renderMoviesGrid(filtered);
    };

    searchInput.addEventListener('input', filterMovies);
    genreSelect.addEventListener('change', filterMovies);
    langSelect.addEventListener('change', filterMovies);
}

// ==========================================================================
// VIEW 2: SHOWTIME SELECTION
// ==========================================================================
async function renderShowtimeView(movie) {
    state.selectedMovie = movie;
    switchView('view-showtimes');

    // Build details card
    const banner = document.getElementById('showtime-movie-banner');
    banner.innerHTML = `
        <img class="banner-poster" src="${movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300'}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300'">
        <div class="banner-info">
            <h2>${movie.title}</h2>
            <div class="banner-tags">
                <span class="banner-tag gold"><i class="fa-solid fa-mask"></i> ${movie.genre}</span>
                <span class="banner-tag"><i class="fa-solid fa-clock"></i> ${movie.duration} Mins</span>
                <span class="banner-tag"><i class="fa-solid fa-language"></i> ${movie.language}</span>
            </div>
            <p class="synopsis">${movie.description || 'No synopsis available for this film. Prepare for a breathtaking cinema session.'}</p>
            
            <div class="banner-meta-rows">
                <div class="meta-item">
                    <label>Release Date</label>
                    <span>${movie.releaseDate ? formatDateString(movie.releaseDate) : 'Now Showing'}</span>
                </div>
                <div class="meta-item">
                    <label>Theater Audio</label>
                    <span>Dolby Atmos Digital</span>
                </div>
            </div>
        </div>
    `;

    // Fetch and show showtimes
    try {
        const response = await fetch(`${API.showtimes}/movie/${movie.id}`);
        if (response.ok) {
            const showtimes = await response.json();
            renderShowtimesTimeline(showtimes);
        }
    } catch (error) {
        console.error('Fetch showtimes error:', error);
    }
}

function renderShowtimesTimeline(showtimesList) {
    const container = document.getElementById('showtimes-container');
    container.innerHTML = '';

    if (showtimesList.length === 0) {
        container.innerHTML = `<div class="no-sessions-msg">No active theater sessions scheduled for this movie. Please check back later.</div>`;
        return;
    }

    // Group showtimes by showDate
    const groups = {};
    showtimesList.forEach(show => {
        if (!groups[show.showDate]) {
            groups[show.showDate] = [];
        }
        groups[show.showDate].push(show);
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(groups).sort();

    sortedDates.forEach(dateStr => {
        const sessionCard = document.createElement('div');
        sessionCard.className = 'day-session';
        
        // Dynamic date title header (Today / Tomorrow / Format)
        const dateFormatted = formatShowDateHeader(dateStr);
        
        sessionCard.innerHTML = `
            <div class="day-header">
                <h4><i class="fa-regular fa-calendar-days"></i> ${dateFormatted}</h4>
            </div>
            <div class="showtimes-grid" id="grid-${dateStr}"></div>
        `;

        container.appendChild(sessionCard);

        // Append showtime buttons
        const grid = document.getElementById(`grid-${dateStr}`);
        
        // Sort sessions in day chronologically
        groups[dateStr].sort((s1, s2) => s1.showTime.localeCompare(s2.showTime));

        groups[dateStr].forEach(show => {
            const ticket = document.createElement('div');
            ticket.className = 'showtime-ticket';
            ticket.innerHTML = `
                <div class="time">${formatTimeString(show.showTime)}</div>
                <div class="hall">${show.screenName}</div>
                <div class="price">₹${show.ticketPrice.toFixed(0)}</div>
            `;

            ticket.addEventListener('click', () => {
                startSeatSelection(show);
            });

            grid.appendChild(ticket);
        });
    });
}

// ==========================================================================
// VIEW 3: INTERACTIVE SEAT SELECTION
// ==========================================================================
async function startSeatSelection(showtime) {
    state.selectedShowtime = showtime;
    state.selectedSeats = [];
    
    // Clear checkouts
    document.getElementById('checkout-seats-list').innerText = 'None';
    document.getElementById('checkout-total-price').innerText = '₹0';
    document.getElementById('btn-confirm-booking').disabled = true;

    switchView('view-seats');

    // Load static brief overview
    const brief = document.getElementById('booking-session-summary');
    brief.innerHTML = `
        <div class="session-brief">
            <h4>${state.selectedMovie.title}</h4>
            <p><i class="fa-solid fa-video"></i> ${showtime.screenName} &bull; <i class="fa-regular fa-calendar"></i> ${formatShowDateHeader(showtime.showDate)} at ${formatTimeString(showtime.showTime)}</p>
        </div>
        <div class="price-pill">
            ₹${showtime.ticketPrice.toFixed(0)} / Seat
        </div>
    `;

    // Fetch occupied seats
    try {
        const response = await fetch(`${API.bookings}/showtime/${showtime.id}/booked-seats`);
        if (response.ok) {
            const occupiedSeats = await response.json();
            renderSeatsGrid(occupiedSeats);
        }
    } catch (error) {
        console.error('Fetch occupied seats error:', error);
        renderSeatsGrid([]); // Fallback to empty hall
    }
}

function renderSeatsGrid(occupiedSeatsList) {
    const grid = document.getElementById('seats-interactive-grid');
    grid.innerHTML = '';

    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const columnsCount = 10;
    const occupiedSet = new Set(occupiedSeatsList);

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        // Row letter label left
        rowDiv.innerHTML = `<span class="row-label">${row}</span>`;

        for (let col = 1; col <= columnsCount; col++) {
            const seatCode = `${row}${col}`;
            const seat = document.createElement('div');
            
            const isOccupied = occupiedSet.has(seatCode);
            seat.className = `seat-item ${isOccupied ? 'occupied' : 'available'}`;
            seat.innerText = col;
            
            if (!isOccupied) {
                seat.addEventListener('click', () => {
                    toggleSeatSelection(seat, seatCode);
                });
            }

            rowDiv.appendChild(seat);
        }

        // Row letter label right
        const rightLabel = document.createElement('span');
        rightLabel.className = 'row-label';
        rightLabel.innerText = row;
        rowDiv.appendChild(rightLabel);

        grid.appendChild(rowDiv);
    });
}

function toggleSeatSelection(seatElement, seatCode) {
    const idx = state.selectedSeats.indexOf(seatCode);
    
    if (idx > -1) {
        // Remove seat
        state.selectedSeats.splice(idx, 1);
        seatElement.classList.remove('selected');
    } else {
        // Add seat
        state.selectedSeats.push(seatCode);
        seatElement.classList.add('selected');
    }

    // Sort selected seats code alphabetically
    state.selectedSeats.sort();

    // Update Floating Checkout UI
    const seatsListSpan = document.getElementById('checkout-seats-list');
    const priceSpan = document.getElementById('checkout-total-price');
    const confirmBtn = document.getElementById('btn-confirm-booking');

    if (state.selectedSeats.length > 0) {
        seatsListSpan.innerText = state.selectedSeats.join(', ');
        
        const total = state.selectedSeats.length * state.selectedShowtime.ticketPrice;
        priceSpan.innerText = `₹${total.toFixed(0)}`;
        confirmBtn.disabled = false;
    } else {
        seatsListSpan.innerText = 'None';
        priceSpan.innerText = '₹0';
        confirmBtn.disabled = true;
    }
}

function setupBookingListeners() {
    document.getElementById('btn-confirm-booking').addEventListener('click', async () => {
        // Auth check before booking
        if (!state.user) {
            alert('Please register or log in to complete your seat selection booking!');
            switchView('view-auth');
            return;
        }

        // Confirm prompt
        const seatsStr = state.selectedSeats.join(', ');
        const totalAmountStr = document.getElementById('checkout-total-price').innerText;
        
        if (!confirm(`Are you sure you want to book seats [${seatsStr}] for ${totalAmountStr}?`)) {
            return;
        }

        // Post booking
        try {
            const response = await fetch(API.bookings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    showtimeId: state.selectedShowtime.id,
                    seats: seatsStr
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                renderBookingSuccessTicket(responseData);
            } else {
                alert(responseData.message || 'Seat booking failed. Some selected seats might have just been reserved. Please try again!');
                // Reload seat selection to reflect fresh occupancy
                startSeatSelection(state.selectedShowtime);
            }
        } catch (error) {
            console.error('Booking post error:', error);
            alert('An unexpected connection error occurred. Please check your network and try again.');
        }
    });

    document.getElementById('btn-success-history').addEventListener('click', () => {
        switchView('view-history');
    });

    document.getElementById('btn-success-home').addEventListener('click', () => {
        switchView('view-movies');
    });
}

function renderBookingSuccessTicket(booking) {
    switchView('view-success');

    const container = document.getElementById('success-ticket-details');
    container.innerHTML = `
        <div class="ticket-main-section">
            <h5 class="ticket-movie-title">${booking.showtime.movie.title}</h5>
            
            <div class="ticket-info-grid">
                <div class="info-node">
                    <label>Theater Screen</label>
                    <span>${booking.showtime.screenName}</span>
                </div>
                <div class="info-node">
                    <label>Seats Selected</label>
                    <span class="gold">${booking.seats}</span>
                </div>
                <div class="info-node">
                    <label>Date & Session</label>
                    <span>${formatShowDateHeader(booking.showtime.showDate)} at ${formatTimeString(booking.showtime.showTime)}</span>
                </div>
                <div class="info-node">
                    <label>Total Price</label>
                    <span class="gold">₹${booking.totalAmount.toFixed(0)}</span>
                </div>
                <div class="info-node" style="grid-column: 1 / -1;">
                    <label>Booking Customer</label>
                    <span>${booking.user.name} (${booking.user.email})</span>
                </div>
            </div>
        </div>

        <div class="ticket-divider-line"></div>

        <div class="ticket-stub-section">
            <div class="barcode-placeholder"></div>
            <div class="ticket-ref-number">${booking.bookingNumber}</div>
        </div>
    `;
}

// ==========================================================================
// VIEW 4: AUTHENTICATION FLOW (LOGIN & SIGNUP)
// ==========================================================================
function setupAuthListeners() {
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    // Toggle Sign In vs Create Account tabs
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.add('active');
        formRegister.classList.remove('active');
        // Clear errors
        document.getElementById('login-error').innerText = '';
        document.getElementById('register-error').innerText = '';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.add('active');
        formLogin.classList.remove('active');
        // Clear errors
        document.getElementById('login-error').innerText = '';
        document.getElementById('register-error').innerText = '';
    });

    // Login Form Submit
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errMsg = document.getElementById('login-error');

        errMsg.innerText = '';

        try {
            const response = await fetch(API.auth.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                handleSuccessfulLoginState(data);
                
                // Clear form inputs
                formLogin.reset();
                
                // Redirect user: if they were selecting seats, go back to seats checkout, else movies list
                if (state.selectedShowtime) {
                    startSeatSelection(state.selectedShowtime);
                } else {
                    switchView('view-movies');
                }
            } else {
                errMsg.innerText = data.message || 'Incorrect credentials. Please try again.';
            }
        } catch (error) {
            console.error('Login submit error:', error);
            errMsg.innerText = 'Connection error. Please try again later.';
        }
    });

    // Registration Form Submit
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        const errMsg = document.getElementById('register-error');
        const successMsg = document.getElementById('register-success');

        errMsg.innerText = '';
        successMsg.innerText = '';

        try {
            const response = await fetch(API.auth.register, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                successMsg.innerText = data.message || 'Registration successful! Switching to Sign In tab...';
                formRegister.reset();
                
                // Automatically switch to login tab after 2 seconds
                setTimeout(() => {
                    tabLogin.click();
                    // Pre-fill email inside login input
                    document.getElementById('login-email').value = email;
                    successMsg.innerText = '';
                }, 2000);
            } else {
                errMsg.innerText = data.message || 'Registration failed. Please resolve form parameters.';
            }
        } catch (error) {
            console.error('Registration submit error:', error);
            errMsg.innerText = 'Connection error. Please try again later.';
        }
    });
}

// ==========================================================================
// VIEW 5: CUSTOMER TICKETS HISTORY DASHBOARD
// ==========================================================================
async function fetchBookingHistory() {
    const listDiv = document.getElementById('tickets-history-list');
    listDiv.innerHTML = '<div class="no-tickets-msg"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving booked seats...</div>';

    try {
        const response = await fetch(`${API.bookings}/history`);
        if (response.ok) {
            const bookings = await response.json();
            renderBookingHistoryList(bookings);
        } else {
            listDiv.innerHTML = `<div class="no-tickets-msg">Unable to load ticket logs. Please log in again.</div>`;
        }
    } catch (error) {
        console.error('Fetch booking history error:', error);
        listDiv.innerHTML = `<div class="no-tickets-msg">Connection error. Please check your database.</div>`;
    }
}

function renderBookingHistoryList(bookingsList) {
    const listDiv = document.getElementById('tickets-history-list');
    listDiv.innerHTML = '';

    if (bookingsList.length === 0) {
        listDiv.innerHTML = `
            <div class="no-tickets-msg">
                <i class="fa-solid fa-ticket-simple" style="font-size: 40px; color: var(--primary-gold); margin-bottom: 12px;"></i>
                <p>You haven't reserved any theater sessions yet!</p>
                <button class="btn btn-primary" onclick="switchView('view-movies')" style="margin-top: 16px;">Browse Movies</button>
            </div>
        `;
        return;
    }

    bookingsList.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'ticket-item';
        
        const isConfirmed = booking.status === 'CONFIRMED';
        
        card.innerHTML = `
            <div class="ticket-item-details">
                <img class="ticket-item-poster" src="${booking.showtime.movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=200'}" alt="${booking.showtime.movie.title}">
                <div class="ticket-main-info">
                    <h4>${booking.showtime.movie.title}</h4>
                    <p><i class="fa-solid fa-video"></i> ${booking.showtime.screenName} &bull; <span class="seats">Seats: ${booking.seats}</span></p>
                    <p><i class="fa-solid fa-clock"></i> ${formatShowDateHeader(booking.showtime.showDate)} at ${formatTimeString(booking.showtime.showTime)}</p>
                    <p style="font-family: monospace; font-size: 12px; margin-top: 4px; color: var(--text-muted);">Ref: ${booking.bookingNumber}</p>
                </div>
            </div>
            <div class="ticket-pricing-status">
                <div class="price-node">
                    <label>Amount Paid</label>
                    <span>₹${booking.totalAmount.toFixed(0)}</span>
                </div>
                <div class="status-node">
                    <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
                </div>
                ${isConfirmed ? `<button class="btn btn-outline" style="color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2);" onclick="cancelBookingSession(${booking.id})"><i class="fa-solid fa-ban"></i> Cancel Session</button>` : ''}
            </div>
        `;

        listDiv.appendChild(card);
    });
}

async function cancelBookingSession(bookingId) {
    if (!confirm('Are you sure you want to cancel this film session? You will release your reserved seats.')) {
        return;
    }

    try {
        const response = await fetch(`${API.bookings}/${bookingId}/cancel`, { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            alert('Session cancelled successfully.');
            fetchBookingHistory(); // Reload logs
        } else {
            alert(data.message || 'Unable to cancel ticket.');
        }
    } catch (error) {
        console.error('Cancel booking error:', error);
        alert('Network connection lost. Please try again.');
    }
}

// ==========================================================================
// VIEW 6: SYSTEM ADMINISTRATOR PORTAL
// ==========================================================================
function setupAdminListeners() {
    // Admin Sub Tabs Panels toggler
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = btn.getAttribute('data-panel');
            document.getElementById(targetPanel).classList.add('active');
        });
    });

    // Form Add Movie Submit
    const formMovie = document.getElementById('form-admin-movie');
    formMovie.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('admin-movie-title').value.trim();
        const genre = document.getElementById('admin-movie-genre').value.trim();
        const language = document.getElementById('admin-movie-lang').value.trim();
        const duration = parseInt(document.getElementById('admin-movie-duration').value);
        const posterUrl = document.getElementById('admin-movie-poster').value.trim();
        const releaseDate = document.getElementById('admin-movie-date').value;
        const description = document.getElementById('admin-movie-desc').value.trim();
        const msgDiv = document.getElementById('admin-movie-msg');

        msgDiv.innerText = '';

        try {
            const response = await fetch(API.movies, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, genre, language, duration, posterUrl, releaseDate, description
                })
            });

            if (response.ok) {
                msgDiv.innerHTML = `<span style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Film saved successfully!</span>`;
                formMovie.reset();
                await fetchMovies(); // Reload cached home grid
                loadAdminPortalData(); // Reload stats & movie listing selects
            } else {
                const data = await response.json();
                msgDiv.innerText = data.message || 'Saving movie failed.';
            }
        } catch (error) {
            console.error('Admin add movie error:', error);
            msgDiv.innerText = 'Connection lost.';
        }
    });

    // Form Add Showtime Submit
    const formShowtime = document.getElementById('form-admin-showtime');
    formShowtime.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const movieId = document.getElementById('admin-showtime-movie').value;
        const screenName = document.getElementById('admin-showtime-screen').value.trim();
        const ticketPrice = parseFloat(document.getElementById('admin-showtime-price').value);
        const showDate = document.getElementById('admin-showtime-date').value;
        const showTime = document.getElementById('admin-showtime-time').value; // e.g. "15:30"
        const msgDiv = document.getElementById('admin-showtime-msg');

        msgDiv.innerText = '';

        // format showtime to strictly hh:mm:ss if it's just hh:mm
        let formattedTime = showTime;
        if (showTime.split(':').length === 2) {
            formattedTime = `${showTime}:00`;
        }

        try {
            const response = await fetch(API.showtimes, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    movieId, screenName, ticketPrice, showDate, showTime: formattedTime
                })
            });

            if (response.ok) {
                msgDiv.innerHTML = `<span style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Showtime session published!</span>`;
                formShowtime.reset();
                loadAdminPortalData(); // Reload statistics
            } else {
                const data = await response.json();
                msgDiv.innerText = data.message || 'Publishing showtime failed.';
            }
        } catch (error) {
            console.error('Admin add showtime error:', error);
            msgDiv.innerText = 'Connection error.';
        }
    });
}

async function loadAdminPortalData() {
    if (!state.user || state.user.role !== 'ADMIN') return;

    // Load statistics counts
    // 1. Movies count
    document.getElementById('stat-movies-count').innerText = state.movies.length;

    // Populate Add Showtime Movie Select dropdown
    const selectDropdown = document.getElementById('admin-showtime-movie');
    selectDropdown.innerHTML = '<option value="">-- Choose Listed Film --</option>';
    state.movies.forEach(movie => {
        const option = document.createElement('option');
        option.value = movie.id;
        option.innerText = `${movie.title} (${movie.language})`;
        selectDropdown.appendChild(option);
    });

    // 2. Fetch Showtimes count
    try {
        const showsResponse = await fetch(API.showtimes);
        if (showsResponse.ok) {
            const showtimes = await showsResponse.json();
            document.getElementById('stat-shows-count').innerText = showtimes.length;
        }
    } catch (e) {
        console.error('Admin stats showtimes error:', e);
    }

    // 3. Fetch bookings transactions table & sum revenue
    try {
        const bookingsResponse = await fetch(API.bookings);
        if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            
            // Calculate Total Revenue from CONFIRMED bookings only
            const revenueTotal = bookings.filter(b => b.status === 'CONFIRMED')
                .reduce((acc, curr) => acc + curr.totalAmount, 0.0);
            
            document.getElementById('stat-revenue').innerText = `₹${revenueTotal.toFixed(0)}`;

            // Populate Admin bookings panel table
            renderAdminBookingsTable(bookings);
        }
    } catch (e) {
        console.error('Admin stats bookings error:', e);
    }
}

function renderAdminBookingsTable(bookingsList) {
    const tbody = document.getElementById('admin-bookings-table-body');
    tbody.innerHTML = '';

    if (bookingsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No booking transactions logged in the system.</td></tr>`;
        return;
    }

    bookingsList.forEach(booking => {
        const tr = document.createElement('tr');
        
        const isConfirmed = booking.status === 'CONFIRMED';
        
        tr.innerHTML = `
            <td class="ref-num">${booking.bookingNumber}</td>
            <td style="font-weight: 600;">${booking.showtime.movie.title}</td>
            <td>${booking.user.name}<br><small style="color: var(--text-muted);">${booking.user.email}</small></td>
            <td style="color: var(--text-gold); font-weight: 600;">${booking.seats}</td>
            <td>${booking.showtime.screenName}<br><small>${formatShowDateHeader(booking.showtime.showDate)} &bull; ${formatTimeString(booking.showtime.showTime)}</small></td>
            <td style="font-weight: 700;">₹${booking.totalAmount.toFixed(0)}</td>
            <td><span class="status-badge ${booking.status.toLowerCase()}" style="padding: 3px 8px; font-size: 10px;">${booking.status}</span></td>
            <td>
                ${isConfirmed ? `
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2);" onclick="adminCancelBookingSession(${booking.id})">
                        <i class="fa-solid fa-ban"></i> Cancel
                    </button>
                ` : '<span style="color: var(--text-muted); font-size: 12px;">N/A</span>'}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Global scope administrative helper for cancel triggers from tabular templates
window.adminCancelBookingSession = async (bookingId) => {
    if (!confirm('ADMIN TRACE: Are you sure you want to FORCE CANCEL this customer booking session? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API.bookings}/${bookingId}/cancel`, { method: 'POST' });
        if (response.ok) {
            alert('Booking force cancelled successfully.');
            loadAdminPortalData(); // Reload administrative logs & revenue sums
        } else {
            const data = await response.json();
            alert(data.message || 'Forced cancellation failed.');
        }
    } catch (e) {
        console.error('Admin cancel post error:', e);
        alert('Connection error.');
    }
};

// ==========================================================================
// STRING & DATE UTILITIES
// ==========================================================================
function formatShowDateHeader(dateString) {
    // Expects date string format "YYYY-MM-DD"
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const showDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    
    // Reset hours to compare calendar days directly
    today.setHours(0,0,0,0);
    showDate.setHours(0,0,0,0);

    const diffTime = showDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';

    // Standard long format "Thu, May 28"
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return showDate.toLocaleDateString('en-US', options);
}

function formatDateString(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
}

function formatTimeString(timeString) {
    // Expects time format "HH:MM" or "HH:MM:SS"
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hours should be mapped to 12
    
    return `${hours}:${minutes} ${ampm}`;
}
