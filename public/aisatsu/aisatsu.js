        // Game data
        const gameData = [
            { id: 1, image:'https://ucarecdn.com/061577d2-8a9a-4fc7-8181-dfd74ca92d5f/AISATSUGAMBAR_page0001.jpg', word:'https://ucarecdn.com/06b5db4f-f7c1-470b-b226-ddff0d09ca10/AISATSUKOSAKATA_page0001.jpg'  },
            { id: 2, image:'https://ucarecdn.com/550c1021-1661-4826-a789-021099597a38/AISATSUGAMBAR_page0003.jpg', word:'https://ucarecdn.com/4eb6fb4b-d3d4-4bb3-a00b-f011fec5d6b3/AISATSUKOSAKATA_page0003.jpg'  },
            { id: 3, image:'https://ucarecdn.com/876c93cf-7e92-4b0b-ade1-c156f31f06c2/AISATSUGAMBAR_page0002.jpg', word:'https://ucarecdn.com/aa93e7b1-896b-42d0-98d6-cac977ab22a0/AISATSUKOSAKATA_page0002.jpg'  },
            { id: 4, image:'https://ucarecdn.com/a78e4f5c-24e0-4ab2-afbb-62dee01e63bc/AISATSUGAMBAR_page0004.jpg', word:'https://ucarecdn.com/cc9febb4-9b14-4616-9516-3704a193bfc0/AISATSUKOSAKATA_page0004.jpg'  },
            { id: 5, image:'https://ucarecdn.com/bfe4dbda-1e43-4cbf-b474-2c03df7f849d/AISATSUGAMBAR_page0005.jpg', word:'https://ucarecdn.com/3f82836b-d20d-4279-bd4f-2539241bdf54/AISATSUKOSAKATA_page0005.jpg'  },
            { id: 6, image:'https://ucarecdn.com/b4560fde-4c5f-460a-bcea-806a3ebfe6fb/AISATSUGAMBAR_page0011.jpg', word:'https://ucarecdn.com/649abcd5-1f12-4bbb-b464-66e83fbe3980/AISATSUKOSAKATA_page0011.jpg'  },
            { id: 7, image:'https://ucarecdn.com/c1711a04-89b5-4df2-97d9-19ac0318ee8a/AISATSUGAMBAR_page0010.jpg', word:'https://ucarecdn.com/7683bb42-0592-46a0-a4f3-3fab35539e84/AISATSUKOSAKATA_page0010.jpg'  },
            { id: 8, image:'https://ucarecdn.com/41cddd88-951f-4a80-9bed-2bb50254ad23/AISATSUGAMBAR_page0008.jpg', word:'https://ucarecdn.com/b331b9dd-eb39-403c-900d-d49dccfe2de9/AISATSUKOSAKATA_page0008.jpg'  },
            { id: 9, image:'https://ucarecdn.com/839b3813-5ed2-40e3-9b3a-6a84d4884201/AISATSUGAMBAR_page0009.jpg', word:'https://ucarecdn.com/b7667a9a-44f4-4db5-b50b-568dace32f60/AISATSUKOSAKATA_page0009.jpg'  },
            { id: 10, image:'https://ucarecdn.com/9d676345-bcff-46ec-8c26-e24eb5a01013/AISATSUGAMBAR_page0007.jpg', word:'https://ucarecdn.com/1ca8d0a6-73b8-4f8b-b9a2-c45021d80519/AISATSUKOSAKATA_page0007.jpg'  },
            { id: 11, image:'https://ucarecdn.com/fd966cb0-cd37-49d6-b0c0-a035f737c73b/AISATSUGAMBAR_page0006.jpg', word:'https://ucarecdn.com/c5a91472-0848-49ba-b207-c4a1e0e80faf/AISATSUKOSAKATA_page0006.jpg'  }
            
        ];

        // Game state
        let selectedCards = [];
        let matchedPairs = 0;
        let score = 0;
        let canSelect = true;
        let timerInterval;
        let startTime;
        let hintCount = 3;
        let currentMode = 'medium'; // Default mode
        let currentGameData = [];
        let allCards = [];

        // DOM elements
        const gameBoardContainer = document.getElementById('game-board');
        const pairsMatchedElement = document.getElementById('pairs-matched');
        const totalPairsElement = document.getElementById('total-pairs');
        const scoreElement = document.getElementById('score');
        const timerElement = document.getElementById('timer');
        const resetBtn = document.getElementById('reset-btn');
        const hintBtn = document.getElementById('hint-btn');
        const statsBtn = document.getElementById('stats-btn');
        const statsModal = document.getElementById('stats-modal');
        const closeStatsBtn = document.getElementById('close-stats');
        const clearStatsBtn = document.getElementById('clear-stats');
        const easyModeBtn = document.getElementById('easy-mode');
        const mediumModeBtn = document.getElementById('medium-mode');
        const hardModeBtn = document.getElementById('hard-mode');

        // Mode settings
        const modes = {
            easy: { pairs: 4, hintCount: 3, timeBonus: 1.5 },
            medium: { pairs: 6, hintCount: 3, timeBonus: 1.2 },
            hard: { pairs: 8, hintCount: 3, timeBonus: 1.0 }
        };

        // Initialize game
        function initGame() {
            // Reset game state
            selectedCards = [];
            matchedPairs = 0;
            score = 0;
            canSelect = true;
            stopTimer();
            
            // Set hint count based on mode
            hintCount = modes[currentMode].hintCount;
            hintBtn.innerHTML = `<i class="fas fa-lightbulb mr-2"></i>Petunjuk (${hintCount})`;
            
            // Update UI
            pairsMatchedElement.textContent = matchedPairs;
            scoreElement.textContent = score;
            timerElement.textContent = '00:00';
            
            // Clear containers
            gameBoardContainer.innerHTML = '';
            
            // Select subset of game data based on mode
            prepareGameData();
            
            // Create cards
            createCards();
            
            // Highlight active mode button
            highlightModeButton();
        }

        function prepareGameData() {
            // Shuffle the game data
            const shuffledData = [...gameData].sort(() => Math.random() - 0.5);
            
            // Take only the number of pairs needed for the current mode
            const pairsCount = Math.min(modes[currentMode].pairs, gameData.length);
            currentGameData = shuffledData.slice(0, pairsCount);
            
            // Update total pairs display
            totalPairsElement.textContent = pairsCount;
        }

        function createCards() {
            allCards = [];
            
            // Create image cards and word cards pairs
            currentGameData.forEach(item => {
                // Create image card
                const imageCard = createCard(item, 'image');
                allCards.push(imageCard);
                
                // Create word card
                const wordCard = createCard(item, 'word');
                allCards.push(wordCard);
            });
            
            // Shuffle all cards together
            shuffleArray(allCards);
            
            // Add all cards to the board
            allCards.forEach(card => gameBoardContainer.appendChild(card));
        }

       function createCard(item, type) {
    const card = document.createElement('div');
    card.className = 'card cursor-pointer transform hover:scale-105 transition-all duration-300';
    card.dataset.id = item.id;
    card.dataset.type = type;
    
    const iconClass = type === 'image' ? 
        `<i class="fas fa-image text-white text-2xl"></i>` : 
        `<i class="fas fa-image text-white text-2xl"></i>`; // Diubah dari fas fa-language menjadi fas fa-image
    
    const backContent = type === 'image' ? 
        createImageBackContent(item) : 
        createWordBackContent(item);
    
card.innerHTML = `
<div class="card-inner relative w-full h-auto aspect-[395/570] max-w-[90%] sm:max-w-[95%] mx-auto">
    <div class="card-face card-front w-full h-full">
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                ${iconClass}
            </div>
            <div class="absolute bottom-2 right-2 text-xs text-white font-medium">
                ${type === 'image' ? '画像' : '言葉'}
            </div>
        </div>
    </div>
    <div class="card-face card-back w-full h-full">
        ${backContent}
    </div>
</div>
`;

    
    card.addEventListener('click', () => handleCardClick(card));
    return card;
}

        function createImageBackContent(item) {
            return `
                <div class="flex flex-col items-center justify-center h-full p-3">
                    <img src="${item.image}" alt="${item.word}" class="card-image rounded-lg">
                </div>
            `;
        }

       function createWordBackContent(item) {
    return `
        <div class="flex flex-col items-center justify-center h-full p-3">
            <img src="${item.word}" alt="Word Image" class="card-image rounded-lg">
        </div>
    `;
}
        // Handle card click
        function handleCardClick(card) {
            if (!canSelect || card.classList.contains('matched') || card.classList.contains('flipped')) {
                return;
            }
            
            // Start timer on first click
            if (selectedCards.length === 0 && matchedPairs === 0) {
                startTimer();
            }
            
            // Flip the card
            card.classList.add('flipped');
            
            // Add to selected cards
            selectedCards.push(card);
            
            // If two cards are selected, check for match
            if (selectedCards.length === 2) {
                canSelect = false;
                checkForMatch();
            }
        }

        // Check if selected cards match
        function checkForMatch() {
            const [card1, card2] = selectedCards;
            
            // Cannot match two cards of the same type
            if (card1.dataset.type === card2.dataset.type) {
                setTimeout(() => {
                    resetCards([card1, card2]);
                    selectedCards = [];
                    canSelect = true;
                }, 1000);
                return;
            }
            
            // Check if IDs match
            if (card1.dataset.id === card2.dataset.id) {
                // Match found
                score += 20;
                scoreElement.textContent = score;
                
                matchedPairs++;
                pairsMatchedElement.textContent = matchedPairs;
                
                // Show match indicator
                card1.classList.add('matched');
                card2.classList.add('matched');
                
                // Add success animation and particles
                gsap.to([card1, card2], {
                    scale: 1.05,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to([card1, card2], {
                            scale: 1,
                            duration: 0.3
                        });
                    }
                });
                
                // Create cherry blossom particles
                createCherryBlossoms(card1);
                
                selectedCards = [];
                canSelect = true;
                
                // Check if all pairs are matched
                if (matchedPairs === currentGameData.length) {
                    gameCompleted();
                }
            } else {
                // No match
                score = Math.max(0, score - 5);
                scoreElement.textContent = score;
                
                // Add shake animation
                card1.classList.add('shake');
                card2.classList.add('shake');
                
                setTimeout(() => {
                    resetCards([card1, card2]);
                    selectedCards = [];
                    canSelect = true;
                }, 1000);
            }
        }

        // Reset cards after incorrect match
        function resetCards(cards) {
            cards.forEach(card => {
                card.classList.remove('flipped', 'shake');
            });
        }

        // Game completed
        function gameCompleted() {
            const endTime = Date.now();
            const totalTime = Math.floor((endTime - startTime) / 1000);
            const formattedTime = formatTime(totalTime);
            const timeBonus = Math.floor(100 * modes[currentMode].timeBonus * (1 - totalTime / (180))); // Max 3 minutes
            const finalScore = score + Math.max(0, timeBonus);
            
            stopTimer();
            
            // Save game stats
            saveGameStats(currentMode, finalScore, formattedTime);
            
            setTimeout(() => {
                // Create confetti effect
                createConfetti();
                
                Swal.fire({
                    title: 'Selamat!',
                    html: `
                        <div class="mb-4">
                            <p class="text-lg mb-2">Kamu berhasil menyelesaikan permainan!</p>
                            <div class="grid grid-cols-2 gap-2 text-left">
                                <div class="text-gray-600">Skor Dasar:</div>
                                <div class="font-bold">${score}</div>
                                <div class="text-gray-600">Bonus Waktu:</div>
                                <div class="font-bold">+${Math.max(0, timeBonus)}</div>
                                <div class="text-gray-600">Total Waktu:</div>
                                <div class="font-bold">${formattedTime}</div>
                                <div class="text-gray-600 font-bold">SKOR AKHIR:</div>
                                <div class="font-bold text-indigo-600">${finalScore}</div>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Main Lagi',
                    background: '#ffffff',
                    backdrop: `rgba(79, 70, 229, 0.6)`,
                    showDenyButton: true,
                    denyButtonText: 'Lihat Statistik'
                }).then((result) => {
                    if (result.isDenied) {
                        showStats();
                    } else {
                        initGame();
                    }
                });
            }, 500);
        }

        // Timer functions
        function startTimer() {
            startTime = Date.now();
            
            timerInterval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                timerElement.textContent = formatTime(elapsedTime);
            }, 1000);
        }

        function stopTimer() {
            clearInterval(timerInterval);
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
        }

        // Hint function
        function showHint() {
            if (hintCount <= 0 || matchedPairs === currentGameData.length) {
                return;
            }
            
            // Find unmatched cards
            const unmatched = allCards.filter(card => !card.classList.contains('matched'));
            
            if (unmatched.length === 0) return;
            
            // Group by ID
            const cardsByID = {};
            unmatched.forEach(card => {
                if (!cardsByID[card.dataset.id]) {
                    cardsByID[card.dataset.id] = [];
                }
                cardsByID[card.dataset.id].push(card);
            });
            
            // Find pairs where both cards are unmatched
            const fullPairs = Object.values(cardsByID).filter(pair => pair.length === 2);
            
            if (fullPairs.length === 0) return;
            
            // Pick a random pair
            const randomPair = fullPairs[Math.floor(Math.random() * fullPairs.length)];
            
            // Briefly show the cards
            randomPair.forEach(card => {
                card.classList.add('flipped');
                gsap.to(card, {
                    boxShadow: '0 0 0 3px #6366f1',
                    duration: 0.3
                });
            });
            
            setTimeout(() => {
                randomPair.forEach(card => {
                    card.classList.remove('flipped');
                    gsap.to(card, {
                        boxShadow: 'none',
                        duration: 0.3
                    });
                });
            }, 1500);
            
            // Reduce hint count
            hintCount--;
            hintBtn.innerHTML = `<i class="fas fa-lightbulb mr-2"></i>Petunjuk (${hintCount})`;
            
            // Disable button if no hints left
            if (hintCount <= 0) {
                hintBtn.classList.add('opacity-50', 'cursor-not-allowed');
                hintBtn.classList.remove('hover:bg-emerald-700');
            }
        }

        // Shuffle array (Fisher-Yates algorithm)
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // Visual effects
        function createCherryBlossoms(card) {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            for (let i = 0; i < 8; i++) {
                const blossom = document.createElement('div');
                blossom.className = 'cherry-blossom';
                document.body.appendChild(blossom);
                
                // Set position
                blossom.style.left = `${centerX}px`;
                blossom.style.top = `${centerY}px`;
                
                // Animate
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 60;
                const duration = 0.8 + Math.random() * 0.6;
                
                gsap.to(blossom, {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    rotation: Math.random() * 360,
                    opacity: 1,
                    duration: duration / 2,
                    ease: 'power1.out',
                    onComplete: () => {
                        gsap.to(blossom, {
                            opacity: 0,
                            duration: duration / 2,
                            delay: 0.2,
                            onComplete: () => {
                                blossom.remove();
                            }
                        });
                    }
                });
            }
        }

        function createConfetti() {
            const colors = ['#f472b6', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
            
            for (let i = 0; i < 100; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = `${Math.random() * 100}vw`;
                confetti.style.top = '-10px';
                document.body.appendChild(confetti);
                
                gsap.to(confetti, {
                    y: `${window.innerHeight + 20}px`,
                    x: `${(Math.random() - 0.5) * 200}px`,
                    rotation: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                    opacity: 1,
                    duration: 1.5 + Math.random() * 2,
                    delay: Math.random(),
                    ease: 'power1.out',
                    onComplete: () => confetti.remove()
                });
            }
        }

        // Stats & LocalStorage Management
       function saveGameStats(mode, score, time) {
    // Get existing stats from localStorage
    let stats = JSON.parse(localStorage.getItem('japaneseGameStats')) || { games: [] };

    // Add new game stats
    const newGame = {
        date: new Date().toISOString(),
        mode: mode,
        score: score,
        time: time
    };

    stats.games.push(newGame);

    // Update best score if needed
    if (!stats.bestScore || score > stats.bestScore) {
        stats.bestScore = score;
    }

    // Convert time string (MM:SS) to seconds
    const timeParts = time.split(':');
    const timeInSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

    // Update best time if needed
    if (!stats.bestTime || timeInSeconds < stats.bestTimeInSeconds) {
        stats.bestTime = time;
        stats.bestTimeInSeconds = timeInSeconds;
    }

    // Update total games count
    stats.totalGames = stats.games.length;

    // Save back to localStorage
    localStorage.setItem('japaneseGameStats', JSON.stringify(stats));
}

        function showStats() {
            // Get stats from localStorage
            const stats = JSON.parse(localStorage.getItem('japaneseGameStats')) || { 
                games: [],
                bestScore: 0,
                bestTime: '00:00',
                totalGames: 0
            };
            
            // Update stats display
            document.getElementById('total-games').textContent = stats.totalGames || 0;
            document.getElementById('best-score').textContent = stats.bestScore || 0;
            document.getElementById('best-time').textContent = stats.bestTime || '00:00';
            
            // Clear and populate table
            const tableBody = document.getElementById('stats-table-body');
            tableBody.innerHTML = '';
            
            // Sort games by date (newest first)
            const sortedGames = [...stats.games].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add rows to table
            sortedGames.forEach(game => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(game.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td><span class="capitalize">${game.mode}</span></td>
                    <td>${game.score}</td>
                    <td>${game.time}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Show modal
            statsModal.classList.remove('hidden');
        }

        function clearStats() {
            Swal.fire({
                title: 'Hapus Statistik?',
                text: 'Semua riwayat permainan akan dihapus. Tindakan ini tidak dapat dibatalkan!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus',
                cancelButtonText: 'Batal',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('japaneseGameStats');
                    
                    // Update UI
                    document.getElementById('total-games').textContent = 0;
                    document.getElementById('best-score').textContent = 0;
                    document.getElementById('best-time').textContent = '00:00';
                    document.getElementById('stats-table-body').innerHTML = '';
                    
                    Swal.fire(
                        'Terhapus!',
                        'Statistik permainan telah dihapus.',
                        'success'
                    );
                }
            });
        }

        function setGameMode(mode) {
            currentMode = mode;
            initGame();
        }

        function highlightModeButton() {
            // Reset all buttons
            easyModeBtn.classList.remove('font-bold', 'ring-2', 'ring-green-400');
            mediumModeBtn.classList.remove('font-bold', 'ring-2', 'ring-indigo-400');
            hardModeBtn.classList.remove('font-bold', 'ring-2', 'ring-red-400');
            
            // Highlight selected button
            if (currentMode === 'easy') {
                easyModeBtn.classList.add('font-bold', 'ring-2', 'ring-green-400');
            } else if (currentMode === 'medium') {
                mediumModeBtn.classList.add('font-bold', 'ring-2', 'ring-indigo-400');
            } else if (currentMode === 'hard') {
                hardModeBtn.classList.add('font-bold', 'ring-2', 'ring-red-400');
            }
        }

        // Event listeners
        resetBtn.addEventListener('click', initGame);
        hintBtn.addEventListener('click', showHint);
        statsBtn.addEventListener('click', showStats);
        closeStatsBtn.addEventListener('click', () => statsModal.classList.add('hidden'));
        clearStatsBtn.addEventListener('click', clearStats);
        
        easyModeBtn.addEventListener('click', () => setGameMode('easy'));
        mediumModeBtn.addEventListener('click', () => setGameMode('medium'));
        hardModeBtn.addEventListener('click', () => setGameMode('hard'));

        // Initialize game on load
        document.addEventListener('DOMContentLoaded', () => {
            // Set up background
            document.body.style.backgroundImage = `linear-gradient(135deg, rgba(238, 242, 255, 0.9), rgba(243, 232, 255, 0.9))`;
            
            initGame();
            
            // Show welcome message
            setTimeout(() => {
                Swal.fire({
                    title: 'Selamat Datang!',
                    html: `
                        <p class="mb-4">Selamat datang di Game Matching Kartu Bahasa Jepang!</p>
                        <div class="text-left mb-4">
                            <p class="mb-2"><i class="fas fa-info-circle text-indigo-500"></i> <strong>Cara Bermain:</strong></p>
                            <ul class="space-y-1 text-sm">
                                <li>• Cocokkan kartu gambar dengan kartu kata</li>
                                <li>• Semakin cepat, semakin tinggi skormu</li>
                                <li>• Gunakan petunjuk jika kamu kesulitan</li>
                            </ul>
                        </div>
                        <p class="text-xs text-gray-500">Pilih tingkat kesulitan dan mulai bermain!</p>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Mulai!',
                    background: '#ffffff',
                    backdrop: `rgba(79, 70, 229, 0.4)`
                });
            }, 500);
        });
