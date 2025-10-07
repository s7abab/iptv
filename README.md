# Live TV Streaming Platform

A modern web-based live TV streaming platform that supports M3U playlists. Stream live TV channels from free publicly available M3U URLs with a beautiful, responsive interface.

## Features

- 🎬 **Live TV Streaming** - Stream channels from M3U playlists
- 🔍 **Smart Search** - Search channels by name, category, or description
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- ❤️ **Favorites** - Save your favorite channels for quick access
- 🏷️ **Categories** - Automatic channel categorization (News, Sports, Entertainment, etc.)
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations
- 📺 **Multiple Views** - Grid and list view options
- ⌨️ **Keyboard Shortcuts** - ESC to close modals
- 🔄 **Real-time Updates** - Dynamic playlist loading and channel updates

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for loading M3U playlists

### Installation

1. Download or clone this repository
2. **Option A: Run from local server (Recommended)**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```
   Then open `http://localhost:8000` in your browser

3. **Option B: Open directly in browser**
   - Open `index.html` in your web browser
   - Note: Some playlists may not load due to CORS restrictions
   - The app will show sample channels for demonstration

4. The app will automatically load some default playlists

### Adding Custom Playlists

1. Click the "Add Playlist" button
2. Enter a valid M3U URL
3. Optionally provide a custom name for the playlist
4. Click "Load Playlist"

## Sample M3U URLs

The platform now uses the official [iptv-org/iptv](https://github.com/iptv-org/iptv) repository as the primary source, which provides over 97k+ channels worldwide. Here are the main playlists:

### Official iptv-org Playlists (Recommended)
- **All Channels**: `https://iptv-org.github.io/iptv/index.m3u` - Complete collection
- **USA Channels**: `https://iptv-org.github.io/iptv/countries/us.m3u`
- **UK Channels**: `https://iptv-org.github.io/iptv/countries/gb.m3u`
- **Canada Channels**: `https://iptv-org.github.io/iptv/countries/ca.m3u`

### Regional Collections
- **Germany**: `https://iptv-org.github.io/iptv/countries/de.m3u`
- **France**: `https://iptv-org.github.io/iptv/countries/fr.m3u`
- **Italy**: `https://iptv-org.github.io/iptv/countries/it.m3u`
- **Spain**: `https://iptv-org.github.io/iptv/countries/es.m3u`
- **Japan**: `https://iptv-org.github.io/iptv/countries/jp.m3u`
- **India**: `https://iptv-org.github.io/iptv/countries/in.m3u`

### Category-Based Playlists
- **News Channels**: `https://iptv-org.github.io/iptv/categories/news.m3u`
- **Sports Channels**: `https://iptv-org.github.io/iptv/categories/sport.m3u`
- **Music Channels**: `https://iptv-org.github.io/iptv/categories/music.m3u`
- **Kids Channels**: `https://iptv-org.github.io/iptv/categories/kids.m3u`
- **Movies**: `https://iptv-org.github.io/iptv/categories/movies.m3u`

### Language-Based Playlists
- **English**: `https://iptv-org.github.io/iptv/languages/eng.m3u`
- **Spanish**: `https://iptv-org.github.io/iptv/languages/spa.m3u`
- **French**: `https://iptv-org.github.io/iptv/languages/fra.m3u`
- **German**: `https://iptv-org.github.io/iptv/languages/deu.m3u`

## How It Works

### M3U Parsing
The platform uses a custom M3U parser that:
- Extracts channel information from EXTINF lines
- Resolves relative URLs to absolute URLs
- Categorizes channels based on group titles
- Handles both M3U and M3U8 formats

### Video Streaming
- Uses HLS.js for HLS stream playback
- Falls back to native HLS support (Safari)
- Handles stream errors gracefully
- Supports fullscreen playback

### Data Storage
- Favorites are stored in browser localStorage
- No server required - runs entirely client-side
- All data stays on your device

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Troubleshooting

### Common Issues

**Channels showing as "Unknown Channel"?**
- This is likely due to CORS (Cross-Origin Resource Sharing) restrictions
- **Solution**: Run the app from a local server instead of opening the HTML file directly
- Use `python -m http.server 8000` or `npx http-server -p 8000`
- The app includes sample channels that will work regardless

**Channels not loading?**
- Check if the M3U URL is accessible
- Some playlists may be temporarily unavailable
- Try a different M3U URL
- Run from a local server to avoid CORS issues

**Video not playing?**
- Ensure your browser supports HLS
- Check your internet connection
- Some streams may be geo-restricted
- Try different channels as some streams may be offline

**Slow loading?**
- Large playlists may take time to load
- Check your internet speed
- Try refreshing the page
- The iptv-org main playlist contains 97k+ channels

### Error Messages

- **"Failed to load playlist"** - The M3U URL is not accessible
- **"HLS is not supported"** - Your browser doesn't support HLS streaming
- **"Network error"** - Connection issues or stream unavailable

## Technical Details

### File Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # Main application logic
├── m3u-parser.js      # M3U playlist parser
└── README.md          # This file
```

### Dependencies
- **HLS.js** - For HLS stream playback (loaded from CDN)
- **Font Awesome** - For icons (loaded from CDN)

### Features Implementation
- **M3U Parser**: Custom JavaScript class for parsing M3U playlists
- **Video Player**: HTML5 video with HLS.js integration
- **Search**: Client-side filtering and searching
- **Favorites**: localStorage-based persistence
- **Responsive Design**: CSS Grid and Flexbox

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this platform.

## License

This project is open source and available under the MIT License.

## Disclaimer

This platform is for educational purposes. Please respect copyright laws and only use content you have permission to access. The availability of free M3U playlists may vary, and some streams may not work due to geo-restrictions or other limitations.
