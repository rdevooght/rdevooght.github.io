#!/usr/bin/env python3
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import sys


def load_posts_data():
    """Load posts data from JSON file"""
    with open("posts.json", "r", encoding="utf-8") as f:
        return json.load(f)


def format_date_french(date_str):
    """Format date in French format for display"""
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    months = {
        1: "janvier",
        2: "février",
        3: "mars",
        4: "avril",
        5: "mai",
        6: "juin",
        7: "juillet",
        8: "août",
        9: "septembre",
        10: "octobre",
        11: "novembre",
        12: "décembre",
    }
    return f"{date_obj.day} {months[date_obj.month]} {date_obj.year}"


def format_date_rfc822(date_str):
    """Format date for RSS (RFC 822)"""
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{days[date_obj.weekday()]}, {date_obj.day} {months[date_obj.month - 1]} {date_obj.year} 00:00:00 GMT"


def generate_index_html(data):
    """Generate index.html from posts data"""
    site = data["site"]
    posts = data["posts"]

    html = f'''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="{site["description"]}" />
    <meta name="author" content="{site["author"]}" />
    <title>{site["title"]}</title>
    <link href="css/reset.css" rel="stylesheet" />
    <link href="css/tachyons.min.css" rel="stylesheet" />
    <link href="css/style.css" rel="stylesheet" />
    <script
        defer
        src="https://app-static.sitesights.io/client.min.js?v=1"
        data-website-uid="_6m5fZ22OkGEghP2myQEDw"
    ></script>
    <script defer type="module">
        MDAL.pageView({{
            Absolute: null,
            ClientId: null,
        }});
    </script>
  </head>
  <body>

    <header class="pa3">
      <h1 class="f1 lh-solid">{site["title"]}</h1>
      <nav>
        <a href="index.html" class="f6 link dim br2 ph3 pv2 mb2 dib white bg-dark-blue">Blog</a></li>
        <a href="about.html" class="f6 link br2 ba ph3 pv2 mb2 dib dark-blue hover-white hover-bg-dark-blue">A propos</a>

      </nav>
    </header>
    <!-- Main Content-->
    <main class="pa3">
'''

    for i, post in enumerate(posts):
        border_class = "pv4 bt bb b--black-10" if i == 0 else "pv4 bb b--black-10"
        link_class = "no-underline navy link hover-dark-blue"

        html += f'''
      <article class="{border_class}">
        <a href="{post["url"]}" class="{link_class}">
          <h2 class="f3">{post["title"]}</h2>
          <h3 class="f4 normal">{post["description"]}</h3>
        </a>
        <p class="mt1 gray">
          Publié le {format_date_french(post["date"])}
        </p>
      </article>'''

    html += """
    </main>
    <!-- Footer-->
    <footer class="pa3 tc">
      <p>
        Contact: robin.devooght[at]mailo.com
      </p>
      <p class="mt2">
      <a href="rss.xml" class="link gold ph3 pv2 mb2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm1.5 2.5c5.523 0 10 4.477 10 10a1 1 0 1 1-2 0 8 8 0 0 0-8-8 1 1 0 0 1 0-2zm0 4a6 6 0 0 1 6 6 1 1 0 1 1-2 0 4 4 0 0 0-4-4 1 1 0 0 1 0-2zm.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
        </svg>
      </a>
      </p>
    </footer>
    <!-- Bootstrap core JS-->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  </body>
  <!-- Cloudflare Web Analytics -->
  <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "05b4282391484b1ba19c5fa3458aa5a6"}'></script>
  <!-- End Cloudflare Web Analytics -->
</html>
"""

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)


def generate_rss_xml(data):
    """Generate RSS XML from posts data"""
    site = data["site"]
    posts = data["posts"]

    rss = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss, "channel")

    ET.SubElement(channel, "title").text = site["title"]
    ET.SubElement(channel, "link").text = f"{site['url']}?utm_source=rss"
    ET.SubElement(channel, "description").text = site["description"]
    ET.SubElement(channel, "language").text = site["language"]
    ET.SubElement(channel, "docs").text = "https://www.rssboard.org/rss-specification"

    for post in posts:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = post["title"]
        ET.SubElement(item, "link").text = f"{site['url']}{post['url']}?utm_source=rss"
        ET.SubElement(item, "description").text = post["description"]
        ET.SubElement(item, "pubDate").text = format_date_rfc822(post["date"])

    # Format XML with proper indentation
    def indent(elem, level=0):
        i = "\n" + level * "   "
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = i + "   "
            if not elem.tail or not elem.tail.strip():
                elem.tail = i
            for elem in elem:
                indent(elem, level + 1)
            if not elem.tail or not elem.tail.strip():
                elem.tail = i
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = i

    indent(rss)

    xml_str = '<?xml version="1.0"?>\n' + ET.tostring(rss, encoding="unicode")

    with open("rss.xml", "w", encoding="utf-8") as f:
        f.write(xml_str)


def generate_sitemap_xml(data):
    """Generate sitemap XML from posts data"""
    site = data["site"]
    posts = data["posts"]
    pages = data.get("pages", [])

    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    # Add homepage
    url = ET.SubElement(urlset, "url")
    ET.SubElement(url, "loc").text = f"{site['url']}/"
    ET.SubElement(url, "lastmod").text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S+00:00")
    ET.SubElement(url, "priority").text = "1.00"

    # Add pages
    for page in pages:
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{site['url']}{page['url']}"
        ET.SubElement(url, "lastmod").text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S+00:00")
        ET.SubElement(url, "priority").text = page["priority"]

    # Add posts
    for post in posts:
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{site['url']}{post['url']}"
        ET.SubElement(url, "lastmod").text = f"{post['date']}T00:00:00+00:00"
        ET.SubElement(url, "priority").text = post["priority"]

    # Format XML with proper indentation
    def indent(elem, level=0):
        i = "\n" + level * ""
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = i + ""
            if not elem.tail or not elem.tail.strip():
                elem.tail = i
            for child in elem:
                indent(child, level + 1)
            if not elem.tail or not elem.tail.strip():
                elem.tail = i
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = i

    indent(urlset)

    xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n\n' + ET.tostring(urlset, encoding="unicode")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(xml_str)


def main():
    """Main function to generate all files"""
    data = load_posts_data()

    if len(sys.argv) == 1:
        print("Generating index.html...")
        generate_index_html(data)

        print("Generating rss.xml...")
        generate_rss_xml(data)

        print("Generating sitemap.xml...")
        generate_sitemap_xml(data)

    elif len(sys.argv) > 1:
        if "index" in sys.argv[1:]:
            print("Generating index.html...")
            generate_index_html(data)

        if "rss" in sys.argv[1:]:
            print("Generating rss.xml...")
            generate_rss_xml(data)

        if "sitemap" in sys.argv[1:]:
            print("Generating sitemap.xml...")
            generate_sitemap_xml(data)

    print("All files generated")


if __name__ == "__main__":
    main()
