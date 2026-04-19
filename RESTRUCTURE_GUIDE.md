# Waste Not - Website Restructure Guide

## Overview
Your website has been restructured from a single-page experience with an overlay presentation to a multi-page site with a persistent navigation bar.

## New Page Structure

### 1. **Landing Page** (`landing.html`)
- **Entry point** for the website
- Features a banner/hero section with:
  - Brand name "Waste Not" (top left in navbar)
  - Navigation links (top right):
    - Why This Matters
    - About Us
    - Login
  - Call-to-action button to "Explore the Map"

### 2. **Why This Matters Page** (`why-this-matters.html`)
- **Contains the narrative/story content** that was previously shown as an overlay
- Story content is now displayed as a scrollable page with:
  - Each story step displayed one at a time
  - Previous/Next buttons to navigate through stories
  - Step counter (e.g., "1 of 12")
  - Keyboard navigation support (arrow keys)
- Imported story content from `story-content.js`

### 3. **Interactive Map Page** (`index.html`)
- **Main data visualization experience**
- Displays the fire map with:
  - Season filter controls
  - Brightness slider
  - Monthly brightness chart
  - All original interactive features
- Navigation bar links users back to other sections

### 4. **About Us Page** (`about-us.html`)
- **Organization information** (ready for your content)
- Template structure in place

### 5. **Login Page** (`login.html`)
- **User authentication interface** (ready for implementation)
- Basic form structure in place

## Navigation Bar (Across All Pages)
- **Fixed at the top** of every page with `position: sticky`
- **Brand name** (left side) - links back to landing page
- **Navigation links** (right side):
  - Why This Matters
  - About Us  
  - Login
- **Active state styling** - current page is highlighted in gold (#ffd166)

## File Changes Made

### New Files Created:
- `landing.html` - Landing page template
- `why-this-matters.html` - Narrative content page
- `about-us.html` - About page template
- `login.html` - Login page template
- `landing.js` - Landing page scripts
- `why-this-matters.js` - Story navigation logic
- `story-content.js` - Story/narrative data

### Modified Files:
- `style.css` - Added navbar, page layout, and new page styles
- `index.html` - Added navbar, removed presentation overlay
- `script.js` - Removed presentation overlay code, kept map functionality

## Styling

### Color Scheme (from original):
- Primary Green: `#2b7821` (Waste Not brand)
- Accent Red: `#ff6b6b` (CTAs and highlights)
- Gold: `#ffd166` (Active states)

### Responsive Design:
- Navigation bar is sticky and stays visible while scrolling
- Content containers are centered and responsive
- Maintains original dark map aesthetic on index.html

## User Journey

**Old Flow:**
1. User sees overlay presentation with "Why This Matters" button
2. Clicks to see story narration in sidebar
3. After completion, map is available

**New Flow:**
1. User lands on landing page
2. Can choose to:
   - Click "Explore the Map" to go directly to `index.html`
   - Click "Why This Matters" to read narrative at `why-this-matters.html`
   - Click "About Us" or "Login" for those sections
3. Navigation is always available across all pages

## Customization Points

### Landing Page (`landing.html`):
- Update the hero section tagline/description
- Customize CTA button text

### About Us Page (`about-us.html`):
- Add your organization's mission, team info, etc.

### Login Page (`login.html`):
- Connect to authentication backend
- Style as needed

### Story Content (`story-content.js`):
- All 12 story steps are defined here
- Edit titles, subtitles, and text as needed

## Next Steps

1. Fill in the "About Us" page content
2. Implement login functionality
3. Update landing page description/tagline if needed
4. Test navigation across all pages
5. Consider adding:
   - Footer with links
   - User account pages
   - Additional content sections
