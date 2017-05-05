var rp = require('request-promise');
var async = require('async');

function scrapePage(page) {
    rp(page)
    .then(function (pageData) {
        pageData = JSON.parse(pageData);
        news = pageData.data;

        async.each(news, function(newsItem, callbackArticle) {
            var article = {};
            var title, articleUrl, author, imageUrl, publishedAt;
            var articleContent = [];

            title = newsItem.title;
            articleUrl = "https://www.gate15.be" + newsItem.uriPrefix + "/" + newsItem.slug;
            author = "gate15";
            publishedAt = newsItem.publishedAt;
            
            async.each(newsItem.snippets, function(snippet, callbackSnippet) {
                //only first type=media is the article pic
                if (snippet.type == "media" && !imageUrl) {
                    imageUrl = snippet.body.file[0].src;
                } else {
                    articleContent.push(snippet.body.text);
                }
                
                callbackSnippet();
            }, function() {
                /*console.log("title:",title);
                console.log("author:",author);
                console.log("articleUrl:",articleUrl);
                console.log("imageUrl:",imageUrl);
                console.log("publishedAt:",publishedAt);
                console.log("articleContent:",articleContent);*/
                
                article.title = title;
                article.author = author;
                article.articleUrl = articleUrl;
                article.imageUrl = imageUrl;
                article.publishedAt = publishedAt;
                article.articleContent = articleContent;

                console.log(article);

                console.log("");
                callbackArticle();
            });
        }, function() {
            console.log("Finished getting articles.");
        });

    })
    .catch(function (err) {
        // Crawling failed... 
    });

}

scrapePage("https://www.gate15.be/srv/content/d/content-type/10/start/0/limit/10/excluded_tags/trots");