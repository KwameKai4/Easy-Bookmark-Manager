document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addBookmarkForm');
    const bookmarksList = document.getElementById('bookmarksList');
    const searchInput = document.getElementById('searchInput');
    const getCurrentUrlBtn = document.getElementById('getCurrentUrl');
    const bookmarkNameInput = document.getElementById('bookmarkName');

    // Load existing bookmarks
    loadBookmarks();

    // Get current URL button click handler
    getCurrentUrlBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const currentTab = tabs[0];
                // Auto-fill name if empty, using page title
                if (!bookmarkNameInput.value) {
                    bookmarkNameInput.value = currentTab.title;
                }
                addBookmark(currentTab.title, currentTab.url);
            }
        });
    });

    // Add new bookmark
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('bookmarkName');
        // Get current URL when form is submitted
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                addBookmark(nameInput.value.trim(), tabs[0].url);
            }
        });
    });

    // Function to add bookmark
    function addBookmark(name, url) {
        const bookmark = {
            name: name,
            url: url,
            date: new Date().toISOString()
        };

        // Save to storage
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            bookmarks.push(bookmark);
            
            chrome.storage.sync.set({ bookmarks }, () => {
                // Reset form
                bookmarkNameInput.value = '';
                
                // Refresh display
                loadBookmarks();
            });
        });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterBookmarks(searchTerm);
    });

    // Load and display bookmarks
    function loadBookmarks() {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            displayBookmarks(bookmarks);
        });
    }

    // Display bookmarks in the list
    function displayBookmarks(bookmarks) {
        bookmarksList.innerHTML = '';
        
        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = '<p>No bookmarks added yet.</p>';
            return;
        }

        bookmarks.forEach((bookmark, index) => {
            const bookmarkElement = createBookmarkElement(bookmark, index);
            bookmarksList.appendChild(bookmarkElement);
        });
    }

    // Create bookmark element
    function createBookmarkElement(bookmark, index) {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        
        div.innerHTML = `
            <div class="bookmark-info">
                <div class="bookmark-title">${bookmark.name}</div>
                <div class="bookmark-url">${bookmark.url}</div>
            </div>
            <button class="delete-btn" data-index="${index}">
                <span class="material-icons">delete</span>
            </button>
        `;

        // Add click event for the bookmark link
        div.querySelector('.bookmark-info').addEventListener('click', () => {
            chrome.tabs.create({ url: bookmark.url });
        });

        // Add click event for delete button
        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBookmark(index);
        });

        return div;
    }

    // Delete bookmark
    function deleteBookmark(index) {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            bookmarks.splice(index, 1);
            
            chrome.storage.sync.set({ bookmarks }, () => {
                loadBookmarks();
            });
        });
    }

    // Filter bookmarks based on search
    function filterBookmarks(searchTerm) {
        chrome.storage.sync.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || [];
            const filtered = bookmarks.filter(bookmark => 
                bookmark.name.toLowerCase().includes(searchTerm) ||
                bookmark.url.toLowerCase().includes(searchTerm)
            );
            displayBookmarks(filtered);
        });
    }
});
