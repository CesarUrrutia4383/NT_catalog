# TODO: Fix Header Positioning Over Hero

## Tasks
- [x] Import responsive-unified.css in src/main.js to apply fixed header styles
- [x] Remove margin-top: 40px from header in src/css/header.css
- [x] Remove margin-top: 40px from header in src/css/responsive.css
- [x] Adjust hero section padding-top in src/css/hero.css if needed to accommodate fixed header
- [ ] Test the page to ensure header sticks to top over hero

## Notes
- The header should be position: fixed with top: 0 and z-index: 1000
- Hero section has z-index: 5, so header overlays it
- Ensure no vertical margins push header down
