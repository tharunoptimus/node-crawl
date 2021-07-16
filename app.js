const fetch = require("node-fetch");
const cheerio = require("cheerio");
const urlParser = require("url");

const seenUrls = {};

const getUrl = (link, host, protocol) => {
	if (link.includes("http")) {
		return link;
	} else if (link.startsWith("/")) {
		return `${protocol}//${host}${link}`;
	} else {
		return `${protocol}//${host}/${link}`;
	}
};

const crawl = async ({ url, ignore }) => {
	if (seenUrls[url]) return;
	seenUrls[url] = true;

	const { host, protocol } = urlParser.parse(url);

	const response = await fetch(url);
	const html = await response.text();
	const $ = cheerio.load(html);

	var title =
		$("title").text() !== undefined 
			? $("title").text() 
			: $("h1").text();

	var description =
		$('meta[name="description"]').attr("content") !== undefined
			? $('meta[name="description"]').attr("content")
			: $('meta[property="og:description"]').attr("content");

	var keywords =
		$('meta[name="keywords"]').attr("content") !== undefined
			? $('meta[name="keywords"]').attr("content")
			: $('meta[property="og:keywords"]').attr("content");

	console.log("Crawling URL: ", url);
	console.log("Title:        ", title);
	console.log("Description:  ", description);
	console.log("Keywords:     ", keywords);

	const links = $("a")
		.map((i, link) => link.attribs.href)
		.get();

	const imageUrls = $("img")
		.map((i, link) => link.attribs.src)
		.get();

	const imageAlt = $("img")
		.map((i, link) => link.attribs.alt)
		.get();

	if (imageUrls.length > 0) {
		console.log(imageUrls.length, " Images available in the page");
		for (let i = 0; i < imageUrls.length; i++) {
			let newImageUrl = getUrl(imageUrls[i], host, protocol);
			let newImageUrlAlt = imageAlt[i];
			console.log("Image URL: ", newImageUrl);
			console.log("Alt text: ", newImageUrlAlt !== undefined ? newImageUrlAlt : "No Info Available");
		}
	}

	links
		.filter((link) => link.includes(host) && !link.includes(ignore))
		.forEach((link) => {
			crawl({
				url: getUrl(link, host, protocol),
				ignore,
			});
		});
};

const readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout,
});

readline.question("Enter the link you want to crawl: ", (enteredUrl) => {
	readline.close();
	crawl({
		url: enteredUrl,
		ignore: "/search",
	});
});
