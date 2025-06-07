.PHONY: all clean generate help

# Default target
all: generate

# Generate all files from posts.json
generate: index.html rss.xml sitemap.xml

# Generate index.html from posts.json
index.html: posts.json generate.py
	@echo "Generating index.html..."
	python3 generate.py index

# Generate rss.xml from posts.json
rss.xml: posts.json generate.py
	@echo "Generating rss.xml..."
	python3 generate.py rss

# Generate sitemap.xml from posts.json
sitemap.xml: posts.json generate.py
	@echo "Generating sitemap.xml..."
	python3 generate.py sitemap

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -f index.html rss.xml sitemap.xml

# Show help
help:
	@echo "Available targets:"
	@echo "  all       - Generate all files (default)"
	@echo "  generate  - Generate all files from posts.json"
	@echo "  clean     - Remove generated files"
	@echo "  help      - Show this help message"
	@echo ""
	@echo "Files generated from posts.json:"
	@echo "  - index.html"
	@echo "  - rss.xml"
	@echo "  - sitemap.xml"

# Add a target to validate posts.json
validate:
	@echo "Validating posts.json..."
	python3 -m json.tool posts.json > /dev/null && echo "posts.json is valid JSON"

# Add a target to add a new post (interactive)
add-post:
	@echo "Adding new post..."
	@read -p "Post title: " title; \
	read -p "Post URL (starting with /): " url; \
	read -p "Post description: " description; \
	read -p "Post date (YYYY-MM-DD): " date; \
	echo "Note: You'll need to manually add this to posts.json:"; \
	echo "{"; \
	echo "  \"title\": \"$$title\","; \
	echo "  \"url\": \"$$url\","; \
	echo "  \"description\": \"$$description\","; \
	echo "  \"date\": \"$$date\","; \
	echo "  \"priority\": \"0.80\""; \
	echo "}"
