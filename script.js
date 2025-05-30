console.log('Script loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded!');

    // Authentication check
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

  // Elements
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const entryTitle = document.getElementById('entryTitle');
  const journalEntry = document.getElementById('journalEntry');
  const moodSelect = document.getElementById('moodSelect');
    const categorySelect = document.getElementById('categorySelect');
  const entryList = document.getElementById('entryList');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const dateFilter = document.getElementById('dateFilter');
    const wordCount = document.getElementById('wordCount');

    // Initialize
    renderEntries();
    updateStatistics();
    renderCalendar();
    updateGoals();

  // Add this right after your element declarations (around line 20) and before the initialization
  function filterEntries(entries, filters = {}) {
    const {
        searchTerm = '',
        category = '',
        date = '',
        mood = ''
    } = filters;

    return entries.filter(entry => {
        // Search term filter (matches title or content)
        const matchesSearch = !searchTerm || 
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Category filter
        const matchesCategory = !category || entry.category === category;
        
        // Date filter
        const matchesDate = !date || entry.date.startsWith(date);
        
        // Mood filter
        const matchesMood = !mood || entry.mood === mood;
        
        return matchesSearch && matchesCategory && matchesDate && matchesMood;
    });
  }

  // Save entry
  function saveEntry() {
    const title = entryTitle.value.trim();
        const content = journalEntry.innerHTML.trim();
    const mood = moodSelect.value;
        const category = categorySelect.value;

    if (!title || !content) {
      alert('Please fill in both title and journal entry.');
      return;
    }

    const date = new Date().toISOString();
        const currentUser = localStorage.getItem('currentUser');
        let entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');

        entries.push({
            title,
            content,
            mood,
            category,
            date
        });

        

        localStorage.setItem(`journalEntries_${currentUser}`, JSON.stringify(entries));

        // Clear form
    entryTitle.value = '';
        journalEntry.innerHTML = '';
    moodSelect.value = '😊';
        categorySelect.value = 'personal';
        updateWordCount();

        // Update displays
        renderEntries();
        updateStatistics();
        renderCalendar();
        updateGoals();

        // Text Formatting
        const formatBtns = document.querySelectorAll('.format-btn');
        const fontSizeSelect = document.getElementById('fontSize');
        const fontColorInput = document.getElementById('fontColor');

        // Format buttons
        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                document.execCommand(format, false, null);
                journalEntry.focus();
                btn.classList.toggle('active');
            });
        });

        // Font size
        fontSizeSelect.addEventListener('change', () => {
            document.execCommand('fontSize', false, fontSizeSelect.value);
            journalEntry.focus();
        });

        // Font color
        fontColorInput.addEventListener('change', () => {
            document.execCommand('foreColor', false, fontColorInput.value);
            journalEntry.focus();
        });

        // Make the formatting toolbar sticky
        const formattingToolbar = document.querySelector('.flex.flex-wrap.gap-2.mb-2');
        if (formattingToolbar) {
            window.addEventListener('scroll', () => {
                const rect = formattingToolbar.getBoundingClientRect();
                if (rect.top < 0) {
                    formattingToolbar.classList.add('fixed', 'top-0', 'left-0', 'right-0', 'bg-white/90', 'p-2', 'z-10', 'shadow');
                    formattingToolbar.classList.remove('mb-2');
                } else {
                    formattingToolbar.classList.remove('fixed', 'top-0', 'left-0', 'right-0', 'bg-white/90', 'p-2', 'z-10', 'shadow');
                    formattingToolbar.classList.add('mb-2');
                }
            });
        }
    }

    // Replace your existing renderEntries function with this one
    function renderEntries() {
        const currentUser = localStorage.getItem('currentUser');
        const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
        
        // Sort entries by date (newest first)
        const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Get filter values
        const filters = {
            searchTerm: searchInput ? searchInput.value : '',
            category: filterCategory ? filterCategory.value : '',
            date: dateFilter ? dateFilter.value : '',
            mood: moodSelect ? moodSelect.value : ''
        };
        
        // Apply filters
        const filtered = filterEntries(sortedEntries, filters);

        // Clear and populate entry list
        if (entryList) {
    entryList.innerHTML = '';

    if (filtered.length === 0) {
                entryList.innerHTML = '<div class="text-center text-pink-400">No entries found.</div>';
      return;
    }

            filtered.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'p-4 rounded-xl bg-pink-50 hover:bg-pink-100 shadow text-pink-700 mb-4';
                
                entryElement.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex-1">
                            <h3 class="font-semibold">${entry.title}</h3>
                            <p class="text-xs text-pink-500">${new Date(entry.date).toLocaleString()}</p>
                        </div>
                        <button class="text-red-500 hover:text-red-700 px-2 py-1 rounded" onclick="deleteEntry('${entry.date}')">
                            🗑️
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 line-clamp-2">${entry.content}</div>
                    <div class="flex gap-2 mt-2 text-xs">
                        <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full">${entry.mood}</span>
                        <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full">${entry.category}</span>
                    </div>
                `;
                
                entryElement.addEventListener('click', () => openModal(entry));
                entryList.appendChild(entryElement);
            });
        }
    }

    // Delete entry
    window.deleteEntry = function(date) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const currentUser = localStorage.getItem('currentUser');
            let entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            entries = entries.filter(entry => entry.date !== date);
            localStorage.setItem(`journalEntries_${currentUser}`, JSON.stringify(entries));
            renderEntries();
            updateStatistics();
            renderCalendar();
            updateGoals();
        }
    };

    // Open modal
  function openModal(entry) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMood = document.getElementById('modalMood');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');

        if (modal && modalTitle && modalMood && modalDate && modalContent) {
    modalTitle.textContent = entry.title;
    modalMood.textContent = entry.mood;
    modalDate.textContent = new Date(entry.date).toLocaleString();
            modalContent.innerHTML = entry.content;
    modal.classList.remove('hidden');
        }
  }

  // Close modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
  closeModal.addEventListener('click', () => {
            const modal = document.getElementById('modal');
            if (modal) {
    modal.classList.add('hidden');
            }
        });
    }

    // Word count
    function updateWordCount() {
        if (journalEntry && wordCount) {
            const content = journalEntry.innerText;
            const wordCount = content.trim().split(/\s+/).length;
            document.getElementById('wordCount').textContent = `${wordCount} words`;
        }
    }

    // Statistics
    function updateStatistics() {
        const currentUser = localStorage.getItem('currentUser');
        const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
        
        // Calculate statistics
        const totalEntries = entries.length;
        const totalWords = entries.reduce((sum, entry) => {
            return sum + entry.content.split(/\s+/).length;
        }, 0);
        
        // Calculate most used category
        const categories = entries.reduce((acc, entry) => {
            acc[entry.category] = (acc[entry.category] || 0) + 1;
            return acc;
        }, {});
        
        const mostUsedCategory = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        
        // Calculate writing streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < entries.length; i++) {
            const entryDate = new Date(entries[i].date);
            entryDate.setHours(0, 0, 0, 0);
            
            if (entryDate.getTime() === today.getTime() - (i * 24 * 60 * 60 * 1000)) {
                streak++;
            } else {
                break;
            }
        }
        
        // Update UI
        document.getElementById('totalEntries').textContent = totalEntries;
        document.getElementById('totalWords').textContent = totalWords;
        document.getElementById('mostUsedTag').textContent = mostUsedCategory;
        document.getElementById('streakCount').textContent = `${streak} days`;
    }

    // Render calendar
    function renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentUser = localStorage.getItem('currentUser');
        const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
        
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Clear previous calendar
        calendar.innerHTML = '';
        
        // Add day headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-center text-sm font-semibold text-pink-600';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'w-8 h-8 flex items-center justify-center rounded-full';
            calendar.appendChild(emptyDay);
        }
        
        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-100 cursor-pointer';
            dayElement.textContent = day;
            
            // Check if day has entries
            const dayEntries = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getDate() === day && 
                       entryDate.getMonth() === today.getMonth() && 
                       entryDate.getFullYear() === today.getFullYear();
            });
            
            if (dayEntries.length > 0) {
                dayElement.classList.add('bg-pink-200');
                dayElement.addEventListener('click', () => showDayEntries(dayEntries));
            }
            
            calendar.appendChild(dayElement);
        }
    }

    // Show entries for a specific day
    function showDayEntries(entries) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-2xl relative">
                <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                <h3 class="text-2xl font-bold text-pink-600 mb-4">Entries for ${new Date(entries[0].date).toLocaleDateString()}</h3>
                <div class="space-y-4">
                    ${entries.map(entry => `
                        <div class="p-4 bg-pink-50 rounded-xl">
                            <h4 class="font-semibold text-pink-700">${entry.title}</h4>
                            <p class="text-sm text-pink-600">${entry.mood} • ${entry.category}</p>
                            <p class="mt-2 text-gray-700">${entry.content}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.tagName === 'BUTTON') {
                modal.remove();
            }
        });
    }

    // Update goals
    function updateGoals() {
        const currentUser = localStorage.getItem('currentUser');
        const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
        
        // Get today's entries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });
        
        // Update daily writing goal
        const writingProgress = (todayEntries.length / 7) * 100;
        const writingBar = document.querySelector('.goal-progress-bar');
        if (writingBar) {
            writingBar.style.width = `${writingProgress}%`;
        }
        
        // Update word count goal
        const totalWords = todayEntries.reduce((sum, entry) => {
            return sum + entry.content.split(/\s+/).length;
        }, 0);
        const wordProgress = Math.min((totalWords / 1000) * 100, 100);
        const wordBar = document.querySelectorAll('.goal-progress-bar')[1];
        if (wordBar) {
            wordBar.style.width = `${wordProgress}%`;
        }
    }

    // Event listeners
    if (saveBtn) saveBtn.addEventListener('click', saveEntry);
    if (clearBtn) clearBtn.addEventListener('click', () => {
    entryTitle.value = '';
        journalEntry.innerHTML = '';
    moodSelect.value = '😊';
        categorySelect.value = 'personal';
        updateWordCount();
    });

    if (journalEntry) journalEntry.addEventListener('input', updateWordCount);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderEntries();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', () => {
            renderEntries();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            renderEntries();
        });
    }

    if (moodSelect) {
        moodSelect.addEventListener('change', () => {
            renderEntries();
        });
    }

    // Format buttons
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            document.execCommand(format, false, null);
            button.classList.toggle('active');
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Templates
    const templates = {
        daily: {
            title: "Daily Reflection",
            content: "1. What went well today?\n2. What could have gone better?\n3. What am I grateful for?\n4. Tomorrow's goals:"
        },
        work: {
            title: "Work Journal",
            content: "1. Key achievements:\n2. Challenges faced:\n3. Lessons learned:\n4. Action items for tomorrow:"
        },
        health: {
            title: "Health & Wellness",
            content: "1. How am I feeling today?\n2. Exercise:\n3. Diet:\n4. Sleep quality:\n5. Stress level (1-10):"
        },
        gratitude: {
            title: "Gratitude Journal",
            content: "1. Three things I'm grateful for today:\n\n2. A person I'm thankful for:\n\n3. Something that made me smile:\n\n4. A small win I had today:",
            fields: ['gratitude', 'person', 'smile', 'win']
        },
        reflection: {
            title: "Weekly Reflection",
            content: "1. What went well this week?\n\n2. What could have gone better?\n\n3. What did I learn?\n\n4. Goals for next week:",
            fields: ['success', 'improvement', 'learning', 'goals']
        }
    };

    // Prompts
    const prompts = [
        "What made you smile today?",
        "What's one thing you learned recently?",
        "What are you looking forward to?",
        "What's a challenge you're facing?",
        "What's something you're proud of?",
        "What's a goal you're working towards?",
        "What's something you want to remember about today?",
        "What's a lesson you learned the hard way?",
        "What's something you're curious about?",
        "What's a small win you had today?"
    ];

    // Template button
    const templatesBtn = document.getElementById('templatesBtn');
    if (templatesBtn) {
        templatesBtn.addEventListener('click', () => {
            const templateList = document.createElement('div');
            templateList.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
            templateList.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-2xl relative max-w-md w-full">
                    <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                    <h3 class="text-2xl font-bold text-pink-600 mb-4">Choose a Template</h3>
                    <div class="space-y-4">
                        ${Object.entries(templates).map(([key, template]) => `
                            <button class="w-full p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition text-left" data-template="${key}">
                                <h4 class="font-semibold text-pink-700">${template.title}</h4>
                                <p class="text-sm text-gray-600 mt-1">${template.content.split('\n')[0]}...</p>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(templateList);
            
            templateList.addEventListener('click', (e) => {
                if (e.target === templateList || e.target.tagName === 'BUTTON') {
                    if (e.target.dataset.template) {
                        const template = templates[e.target.dataset.template];
                        entryTitle.value = template.title;
                        journalEntry.innerHTML = template.content;
                        updateWordCount();
                    }
                    templateList.remove();
                }
            });
        });
    }

    // Prompt button
    const promptsBtn = document.getElementById('promptsBtn');
    if (promptsBtn) {
        promptsBtn.addEventListener('click', () => {
            const promptList = document.createElement('div');
            promptList.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
            promptList.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-2xl relative max-w-md w-full">
                    <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                    <h3 class="text-2xl font-bold text-pink-600 mb-4">Writing Prompts</h3>
                    <div class="space-y-4">
                        ${prompts.map(prompt => `
                            <button class="w-full p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition text-left">
                                ${prompt}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(promptList);
            
            promptList.addEventListener('click', (e) => {
                if (e.target === promptList || e.target.tagName === 'BUTTON') {
                    if (e.target.textContent && e.target.textContent !== '×') {
                        entryTitle.value = e.target.textContent;
                        journalEntry.innerHTML = '';
                        updateWordCount();
                    }
                    promptList.remove();
                }
            });
        });
    }

    // New Entry button
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', () => {
            entryTitle.value = '';
            journalEntry.innerHTML = '';
            moodSelect.value = '😊';
            categorySelect.value = 'personal';
            updateWordCount();
        });
    }

    // Export functionality
    const exportPDF = document.getElementById('exportPDF');
    if (exportPDF) {
        exportPDF.addEventListener('click', () => {
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            const content = entries.map(entry => `
                <h2>${entry.title}</h2>
                <p>Date: ${new Date(entry.date).toLocaleString()}</p>
                <p>Mood: ${entry.mood}</p>
                <p>Category: ${entry.category}</p>
                <div>${entry.content}</div>
                <hr>
            `).join('');
            
            const element = document.createElement('div');
            element.innerHTML = content;
            html2pdf().from(element).save('journal-entries.pdf');
        });
    }

    const exportMD = document.getElementById('exportMD');
    if (exportMD) {
        exportMD.addEventListener('click', () => {
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            const content = entries.map(entry => `
# ${entry.title}
Date: ${new Date(entry.date).toLocaleString()}
Mood: ${entry.mood}
Category: ${entry.category}

${entry.content}

---
            `).join('');
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'journal-entries.md';
            a.click();
        });
    }

    const exportTXT = document.getElementById('exportTXT');
    if (exportTXT) {
        exportTXT.addEventListener('click', () => {
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            const content = entries.map(entry => `
${entry.title}
Date: ${new Date(entry.date).toLocaleString()}
Mood: ${entry.mood}
Category: ${entry.category}

${entry.content}

---
            `).join('');
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'journal-entries.txt';
            a.click();
        });
    }

    // Backup functionality
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            const theme = localStorage.getItem('theme');
            
            const backup = {
                entries,
                theme,
                user: currentUser,
                date: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });
    }

    // View Entries button
    const viewEntriesBtn = document.getElementById('viewEntriesBtn');
    if (viewEntriesBtn) {
        viewEntriesBtn.addEventListener('click', () => {
            const entriesModal = document.createElement('div');
            entriesModal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
            
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            // Sort entries by date (newest first)
            const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            entriesModal.innerHTML = `
                <div class="bg-white p-4 md:p-6 rounded-2xl shadow-2xl relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                    <h3 class="text-xl md:text-2xl font-bold text-pink-600 mb-4">Past Entries</h3>
                    <div class="space-y-3 md:space-y-4">
                        ${sortedEntries.length === 0 ? 
                            '<p class="text-center text-pink-400">No entries found.</p>' :
                            sortedEntries.map(entry => `
                                <div class="p-3 md:p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition cursor-pointer" data-entry='${JSON.stringify(entry)}'>
                                    <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-pink-700 text-sm md:text-base">${entry.title}</h4>
                                            <p class="text-xs text-pink-500">${new Date(entry.date).toLocaleString()}</p>
                                        </div>
                                        <button class="text-red-500 hover:text-red-700 px-2 py-1 rounded delete-btn self-end" data-date="${entry.date}">
                                            🗑️
                                        </button>
                                    </div>
                                    <div class="flex flex-wrap gap-2 mb-2">
                                        <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full text-xs">${entry.mood}</span>
                                        <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full text-xs">${entry.category}</span>
                                    </div>
                                    <div class="text-gray-700 text-sm md:text-base line-clamp-2">${entry.content}</div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;
            
            document.body.appendChild(entriesModal);
            
            // Handle entry click to show full entry
            entriesModal.querySelectorAll('[data-entry]').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        const entry = JSON.parse(card.dataset.entry);
                        showEntryDetails(entry);
                    }
                });
            });
            
            // Handle delete button clicks
            entriesModal.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const date = btn.dataset.date;
                    if (confirm('Are you sure you want to delete this entry?')) {
                        const currentUser = localStorage.getItem('currentUser');
                        let entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
                        entries = entries.filter(entry => entry.date !== date);
                        localStorage.setItem(`journalEntries_${currentUser}`, JSON.stringify(entries));
                        entriesModal.remove();
                        viewEntriesBtn.click(); // Refresh the entries view
                        updateStatistics();
                        updateGoals();
                    }
                });
            });
            
            // Close modal
            entriesModal.addEventListener('click', (e) => {
                if (e.target === entriesModal || e.target.textContent === '×') {
                    entriesModal.remove();
                }
            });
        });
    }

    // Function to show entry details
    function showEntryDetails(entry) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white p-4 md:p-6 rounded-2xl shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                <h3 class="text-xl md:text-2xl font-bold text-pink-600 mb-2">${entry.title}</h3>
                <div class="flex flex-wrap gap-2 mb-2">
                    <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full text-sm">${entry.mood}</span>
                    <span class="bg-pink-200 text-pink-700 px-2 py-1 rounded-full text-sm">${entry.category}</span>
                </div>
                <p class="text-xs text-gray-400 mb-4">${new Date(entry.date).toLocaleString()}</p>
                <div class="prose max-w-none text-sm md:text-base">${entry.content}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.textContent === '×') {
                modal.remove();
            }
        });
    }

    // Statistics button
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            const statsModal = document.createElement('div');
            statsModal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
            
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            // Calculate statistics
            const totalEntries = entries.length;
            const totalWords = entries.reduce((sum, entry) => {
                return sum + entry.content.split(/\s+/).length;
            }, 0);
            
            // Calculate most used category
            const categories = entries.reduce((acc, entry) => {
                acc[entry.category] = (acc[entry.category] || 0) + 1;
                return acc;
            }, {});
            
            const mostUsedCategory = Object.entries(categories)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
            
            // Calculate writing streak
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < entries.length; i++) {
                const entryDate = new Date(entries[i].date);
                entryDate.setHours(0, 0, 0, 0);
                
                if (entryDate.getTime() === today.getTime() - (i * 24 * 60 * 60 * 1000)) {
                    streak++;
                } else {
                    break;
                }
            }
            
            statsModal.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-2xl relative max-w-2xl w-full">
                    <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                    <h3 class="text-2xl font-bold text-pink-600 mb-6">Your Statistics</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stats-card bg-pink-50 p-4 rounded-xl">
                            <h4 class="text-sm font-semibold text-pink-700">Writing Streak</h4>
                            <p class="text-2xl font-bold text-pink-600">${streak} days</p>
                        </div>
                        <div class="stats-card bg-pink-50 p-4 rounded-xl">
                            <h4 class="text-sm font-semibold text-pink-700">Total Entries</h4>
                            <p class="text-2xl font-bold text-pink-600">${totalEntries}</p>
                        </div>
                        <div class="stats-card bg-pink-50 p-4 rounded-xl">
                            <h4 class="text-sm font-semibold text-pink-700">Most Used Category</h4>
                            <p class="text-2xl font-bold text-pink-600">${mostUsedCategory}</p>
                        </div>
                        <div class="stats-card bg-pink-50 p-4 rounded-xl">
                            <h4 class="text-sm font-semibold text-pink-700">Total Words</h4>
                            <p class="text-2xl font-bold text-pink-600">${totalWords}</p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(statsModal);
            
            statsModal.addEventListener('click', (e) => {
                if (e.target === statsModal || e.target.textContent === '×') {
                    statsModal.remove();
                }
            });
        });
    }

    // Goals button
    const goalsBtn = document.getElementById('goalsBtn');
    if (goalsBtn) {
        goalsBtn.addEventListener('click', () => {
            const goalsModal = document.createElement('div');
            goalsModal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
            
            const currentUser = localStorage.getItem('currentUser');
            const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
            
            // Get today's entries
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEntries = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            });
            
            // Calculate goals progress
            const writingProgress = (todayEntries.length / 7) * 100;
            const totalWords = todayEntries.reduce((sum, entry) => {
                return sum + entry.content.split(/\s+/).length;
            }, 0);
            const wordProgress = Math.min((totalWords / 1000) * 100, 100);
            
            goalsModal.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-2xl relative max-w-2xl w-full">
                    <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                    <h3 class="text-2xl font-bold text-pink-600 mb-6">Your Goals</h3>
                    <div class="space-y-6">
                        <div>
                            <div class="flex justify-between mb-2">
                                <h4 class="text-lg font-semibold text-pink-700">Daily Writing</h4>
                                <span class="text-pink-600">${todayEntries.length}/7 days</span>
                            </div>
                            <div class="goal-progress">
                                <div class="goal-progress-bar" style="width: ${writingProgress}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-2">
                                <h4 class="text-lg font-semibold text-pink-700">Word Count</h4>
                                <span class="text-pink-600">${totalWords}/1000 words</span>
                            </div>
                            <div class="goal-progress">
                                <div class="goal-progress-bar" style="width: ${wordProgress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(goalsModal);
            
            goalsModal.addEventListener('click', (e) => {
                if (e.target === goalsModal || e.target.textContent === '×') {
                    goalsModal.remove();
                }
            });
        });
    }

    // Formatting Toolbar
    const formattingToolbar = document.querySelector('.formatting-toolbar');
    if (formattingToolbar) {
        window.addEventListener('scroll', () => {
            const rect = formattingToolbar.getBoundingClientRect();
            if (rect.top < 0) {
                formattingToolbar.classList.add('fixed', 'top-0', 'w-full', 'max-w-full');
                formattingToolbar.classList.remove('sticky');
            } else {
                formattingToolbar.classList.remove('fixed', 'top-0', 'w-full', 'max-w-full');
                formattingToolbar.classList.add('sticky');
            }
        });
    }

    // Add this after your existing functions
    function addTags() {
        const tags = ['#gratitude', '#reflection', '#goals', '#ideas', '#memories', '#learning'];
        const tagContainer = document.createElement('div');
        tagContainer.className = 'flex flex-wrap gap-2 mb-2';
        
        tags.forEach(tag => {
            const tagButton = document.createElement('button');
            tagButton.className = 'bg-pink-100 text-pink-700 px-3 py-1 rounded-full hover:bg-pink-200 transition text-sm';
            tagButton.textContent = tag;
            tagButton.onclick = () => {
                const selection = window.getSelection();
                if (selection.toString()) {
                    document.execCommand('insertText', false, ` ${tag} `);
                } else {
                    journalEntry.innerHTML += ` ${tag} `;
                }
            };
            tagContainer.appendChild(tagButton);
        });
        
        // Insert before the journal entry
        journalEntry.parentNode.insertBefore(tagContainer, journalEntry);
    }

    // Add this after your element declarations
    let autoSaveTimeout;
    function setupAutoSave() {
        journalEntry.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                const title = entryTitle.value.trim();
                const content = journalEntry.innerHTML.trim();
                if (title && content) {
                    saveEntry();
                }
            }, 30000); // Auto-save after 30 seconds of inactivity
        });
    }

    // Add this function
    function showMoodStats() {
        const currentUser = localStorage.getItem('currentUser');
        const entries = JSON.parse(localStorage.getItem(`journalEntries_${currentUser}`) || '[]');
        
        const moodStats = entries.reduce((acc, entry) => {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
            return acc;
        }, {});
        
        const moodModal = document.createElement('div');
        moodModal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
        moodModal.innerHTML = `
            <div class="bg-white p-6 rounded-2xl shadow-2xl relative max-w-md w-full">
                <button class="absolute top-2 right-4 text-3xl text-pink-400 hover:text-pink-600 transition">&times;</button>
                <h3 class="text-2xl font-bold text-pink-600 mb-4">Mood Statistics</h3>
                <div class="space-y-4">
                    ${Object.entries(moodStats).map(([mood, count]) => `
                        <div class="flex justify-between items-center">
                            <span class="text-xl">${mood}</span>
                            <span class="text-pink-600 font-semibold">${count} entries</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(moodModal);
        moodModal.addEventListener('click', (e) => {
            if (e.target === moodModal || e.target.textContent === '×') {
                moodModal.remove();
            }
        });
    }
}); 
