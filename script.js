const tg = window.Telegram.WebApp;
tg.expand();

// === БАЗА ДАННЫХ ИГР ===
// chance: Вес вероятности. Чем больше число, тем чаще падает.
const ITEMS_DB = [
    { id: 'indie', name: "Indie Trash", img: "https://cdn-icons-png.flaticon.com/512/5260/5260498.png", price: 50, type: "common", chance: 70 },
    { id: 'skin', name: "CS Skin (Blue)", img: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2D1SulQ8sOuR9N2t2wK2_RA6NW2icY6WclQ8YAzT-Fa6lOa818W8vZzMz3Fk7yQ8pSGK21Wd2_0/360fx360f", price: 150, type: "common", chance: 60 },
    { id: 'mc', name: "Minecraft Key", img: "https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png", price: 800, type: "rare", chance: 20 },
    { id: 'gta', name: "GTA V Premium", img: "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png", price: 1500, type: "rare", chance: 15 },
    { id: 'er', name: "Elden Ring", img: "https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png", price: 3000, type: "legendary", chance: 3 },
    { id: 'cp', name: "Cyberpunk 2077", img: "https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg", price: 2500, type: "legendary", chance: 3 }
];

// === НАСТРОЙКИ КЕЙСОВ ===
// У нас будет 4 кейса. 1 наш + 3 заглушки (или клоны)
const CASES = [
    { id: 1, name: "CYBERPUNK CASE", price: 1000, img: "img/cuberpunkcase.png" }, // Твоя картинка
    { id: 2, name: "BOMZH CASE", price: 100, img: "https://cdn-icons-png.flaticon.com/512/9331/9331566.png" },
    { id: 3, name: "GOLD CASE", price: 5000, img: "https://cdn-icons-png.flaticon.com/512/9331/9331620.png" },
    { id: 4, name: "RANDOM CASE", price: 500, img: "https://cdn-icons-png.flaticon.com/512/6516/6516862.png" }
];

// Глобальные переменные
let userBalance = 5000;
let currentCase = null;
let currentPrize = null;

// Элементы
const screens = {
    menu: document.getElementById('menuScreen'),
    game: document.getElementById('gameScreen')
};
const balanceEl = document.getElementById('balance');
const casesGrid = document.getElementById('casesGrid');
const track = document.getElementById('track');

// --- 1. ИНИЦИАЛИЗАЦИЯ МЕНЮ ---
function initMenu() {
    casesGrid.innerHTML = '';
    CASES.forEach(c => {
        const div = document.createElement('div');
        div.className = 'case-card';
        div.onclick = () => openGameScreen(c);
        div.innerHTML = `
            <img src="${c.img}" alt="case">
            <div class="case-title">${c.name}</div>
            <div class="case-price">${c.price} 💰</div>
        `;
        casesGrid.appendChild(div);
    });
}

function openGameScreen(caseData) {
    currentCase = caseData;
    
    // Скрываем меню, показываем игру
    screens.menu.classList.add('hidden');
    screens.game.classList.remove('hidden');
    document.getElementById('backBtn').classList.remove('hidden');

    // Заполняем данными
    document.getElementById('currentCaseImg').src = caseData.img;
    document.getElementById('currentCaseName').innerText = caseData.name;
    document.getElementById('currentCasePrice').innerText = caseData.price;
    
    // Очищаем рулетку
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = '<div style="color:#555; width:100%; text-align:center; padding-top:40px;">Нажми ОТКРЫТЬ</div>';
}

document.getElementById('backBtn').onclick = () => {
    screens.game.classList.add('hidden');
    screens.menu.classList.remove('hidden');
    document.getElementById('backBtn').classList.add('hidden');
};

// --- 2. ЛОГИКА РАНДОМА (ВЕСА) ---
function getRandomItem() {
    // Суммируем все шансы
    const totalChance = ITEMS_DB.reduce((acc, item) => acc + item.chance, 0);
    let random = Math.random() * totalChance;
    
    for (let item of ITEMS_DB) {
        if (random < item.chance) {
            return item;
        }
        random -= item.chance;
    }
    return ITEMS_DB[0]; // На всякий случай
}

// --- 3. ВРАЩЕНИЕ ---
const spinBtn = document.getElementById('spinBtn');

spinBtn.onclick = () => {
    if (userBalance < currentCase.price) {
        tg.showAlert("Не хватает денег!");
        return;
    }

    userBalance -= currentCase.price;
    balanceEl.innerText = userBalance;
    spinBtn.disabled = true;
    spinBtn.innerText = "КРУТИМ...";

    // Генерация ленты
    const CARD_WIDTH = 108; // 100px width + 8px margin
    const totalCards = 60;
    const winnerIndex = 50; // Победитель далеко в конце (чтобы дольше крутилось)
    
    // Определяем победителя заранее по умному рандому
    const winnerItem = getRandomItem();
    currentPrize = winnerItem;

    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';

    for (let i = 0; i < totalCards; i++) {
        let item;
        
        // Магия "БАЙТА": 
        // Если карта рядом с победителем (соседняя справа),
        // и победитель - дешёвка, то с шансом 50% ставим туда ЛЕГЕНДАРКУ.
        // Это создаст эффект "Блин, почти Киберпанк!"
        if (i === winnerIndex + 1 && winnerItem.type !== 'legendary' && Math.random() > 0.5) {
            // Ищем легендарку в базе
            item = ITEMS_DB.find(x => x.type === 'legendary'); 
        } 
        else if (i === winnerIndex) {
            item = winnerItem;
        } 
        else {
            item = getRandomItem();
        }
        
        // Создаем HTML карты
        const card = document.createElement('div');
        card.className = `card ${item.type}`;
        card.innerHTML = `<img src="${item.img}">`;
        track.appendChild(card);
    }

    // Задержка перед стартом анимации
    setTimeout(() => {
        // Увеличиваем время до 8 секунд и меняем кривую на "slow ending"
        track.style.transition = "transform 8s cubic-bezier(0.1, 1, 0.3, 1)";
        
        // Рандомный сдвиг внутри карточки (чтобы стрелка не всегда была ровно по центру)
        const randomOffset = Math.floor(Math.random() * 60) - 30; // +/- 30 пикселей

        const centerScreen = track.parentElement.offsetWidth / 2;
        const centerWinner = (winnerIndex * CARD_WIDTH) + (CARD_WIDTH / 2);
        const scrollAmount = -(centerWinner - centerScreen + randomOffset);

        track.style.transform = `translateX(${scrollAmount}px)`;
        
        // Вибрация
        tg.HapticFeedback.impactOccurred('heavy');

    }, 100);

    // Финиш
    setTimeout(() => {
        showModal();
        spinBtn.disabled = false;
        spinBtn.innerText = "ОТКРЫТЬ ЕЩЕ";
        tg.HapticFeedback.notificationOccurred('success');
    }, 8000); // 8 секунд ждем
};


// --- МОДАЛКА ---
const modal = document.getElementById('modal');

function showModal() {
    document.getElementById('winImage').src = currentPrize.img;
    document.getElementById('winName').innerText = currentPrize.name;
    document.getElementById('winPrice').innerText = currentPrize.price;
    modal.classList.remove('hidden');
}

document.getElementById('btnSell').onclick = () => {
    userBalance += currentPrize.price;
    balanceEl.innerText = userBalance;
    modal.classList.add('hidden');
    tg.showAlert(`Продано за ${currentPrize.price}!`);
};

document.getElementById('btnKeep').onclick = () => {
    modal.classList.add('hidden');
    tg.showAlert("Предмет добавлен в инвентарь");
};

// Запуск при старте
initMenu();