
/* ==========================================
   Hollywood Movie Data Dashboard
   Week 4 - Using Data
========================================== */

// CSV file
const csvFile = "HollywoodsMostProfitableStories.csv";

// Global variables
let allMovies = [];
let filteredMovies = [];
let currentPage = 1;
const rowsPerPage = 10;
let profitChart = null;

// Load CSV data
Papa.parse(csvFile, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {

        // Clean column names and text values
        allMovies = results.data.map(row => {
            const movie = {};

            Object.keys(row).forEach(key => {
                const cleanKey = key.trim();
                const value = row[key];

                movie[cleanKey] =
                    typeof value === "string"
                        ? value.trim()
                        : value;
            });

            return movie;
        }).filter(movie => movie.Film);

        // Start dashboard
        updateStatistics();
        createChart();
        setupGenreFilter();
        applyFilters();
    },

    error: function(error) {
        console.error("Error loading CSV:", error);

        document.getElementById("tableInfo").textContent =
            "Unable to load movie data. Please use Live Server.";
    }
});


/* ==========================================
   1. Helper Function
========================================== */

function getNumber(value) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return NaN;
    }

    return Number(
        String(value).replace(/[$,%]/g, "").trim()
    );
}


/* ==========================================
   2. Statistics Cards
========================================== */

function updateStatistics() {

    // Total number of movies
    document.getElementById("totalMovies").textContent =
        allMovies.length.toLocaleString();

    // Movies with valid profitability values
    const validMovies = allMovies.filter(movie =>
        Number.isFinite(getNumber(movie.Profitability))
    );

    if (validMovies.length > 0) {

        // Highest profitability
        const highest = validMovies.reduce((a, b) =>
            getNumber(a.Profitability) >
            getNumber(b.Profitability) ? a : b
        );

        document.getElementById("highestProfit").textContent =
            getNumber(highest.Profitability).toFixed(2);

        document.getElementById("highestMovie").textContent =
            highest.Film;

        // Average profitability
        const total = validMovies.reduce((sum, movie) =>
            sum + getNumber(movie.Profitability), 0
        );

        const average = total / validMovies.length;

        document.getElementById("averageProfit").textContent =
            average.toFixed(2);
    }

    // Most common genre
    const genreCounts = {};

    allMovies.forEach(movie => {

        const genre = movie.Genre;

        if (genre) {
            genreCounts[genre] =
                (genreCounts[genre] || 0) + 1;
        }
    });

    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1]);

    if (sortedGenres.length > 0) {
        document.getElementById("commonGenre").textContent =
            sortedGenres[0][0];
    }
}


/* ==========================================
   3. Top 10 Profitability Chart
========================================== */

function createChart() {

    // Find movies with valid profitability
    const validMovies = allMovies
        .filter(movie =>
            Number.isFinite(getNumber(movie.Profitability))
        )
        .sort((a, b) =>
            getNumber(b.Profitability) -
            getNumber(a.Profitability)
        );

    // Select top 10
    const top10 = validMovies.slice(0, 10);

    const filmNames = top10.map(movie => movie.Film);

    const profitValues = top10.map(movie =>
        getNumber(movie.Profitability)
    );

    const ctx = document.getElementById("profitChart");

    if (profitChart) {
        profitChart.destroy();
    }

    profitChart = new Chart(ctx, {

        type: "bar",

        data: {
            labels: filmNames,

            datasets: [{
                label: "Profitability",
                data: profitValues,

                backgroundColor: "#8fb4df",
                hoverBackgroundColor: "#628fc4",

                borderRadius: 4,
                borderSkipped: false,

                barPercentage: 0.7,
                categoryPercentage: 0.85
            }]
        },

        options: {

            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "Profitability: " +
                                context.parsed.x.toFixed(2);
                        }
                    }
                }
            },

            scales: {

                x: {
                    beginAtZero: true,

                    grid: {
                        color: "#edf0f4"
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#718096",
                        font: {
                            size: 12
                        }
                    },

                    title: {
                        display: true,
                        text: "Profitability",
                        color: "#718096"
                    }
                },

                y: {
                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#445166",
                        font: {
                            size: 12
                        },
                        autoSkip: false
                    }
                }
            }
        }
    });
}


/* ==========================================
   4. Genre Filter
========================================== */

function setupGenreFilter() {

    const genreFilter =
        document.getElementById("genreFilter");

    const genres = [...new Set(
        allMovies
            .map(movie => movie.Genre)
            .filter(Boolean)
    )].sort();

    genres.forEach(genre => {

        const option = document.createElement("option");

        option.value = genre;
        option.textContent = genre;

        genreFilter.appendChild(option);
    });
}


/* ==========================================
   5. Search, Filter and Sort
========================================== */

function applyFilters() {

    const searchText =
        document.getElementById("searchInput")
            .value.toLowerCase().trim();

    const selectedGenre =
        document.getElementById("genreFilter").value;

    const sortType =
        document.getElementById("sortSelect").value;

    // Search and genre filter
    filteredMovies = allMovies.filter(movie => {

        const matchesSearch =
            movie.Film.toLowerCase().includes(searchText);

        const matchesGenre =
            selectedGenre === "all" ||
            movie.Genre === selectedGenre;

        return matchesSearch && matchesGenre;
    });

    // Sort data
    filteredMovies.sort((a, b) => {

        const profitA = getNumber(a.Profitability);
        const profitB = getNumber(b.Profitability);

        const yearA = getNumber(a.Year);
        const yearB = getNumber(b.Year);

        if (sortType === "profitDesc") {
            return compareNumbers(profitA, profitB, false);
        }

        if (sortType === "profitAsc") {
            return compareNumbers(profitA, profitB, true);
        }

        if (sortType === "yearDesc") {
            return compareNumbers(yearA, yearB, false);
        }

        if (sortType === "yearAsc") {
            return compareNumbers(yearA, yearB, true);
        }

        if (sortType === "filmAsc") {
            return a.Film.localeCompare(b.Film);
        }

        return 0;
    });

    currentPage = 1;

    renderTable();
}


// Keep missing values at the end
function compareNumbers(a, b, ascending) {

    if (!Number.isFinite(a)) return 1;
    if (!Number.isFinite(b)) return -1;

    return ascending ? a - b : b - a;
}


/* ==========================================
   6. Render Data Table
========================================== */

function renderTable() {

    const tableHead =
        document.querySelector("#movieTable thead");

    const tableBody =
        document.querySelector("#movieTable tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Use the original CSV columns
    const headers = [
        "Film",
        "Genre",
        "Lead Studio",
        "Audience score %",
        "Profitability",
        "Rotten Tomatoes %",
        "Worldwide Gross",
        "Year"
    ];

    // Create table headings
    const headerRow = document.createElement("tr");

    const numberHeading = document.createElement("th");
    numberHeading.textContent = "#";
    headerRow.appendChild(numberHeading);

    headers.forEach(header => {

        const th = document.createElement("th");
        th.textContent = header;

        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);

    // Pagination
    const startIndex = (currentPage - 1) * rowsPerPage;

    const endIndex = startIndex + rowsPerPage;

    const pageMovies =
        filteredMovies.slice(startIndex, endIndex);

    // Create movie rows
    pageMovies.forEach((movie, index) => {

        const row = document.createElement("tr");

        // Row number
        const numberCell = document.createElement("td");
        numberCell.textContent = startIndex + index + 1;
        row.appendChild(numberCell);

        // Movie information
        headers.forEach(header => {

            const cell = document.createElement("td");

            cell.textContent = movie[header] ?? "";

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    if (pageMovies.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = headers.length + 1;
        cell.textContent = "No movies found.";
        cell.style.textAlign = "center";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    updatePagination();
}


/* ==========================================
   7. Pagination
========================================== */

function updatePagination() {

    const totalMovies = filteredMovies.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalMovies / rowsPerPage)
    );

    const start = totalMovies === 0
        ? 0
        : (currentPage - 1) * rowsPerPage + 1;

    const end = Math.min(
        currentPage * rowsPerPage,
        totalMovies
    );

    // Table information
    document.getElementById("tableInfo").textContent =
        `Showing ${start} to ${end} of ${totalMovies} movies`;

    // Page number
    document.getElementById("pageInfo").textContent =
        `${currentPage} / ${totalPages}`;

    // Disable buttons when needed
    document.getElementById("prevPage").disabled =
        currentPage === 1;

    document.getElementById("nextPage").disabled =
        currentPage >= totalPages;
}


/* ==========================================
   8. Event Listeners
========================================== */

// Search
document.getElementById("searchInput")
    .addEventListener("input", applyFilters);

// Genre filter
document.getElementById("genreFilter")
    .addEventListener("change", applyFilters);

// Sort
document.getElementById("sortSelect")
    .addEventListener("change", applyFilters);

// Previous page
document.getElementById("prevPage")
    .addEventListener("click", function() {

        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

// Next page
document.getElementById("nextPage")
    .addEventListener("click", function() {

        const totalPages = Math.ceil(
            filteredMovies.length / rowsPerPage
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
