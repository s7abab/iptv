/**
 * M3U Playlist Parser
 * Parses M3U and M3U8 playlists to extract channel information
 */
class M3UParser {
    constructor() {
        this.channels = [];
        this.playlists = [];
    }

    /**
     * Parse M3U content from URL or text
     * @param {string} url - M3U playlist URL
     * @param {string} name - Playlist name
     * @returns {Promise<Array>} Array of parsed channels
     */
    async parsePlaylist(url, name = 'Unknown Playlist') {
        try {
            let response;
            
            // Check if it's a local file
            if (url.startsWith('./') || url.startsWith('/') || !url.includes('://')) {
                // Local file - use simple fetch
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/vnd.apple.mpegurl, application/x-mpegurl, */*'
                    }
                });
            } else {
                // Remote URL - try direct fetch first
                try {
                    response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/vnd.apple.mpegurl, application/x-mpegurl, */*'
                        }
                    });
                } catch (corsError) {
                    // If CORS fails, try with a CORS proxy
                    console.warn('Direct fetch failed, trying CORS proxy...');
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                    response = await fetch(proxyUrl, {
                        method: 'GET',
                        mode: 'cors'
                    });
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            return this.parseM3UContent(content, url, name);
        } catch (error) {
            console.error('Error parsing playlist:', error);
            throw new Error(`Failed to load playlist: ${error.message}`);
        }
    }

    /**
     * Parse M3U content from text
     * @param {string} content - M3U content
     * @param {string} baseUrl - Base URL for relative paths
     * @param {string} playlistName - Name of the playlist
     * @returns {Array} Array of parsed channels
     */
    parseM3UContent(content, baseUrl, playlistName) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const channels = [];
        let currentChannel = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if it's an extended info line (#EXTINF:)
            if (line.startsWith('#EXTINF:')) {
                currentChannel = this.parseExtInf(line, baseUrl, playlistName);
            }
            // Check if it's a URL line (not starting with #)
            else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = this.resolveUrl(line, baseUrl);
                currentChannel.id = this.generateChannelId(currentChannel);
                channels.push(currentChannel);
                currentChannel = null;
            }
        }

        return channels;
    }

    /**
     * Parse EXTINF line to extract channel information
     * @param {string} extinfLine - EXTINF line
     * @param {string} baseUrl - Base URL for relative paths
     * @param {string} playlistName - Name of the playlist
     * @returns {Object} Channel object
     */
    parseExtInf(extinfLine, baseUrl, playlistName) {
        const channel = {
            name: 'Unknown Channel',
            logo: null,
            category: 'General',
            description: '',
            playlist: playlistName,
            url: '',
            id: '',
            duration: -1,
            group: 'General'
        };

        // Extract duration and attributes
        const match = extinfLine.match(/#EXTINF:(-?\d+)(.*)/);
        if (match) {
            channel.duration = parseInt(match[1]);
            const attributes = match[2];

            // Parse attributes
            const attrRegex = /(\w+)="([^"]*)"/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(attributes)) !== null) {
                const [, key, value] = attrMatch;
                switch (key.toLowerCase()) {
                    case 'tvg-name':
                        channel.name = value;
                        break;
                    case 'tvg-logo':
                        channel.logo = this.resolveUrl(value, baseUrl);
                        break;
                    case 'group-title':
                        channel.group = value;
                        channel.category = this.categorizeChannel(value);
                        break;
                    case 'tvg-id':
                        channel.tvgId = value;
                        break;
                    case 'tvg-chno':
                        channel.channelNumber = value;
                        break;
                }
            }

            // Extract channel name from the end of the line if not found in attributes
            const nameMatch = attributes.match(/,([^,]+)$/);
            if (nameMatch) {
                channel.name = nameMatch[1].trim();
            }
            
            // If no group title was found, categorize based on channel name
            if (!channel.group || channel.group === 'General') {
                channel.category = this.categorizeChannel(channel.name);
            }
        }

        return channel;
    }

    /**
     * Categorize channel based on group title
     * @param {string} groupTitle - Group title from M3U
     * @returns {string} Category name
     */
    categorizeChannel(groupTitle) {
        const title = groupTitle.toLowerCase();
        
        if (title.includes('news') || title.includes('cnn') || title.includes('bbc') || title.includes('fox news') || title.includes('ann-news') || title.includes('al-hadath') || title.includes('alarabiya') || title.includes('aljazeera') || title.includes('nbn') || title.includes('sharqiya-news')) {
            return 'News';
        } else if (title.includes('sport') || title.includes('espn') || title.includes('football') || title.includes('soccer') || title.includes('beinsport') || title.includes('eurosport') || title.includes('mbcprosport') || title.includes('dubaisport') || title.includes('ad-sport') || title.includes('skysport') || title.includes('alkas')) {
            return 'Sports';
        } else if (title.includes('music') || title.includes('mtv') || title.includes('vh1')) {
            return 'Music';
        } else if (title.includes('kids') || title.includes('cartoon') || title.includes('disney') || title.includes('majd-kids') || title.includes('kids-movie') || title.includes('spacetoon') || title.includes('jeem') || title.includes('toyor-aljanah') || title.includes('fatafeat')) {
            return 'Kids';
        } else if (title.includes('movie') || title.includes('cinema') || title.includes('hbo') || title.includes('osn-movies') || title.includes('osn-cinema') || title.includes('osn-starmovie') || title.includes('lcd-aflam')) {
            return 'Entertainment';
        } else if (title.includes('documentary') || title.includes('history') || title.includes('national geographic')) {
            return 'Documentary';
        } else if (title.includes('comedy') || title.includes('funny')) {
            return 'Comedy';
        } else if (title.includes('religious') || title.includes('church') || title.includes('god') || title.includes('quran') || title.includes('mecca') || title.includes('iqraa') || title.includes('almajd-quran') || title.includes('saudi-quran')) {
            return 'Religious';
        } else if (title.includes('local') || title.includes('regional') || title.includes('dubai') || title.includes('jordan') || title.includes('oman') || title.includes('oman')) {
            return 'Local';
        } else {
            return 'Entertainment';
        }
    }

    /**
     * Resolve relative URLs to absolute URLs
     * @param {string} url - URL to resolve
     * @param {string} baseUrl - Base URL
     * @returns {string} Absolute URL
     */
    resolveUrl(url, baseUrl) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        try {
            const base = new URL(baseUrl);
            return new URL(url, base.origin).href;
        } catch (error) {
            console.warn('Error resolving URL:', error);
            return url;
        }
    }

    /**
     * Generate unique channel ID
     * @param {Object} channel - Channel object
     * @returns {string} Unique channel ID
     */
    generateChannelId(channel) {
        const name = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const url = channel.url.split('/').pop().split('.')[0];
        return `${name}_${url}`.substring(0, 50);
    }

    /**
     * Get channels by category
     * @param {string} category - Category name
     * @returns {Array} Filtered channels
     */
    getChannelsByCategory(category) {
        if (category === 'all') {
            return this.channels;
        }
        return this.channels.filter(channel => 
            channel.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Search channels by name
     * @param {string} query - Search query
     * @returns {Array} Filtered channels
     */
    searchChannels(query) {
        if (!query) {
            return this.channels;
        }

        const searchTerm = query.toLowerCase();
        return this.channels.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm) ||
            channel.description.toLowerCase().includes(searchTerm) ||
            channel.category.toLowerCase().includes(searchTerm) ||
            channel.group.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Add channels to the main list
     * @param {Array} newChannels - New channels to add
     */
    addChannels(newChannels) {
        // Filter out duplicates based on URL
        const existingUrls = new Set(this.channels.map(ch => ch.url));
        const uniqueChannels = newChannels.filter(ch => !existingUrls.has(ch.url));
        
        this.channels.push(...uniqueChannels);
        this.channels.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get all unique categories
     * @returns {Array} Array of category names
     */
    getCategories() {
        const categories = new Set(this.channels.map(ch => ch.category));
        return Array.from(categories).sort();
    }

    /**
     * Clear all channels
     */
    clearChannels() {
        this.channels = [];
    }

    /**
     * Get channel by ID
     * @param {string} id - Channel ID
     * @returns {Object|null} Channel object or null
     */
    getChannelById(id) {
        return this.channels.find(channel => channel.id === id) || null;
    }

    /**
     * Validate M3U URL
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid M3U URL
     */
    isValidM3UUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.toLowerCase().endsWith('.m3u') || 
                   urlObj.pathname.toLowerCase().endsWith('.m3u8') ||
                   url.includes('m3u');
        } catch {
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3UParser;
}
