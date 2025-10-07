/**
 * Live TV Streaming Platform
 * Main application logic
 */
class LiveTVApp {
    constructor() {
        this.parser = new M3UParser();
        this.currentChannels = [];
        this.favorites = this.loadFavorites();
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.currentChannel = null;
        this.hls = null;
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.bindEvents();
        this.loadDefaultPlaylists();
        this.updateFavoritesDisplay();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchChannels(e.target.value);
        });

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
            });
        });

        // View controls
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setView('grid');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setView('list');
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeVideoModal();
        });

        document.getElementById('closePlaylistModal').addEventListener('click', () => {
            this.closePlaylistModal();
        });

        // Playlist controls
        document.getElementById('addPlaylistBtn').addEventListener('click', () => {
            this.openPlaylistModal();
        });

        document.getElementById('loadPlaylist').addEventListener('click', () => {
            this.loadPlaylist();
        });

        document.getElementById('cancelPlaylist').addEventListener('click', () => {
            this.closePlaylistModal();
        });

        // Player controls
        document.getElementById('toggleFullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('toggleFavorite').addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Close modals on outside click
        document.getElementById('videoModal').addEventListener('click', (e) => {
            if (e.target.id === 'videoModal') {
                this.closeVideoModal();
            }
        });

        document.getElementById('playlistModal').addEventListener('click', (e) => {
            if (e.target.id === 'playlistModal') {
                this.closePlaylistModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeVideoModal();
                this.closePlaylistModal();
            }
        });
    }

    /**
     * Load default M3U playlists
     */
    async loadDefaultPlaylists() {
        const defaultPlaylists = [
            {
                name: 'BeIN Sports & Arabic Channels',
                url: 'https://iptv-org.github.io/iptv/index.m3u'
            }
        ];

        try {
            this.showLoading(true);
            
            for (const playlist of defaultPlaylists) {
                try {
                    const channels = await this.parser.parsePlaylist(playlist.url, playlist.name);
                    this.parser.addChannels(channels);
                    console.log(`Loaded ${channels.length} channels from ${playlist.name}`);
                } catch (error) {
                    console.warn(`Failed to load ${playlist.name}:`, error.message);
                }
            }

            this.currentChannels = this.parser.channels;
            this.displayChannels();
            this.updateChannelCount();
            
        } catch (error) {
            this.showError('Failed to load default playlists. Please add a custom playlist.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display channels in the UI
     */
    displayChannels() {
        const channelList = document.getElementById('channelList');
        const channels = this.currentChannels;

        if (channels.length === 0) {
            channelList.innerHTML = `
                <div class="loading">
                    <i class="fas fa-tv"></i>
                    <p>No channels found. Try adding a playlist.</p>
                </div>
            `;
            return;
        }

        const channelHTML = channels.map(channel => this.createChannelHTML(channel)).join('');
        channelList.innerHTML = channelHTML;

        // Add click events to channel items
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const channelId = item.dataset.channelId;
                this.playChannel(channelId);
            });
        });
    }

    /**
     * Create HTML for a channel item
     * @param {Object} channel - Channel object
     * @returns {string} HTML string
     */
    createChannelHTML(channel) {
        const isFavorite = this.favorites.includes(channel.id);
        const logoUrl = channel.logo || this.generateChannelLogo(channel.name);
        
        return `
            <div class="channel-item ${this.currentView}" data-channel-id="${channel.id}">
                <div class="channel-logo" style="background-image: url('${logoUrl}'); background-size: cover; background-position: center;">
                    ${!channel.logo ? channel.name.charAt(0).toUpperCase() : ''}
                </div>
                <div class="channel-info">
                    <h3>${this.escapeHtml(channel.name)}</h3>
                    <p>${this.escapeHtml(channel.group || 'General')}</p>
                    <span class="channel-category">${channel.category}</span>
                    ${isFavorite ? '<i class="fas fa-heart" style="color: #e53e3e; margin-left: 0.5rem;"></i>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Generate a simple logo for channels without logos
     * @param {string} name - Channel name
     * @returns {string} Logo URL
     */
    generateChannelLogo(name) {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const color = colors[name.length % colors.length];
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" fill="${color}" rx="8"/>
                <text x="30" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">
                    ${name.charAt(0).toUpperCase()}
                </text>
            </svg>
        `)}`;
    }

    /**
     * Play a channel
     * @param {string} channelId - Channel ID
     */
    playChannel(channelId) {
        const channel = this.parser.getChannelById(channelId);
        if (!channel) {
            this.showError('Channel not found');
            return;
        }

        this.currentChannel = channel;
        this.openVideoModal();
        this.loadVideoStream(channel.url);
    }

    /**
     * Load video stream
     * @param {string} url - Stream URL
     */
    loadVideoStream(url) {
        const video = document.getElementById('videoPlayer');
        
        // Clean up previous HLS instance
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        // Check if HLS is supported
        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            
            this.hls.loadSource(url);
            this.hls.attachMedia(video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed, starting playback');
                video.play().catch(e => console.warn('Autoplay prevented:', e));
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                this.handleStreamError(data);
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.warn('Autoplay prevented:', e));
            });
        } else {
            this.showError('HLS is not supported in this browser');
        }
    }

    /**
     * Handle stream errors
     * @param {Object} error - Error object
     */
    handleStreamError(error) {
        if (error.fatal) {
            switch (error.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    this.showError('Network error. Please check your connection.');
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    this.showError('Media error. This stream may be unavailable.');
                    break;
                default:
                    this.showError('Stream error. Please try another channel.');
                    break;
            }
        }
    }

    /**
     * Open video modal
     */
    openVideoModal() {
        const modal = document.getElementById('videoModal');
        const channelName = document.getElementById('currentChannelName');
        const favoriteBtn = document.getElementById('toggleFavorite');
        
        channelName.textContent = this.currentChannel.name;
        
        // Update favorite button
        const isFavorite = this.favorites.includes(this.currentChannel.id);
        favoriteBtn.innerHTML = isFavorite ? 
            '<i class="fas fa-heart"></i> Remove from Favorites' : 
            '<i class="far fa-heart"></i> Add to Favorites';
        
        modal.classList.add('show');
        modal.classList.add('fade-in');
    }

    /**
     * Close video modal
     */
    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const video = document.getElementById('videoPlayer');
        
        // Stop video playback
        video.pause();
        video.src = '';
        
        // Clean up HLS
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        modal.classList.remove('show');
        this.currentChannel = null;
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        const video = document.getElementById('videoPlayer');
        
        if (!document.fullscreenElement) {
            video.requestFullscreen().catch(err => {
                console.warn('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite() {
        if (!this.currentChannel) return;
        
        const channelId = this.currentChannel.id;
        const index = this.favorites.indexOf(channelId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(channelId);
        }
        
        this.saveFavorites();
        this.updateFavoritesDisplay();
        this.updateFavoriteButton();
        this.displayChannels(); // Refresh to update heart icons
    }

    /**
     * Update favorite button text
     */
    updateFavoriteButton() {
        if (!this.currentChannel) return;
        
        const favoriteBtn = document.getElementById('toggleFavorite');
        const isFavorite = this.favorites.includes(this.currentChannel.id);
        
        favoriteBtn.innerHTML = isFavorite ? 
            '<i class="fas fa-heart"></i> Remove from Favorites' : 
            '<i class="far fa-heart"></i> Add to Favorites';
    }

    /**
     * Search channels
     * @param {string} query - Search query
     */
    searchChannels(query) {
        this.currentChannels = this.parser.searchChannels(query);
        this.displayChannels();
        this.updateChannelCount();
    }

    /**
     * Filter channels by category
     * @param {string} category - Category name
     */
    filterByCategory(category) {
        this.currentCategory = category;
        this.currentChannels = this.parser.getChannelsByCategory(category);
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.displayChannels();
        this.updateChannelCount();
    }

    /**
     * Set view mode
     * @param {string} view - View mode (grid or list)
     */
    setView(view) {
        this.currentView = view;
        const channelList = document.getElementById('channelList');
        
        // Update button states
        document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
        document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
        
        // Update channel list class
        channelList.className = `channel-list ${view}`;
        
        // Re-render channels
        this.displayChannels();
    }

    /**
     * Open playlist modal
     */
    openPlaylistModal() {
        const modal = document.getElementById('playlistModal');
        modal.classList.add('show');
        modal.classList.add('fade-in');
        
        // Clear form
        document.getElementById('playlistUrl').value = '';
        document.getElementById('playlistName').value = '';
    }

    /**
     * Close playlist modal
     */
    closePlaylistModal() {
        const modal = document.getElementById('playlistModal');
        modal.classList.remove('show');
    }

    /**
     * Load custom playlist
     */
    async loadPlaylist() {
        const url = document.getElementById('playlistUrl').value.trim();
        const name = document.getElementById('playlistName').value.trim() || 'Custom Playlist';
        
        if (!url) {
            this.showError('Please enter a playlist URL');
            return;
        }
        
        if (!this.parser.isValidM3UUrl(url)) {
            this.showError('Please enter a valid M3U URL');
            return;
        }
        
        try {
            this.showLoading(true);
            const channels = await this.parser.parsePlaylist(url, name);
            this.parser.addChannels(channels);
            
            // Update current view
            this.currentChannels = this.parser.getChannelsByCategory(this.currentCategory);
            this.displayChannels();
            this.updateChannelCount();
            
            this.closePlaylistModal();
            this.showSuccess(`Loaded ${channels.length} channels from ${name}`);
            
        } catch (error) {
            this.showError(`Failed to load playlist: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Update channel count display
     */
    updateChannelCount() {
        const count = this.currentChannels.length;
        const category = this.currentCategory === 'all' ? '' : ` in ${this.currentCategory}`;
        document.getElementById('channelCount').textContent = `${count} channels${category}`;
    }

    /**
     * Update favorites display
     */
    updateFavoritesDisplay() {
        const favoritesList = document.getElementById('favoritesList');
        
        if (this.favorites.length === 0) {
            favoritesList.innerHTML = '<p class="no-favorites">No favorites yet</p>';
            return;
        }
        
        const favoriteChannels = this.favorites
            .map(id => this.parser.getChannelById(id))
            .filter(channel => channel !== null);
        
        const favoritesHTML = favoriteChannels.map(channel => `
            <div class="favorite-item" data-channel-id="${channel.id}">
                <i class="fas fa-heart"></i>
                <span>${this.escapeHtml(channel.name)}</span>
            </div>
        `).join('');
        
        favoritesList.innerHTML = favoritesHTML;
        
        // Add click events to favorite items
        document.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                const channelId = item.dataset.channelId;
                this.playChannel(channelId);
            });
        });
    }

    /**
     * Show loading state
     * @param {boolean} show - Show or hide loading
     */
    showLoading(show) {
        const channelList = document.getElementById('channelList');
        
        if (show) {
            channelList.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading channels...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show notification
     * @param {string} message - Message
     * @param {string} type - Type (error or success)
     */
    showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)';
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Load favorites from localStorage
     * @returns {Array} Array of favorite channel IDs
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem('liveTV_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem('liveTV_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.warn('Failed to save favorites:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LiveTVApp();
});
