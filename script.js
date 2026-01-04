const tg = window.Telegram.WebApp;
tg.expand();

// Настройки
const CASE_PRICE = 1000;
const CARD_WIDTH = 110; // Ширина карточки (100px + 10px отступы)

// Данные пользователя
let userBalance = 5000;
const balanceEl = document.getElementById('balance');

// База предметов
const items = [
    { id: 1, name: "Indie Game", img: "https://cdn-icons-png.flaticon.com/512/5260/5260498.png", price: 100, type: "common" },
    { id: 2, name: "Minecraft", img: "https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png", price: 800, type: "rare" },
    { id: 3, name: "GTA V", img: "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png", price: 1500, type: "rare" },
    { id: 4, name: "Cyberpunk 2077", img: "https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg", price: 2500, type: "legendary" }
];

// Элементы
const track = document.getElementById('track');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('modal');

// Текущий выигранный предмет (чтобы можно было продать)
let currentPrize = null;

// Функция обновления баланса
function updateBalance(amount) {
    userBalance = amount;
    balanceEl.innerText = userBalance;
}

// Функция запуска
spinBtn.addEventListener('click', () => {
    if (userBalance < CASE_PRICE) {
        tg.showAlert("Недостаточно денег!");
        return;
    }

    // 1. Списываем деньги
    updateBalance(userBalance - CASE_PRICE);
    spinBtn.disabled = true;
    spinBtn.innerText = "КРУТИМ...";

    // 2. Генерируем ленту рулетки
    // Нам нужно создать много фейковых предметов, а где-то в конце - победителя
    track.innerHTML = ""; // Очищаем старое
    track.style.transition = "none"; // Убираем анимацию для сброса позиции
    track.style.transform = "translateX(0px)";

    const totalCards = 50; // Длина ленты
    const winnerIndex = 40; // На каком месте будет победитель (индекс с 0)
    
    // Выбираем победителя заранее (Рандом с весами можно добавить позже)
    // Сейчас просто случайный предмет из списка
    const winnerItem = items[Math.floor(Math.random() * items.length)];
    currentPrize = winnerItem;

    // Строим HTML
    for (let i = 0; i < totalCards; i++) {
        let item;
        if (i === winnerIndex) {
            item = winnerItem; // Вставляем победителя в нужную позицию
        } else {
            // Заполняем остальное мусором
            item = items[Math.floor(Math.random() * items.length)];
        }

        // Создаем div карточки
        const card = document.createElement('div');
        card.classList.add('card', item.type);
        card.innerHTML = `<img src="${item.img}">`;
        track.appendChild(card);
    }

    // 3. Запускаем анимацию
    // Небольшая задержка, чтобы браузер успел отрисовать карточки
    setTimeout(() => {
        track.style.transition = "transform 4s cubic-bezier(0.1, 1, 0.1, 1)"; // Включаем плавность
        
        // ВЫЧИСЛЕНИЕ СМЕЩЕНИЯ:
        // Нам нужно сдвинуть ленту влево так, чтобы winnerIndex оказался по центру экрана.
        // Ширина экрана / 2
        const centerScreen = track.parentElement.offsetWidth / 2;
        // Центр карточки победителя = (winnerIndex * ширина_карты) + (половина_карты)
        const centerWinner = (winnerIndex * CARD_WIDTH) + (CARD_WIDTH / 2);
        
        // Итоговый сдвиг (отрицательный, т.к. едем влево)
        const offset = -(centerWinner - centerScreen);

        track.style.transform = `translateX(${offset}px)`;
        
        // Вибрация в начале
        tg.HapticFeedback.impactOccurred('medium');

    }, 50);

    // 4. Когда рулетка остановится (через 4 секунды)
    setTimeout(() => {
        showWinModal(winnerItem);
        spinBtn.disabled = false;
        spinBtn.innerText = "ОТКРЫТЬ ЕЩЕ";
        tg.HapticFeedback.notificationOccurred('success');
    }, 4000);
});

function showWinModal(item) {
    document.getElementById('winImage').src = item.img;
    document.getElementById('winName').innerText = item.name;
    document.getElementById('winPrice').innerText = item.price;
    document.getElementById('sellPrice').innerText = item.price; // Цена продажи = номинал (можно сделать меньше)
    
    modal.classList.remove('hidden');
}

// Кнопка ПРОДАТЬ
document.getElementById('btnSell').addEventListener('click', () => {
    updateBalance(userBalance + currentPrize.price);
    modal.classList.add('hidden');
    tg.showAlert(`Продано за ${currentPrize.price}!`);
});

// Кнопка ЗАБРАТЬ (Пока просто закрывает окно)
document.getElementById('btnKeep').addEventListener('click', () => {
    modal.classList.add('hidden');
    // Тут можно показать ключ
    tg.showAlert("Ключ сохранен в инвентарь (пока нет)");
});