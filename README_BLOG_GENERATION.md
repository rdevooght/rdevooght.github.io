# Blog Generation System

This repository contains an automated blog generation system that creates the main website files from a centralized JSON data source.

## Files Overview

- `posts.json` - Central data source containing all blog posts and site configuration
- `generate.py` - Python script that generates HTML, RSS, and sitemap files
- `Makefile` - Automation script for building the site
- `*.backup` - Backup copies of original files

## Generated Files

The following files are automatically generated from `posts.json`:

- `index.html` - Main blog homepage with post listings
- `rss.xml` - RSS feed for blog subscribers
- `sitemap.xml` - XML sitemap for search engines

## Usage

### Basic Generation

To generate all files:
```bash
make
# or
make generate
```

### Individual Commands

```bash
# Generate all files
python3 generate.py

# Validate JSON structure
make validate

# Clean generated files
make clean

# Show help
make help
```

## Adding New Posts

### Method 1: Interactive Helper
```bash
make add-post
```
This will prompt you for post details and show the JSON structure to add.

### Method 2: Manual Editing
Edit `posts.json` and add a new post object to the `posts` array:

```json
{
  "title": "Your Post Title",
  "url": "/your-post-url/",
  "description": "Brief description of your post",
  "date": "2025-06-07",
  "priority": "0.80"
}
```

**Important**: Posts should be ordered by date (newest first) in the JSON file.

## JSON Structure

### Site Configuration
```json
{
  "site": {
    "title": "Robin Devooght",
    "url": "https://blog.robindevooght.be",
    "description": "Des expériences en data science et data journalism",
    "language": "fr",
    "author": "Robin Devooght",
    "contact": "robin.devooght[at]mailo.com"
  }
}
```

### Post Structure
```json
{
  "title": "Post Title",
  "url": "/post-url/",
  "description": "Brief description",
  "date": "YYYY-MM-DD",
  "priority": "0.80"
}
```

### Page Structure
```json
{
  "title": "Page Title",
  "url": "/page-url.html",
  "priority": "0.80"
}
```

## Workflow

1. **Add new posts**: Edit `posts.json` to add new blog posts
2. **Generate files**: Run `make` to update all generated files
3. **Commit changes**: Commit both `posts.json` and generated files to Git
4. **Deploy**: Push to GitHub Pages (or your hosting platform)

## Date Formats

- **JSON**: Use ISO format `YYYY-MM-DD`
- **Display**: Automatically formatted to French format (e.g., "7 juin 2025")
- **RSS**: Automatically formatted to RFC 822 format
- **Sitemap**: Automatically formatted to ISO 8601 format

## Backup Files

Before first generation, the system creates backup copies:
- `index.html.backup`
- `rss.xml.backup`
- `sitemap.xml.backup`

These preserve your original files in case you need to revert changes.

## Dependencies

- Python 3.x (standard library only)
- Make (for automation)

## Customization

To modify the generated HTML structure, CSS, or other aspects:

1. Edit the templates in `generate.py`
2. Modify the site configuration in `posts.json`
3. Update CSS files in the `css/` directory as needed

## Troubleshooting

### JSON Validation Error
```bash
make validate
```
This will check if your `posts.json` file has valid JSON syntax.

### Missing Generated Files
If generated files are missing, run:
```bash
make clean
make generate
```

### Incorrect Dates
Ensure all dates in `posts.json` follow the `YYYY-MM-DD` format.

## Future Enhancements

Potential improvements to consider:
- Template system for more flexible HTML generation
- Image optimization and management
- Category/tag support
- Search functionality
- Multi-language support