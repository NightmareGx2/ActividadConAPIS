const cryptoTableBody = document.getElementById('crypto-table-body');
const trendingList = document.getElementById('trending-list');
const globalMarketCap = document.getElementById('global-market-cap');
const globalVolume = document.getElementById('global-volume');
const btcDominance = document.getElementById('btc-dominance');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const pagination = document.getElementById('pagination');
const loader = document.querySelector('.loader');
const errorMessage = document.querySelector('.error-message');
const cryptoAmount = document.getElementById('crypto-amount');
const cryptoSelect = document.getElementById('crypto-select');
const fiatAmount = document.getElementById('fiat-amount');
const fiatSelect = document.getElementById('fiat-select');
const exchangeRate = document.getElementById('exchange-rate');

const API_BASE_URL = 'https://api.coingecko.com/api/v3';
const PER_PAGE = 15;
let currentPage = 1;
let sortBy = 'market_cap_rank';
let sortOrder = 'asc';
let cryptoData = [];

window.addEventListener('DOMContentLoaded', () => {
    fetchGlobalData();
    fetchCryptoData();
    fetchTrendingCoins();
    updateConversion();
});

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const sortKey = th.getAttribute('data-sort');
        handleSort(sortKey);
    });
});

cryptoAmount.addEventListener('input', updateConversion);
cryptoSelect.addEventListener('change', updateConversion);
fiatSelect.addEventListener('change', updateConversion);

function showLoader() {
    loader.style.display = 'block';
    cryptoTableBody.innerHTML = '';
    errorMessage.style.display = 'none';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showError() {
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function formatCurrency(value, currency = 'USD', maximumFractionDigits = 2) {
    if (value === null || value === undefined) return '-';
    
    if (value < 0.01) maximumFractionDigits = 8;
    else if (value < 1) maximumFractionDigits = 4;
    
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: maximumFractionDigits
    }).format(value);
}

function formatNumber(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES').format(value);
}

function formatPercentage(value) {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2) + '%';
}

async function fetchGlobalData() {
    try {
        const response = await fetch(`${API_BASE_URL}/global`);
        if (!response.ok) throw new Error('Error al obtener datos globales');
        
        const data = await response.json();
        const totalMarketCap = data.data.total_market_cap.usd;
        const totalVolume = data.data.total_volume.usd;
        const btcPercentage = data.data.market_cap_percentage.btc;
        
        globalMarketCap.textContent = '$' + formatNumber(totalMarketCap);
        globalVolume.textContent = '$' + formatNumber(totalVolume);
        btcDominance.textContent = btcPercentage.toFixed(1) + '%';
    } catch (error) {
        console.error('Error al obtener datos globales:', error);
    }
}

async function fetchCryptoData() {
    showLoader();
    
    try {
        const response = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${currentPage}&sparkline=false&price_change_percentage=24h`);
        if (!response.ok) throw new Error('Error al obtener datos de criptomonedas');
        
        const data = await response.json();
        cryptoData = data;
        displayCryptoData(data);
        updatePagination();
        hideLoader();
        hideError();
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

async function fetchTrendingCoins() {
    try {
        const response = await fetch(`${API_BASE_URL}/search/trending`);
        if (!response.ok) throw new Error('Error al obtener tendencias');
        
        const data = await response.json();
        displayTrendingCoins(data.coins.slice(0, 5));
    } catch (error) {
        console.error('Error al obtener tendencias:', error);
    }
}

function displayCryptoData(data) {
    cryptoTableBody.innerHTML = '';
    
    if (sortBy && sortOrder) {
        data.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];
            
            if (valueA === null) valueA = sortOrder === 'asc' ? Infinity : -Infinity;
            if (valueB === null) valueB = sortOrder === 'asc' ? Infinity : -Infinity;
            
            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    data.forEach(coin => {
        const row = document.createElement('tr');
        
        const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const priceChangePrefix = coin.price_change_percentage_24h >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td>${coin.market_cap_rank || '-'}</td>
            <td>
                <div class="crypto-name">
                    <img src="${coin.image}" alt="${coin.name}" class="crypto-image">
                    <span>${coin.name} <span class="symbol">${coin.symbol.toUpperCase()}</span></span>
                </div>
            </td>
            <td>${formatCurrency(coin.current_price)}</td>
            <td class="${priceChangeClass}">${priceChangePrefix}${formatPercentage(coin.price_change_percentage_24h)}</td>
            <td>${formatCurrency(coin.market_cap)}</td>
            <td>${formatCurrency(coin.total_volume)}</td>
        `;
        
        cryptoTableBody.appendChild(row);
    });
}

function displayTrendingCoins(coins) {
    trendingList.innerHTML = '';
    
    coins.forEach(coin => {
        const trendItem = document.createElement('div');
        trendItem.className = 'trend-item';
        
        trendItem.innerHTML = `
            <div class="trend-name">
                <img src="${coin.item.small}" alt="${coin.item.name}" class="trend-icon">
                <span>${coin.item.name} <span class="symbol">${coin.item.symbol}</span></span>
            </div>
            <div class="trend-rank">#${coin.item.market_cap_rank || '-'}</div>
        `;
        
        trendingList.appendChild(trendItem);
    });
}

function updatePagination() {
    pagination.innerHTML = '';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn';
    prevButton.innerHTML = '&lt;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchCryptoData();
        }
    });
    pagination.appendChild(prevButton);
    
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(currentPage + 2, 10); i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchCryptoData();
        });
        pagination.appendChild(pageButton);
    }
    
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn';
    nextButton.innerHTML = '&gt;';
    nextButton.addEventListener('click', () => {
        currentPage++;
        fetchCryptoData();
    });
    pagination.appendChild(nextButton);
}

function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        fetchCryptoData();
        return;
    }
    
    const filteredData = cryptoData.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm) || 
        coin.symbol.toLowerCase().includes(searchTerm)
    );
    
    if (filteredData.length > 0) {
        displayCryptoData(filteredData);
        hideError();
    } else {
        fetchCoinBySearch(searchTerm);
    }
}

async function fetchCoinBySearch(query) {
    showLoader();
    
    try {
        const response = await fetch(`${API_BASE_URL}/search?query=${query}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const data = await response.json();
        
        if (data.coins && data.coins.length > 0) {
            const coinIds = data.coins.slice(0, 10).map(coin => coin.id).join(',');
            
            const detailResponse = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`);
            if (!detailResponse.ok) throw new Error('Error al obtener detalles');
            
            const detailData = await detailResponse.json();
            
            if (detailData.length > 0) {
                cryptoData = detailData;
                displayCryptoData(detailData);
                hideError();
            } else {
                cryptoTableBody.innerHTML = '';
                showError();
            }
        } else {
            cryptoTableBody.innerHTML = '';
            showError();
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

function handleSort(key) {
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    const currentTh = document.querySelector(`th[data-sort="${key}"]`);
    
    if (sortBy === key) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy = key;
        sortOrder = 'asc';
    }
    
    currentTh.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
    
    displayCryptoData(cryptoData);
}

async function updateConversion() {
    const cryptoId = cryptoSelect.value;
    const fiatCurrency = fiatSelect.value;
    const amount = parseFloat(cryptoAmount.value) || 1;
    
    try {
        const response = await fetch(`${API_BASE_URL}/simple/price?ids=${cryptoId}&vs_currencies=${fiatCurrency}`);
        if (!response.ok) throw new Error('Error en la conversión');
        
        const data = await response.json();
        
        if (data[cryptoId] && data[cryptoId][fiatCurrency]) {
            const rate = data[cryptoId][fiatCurrency];
            const convertedAmount = amount * rate;
            
            fiatAmount.value = convertedAmount.toFixed(2);
            
            const cryptoSymbol = cryptoSelect.options[cryptoSelect.selectedIndex].text;
            const fiatSymbol = fiatSelect.options[fiatSelect.selectedIndex].text;
            
            exchangeRate.textContent = `${formatCurrency(rate, fiatCurrency)} ${fiatSymbol}`;
        }
    } catch (error) {
        console.error('Error de conversión:', error);
    }
}