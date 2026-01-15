import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import footnote_plugin from "markdown-it-footnote";

export default async function (eleventyConfig) {
  // Add markdown footnote plugin
  eleventyConfig.amendLibrary("md", (mdLib) => mdLib.use(footnote_plugin));

  // Copy static files
  eleventyConfig.addPassthroughCopy("posts/**/*.css");
  eleventyConfig.addPassthroughCopy("posts/**/*.js");
  eleventyConfig.addPassthroughCopy("posts/**/*.png");
  eleventyConfig.addPassthroughCopy("posts/**/*.jpg");
  eleventyConfig.addPassthroughCopy("posts/**/*.gif");
  eleventyConfig.addPassthroughCopy("posts/**/*.svg");

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Add custom filters for date formatting
  eleventyConfig.addFilter("formatDateFrench", function (dateString) {
    const date = new Date(dateString);
    const months = {
      0: "janvier",
      1: "février",
      2: "mars",
      3: "avril",
      4: "mai",
      5: "juin",
      6: "juillet",
      7: "août",
      8: "septembre",
      9: "octobre",
      10: "novembre",
      11: "décembre",
    };
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  eleventyConfig.addCollection("posts", (collection) => {
    const posts = collection.getAll()[0].data.posts;
    return posts.map((post) => ({
      url: post.url,
      data: { title: post.title, description: post.description },
      date: new Date(post.date),
    }));
  });

  eleventyConfig.addPlugin(feedPlugin, {
    collection: {
      name: "posts",
    },
  });

  return {
    dir: {
      input: ".", // Use current directory as input
      includes: "_includes", // Put shared templates here
      data: "_data", // Put global data here
      output: "_site", // Output to _site directory
    },
  };
}
