"use strict"

/* ***** GLOBAL OBJECTS AND VARIABLES ***** */

const HeadlineGrid = document.getElementById("headlineGrid");
const HeadlineTitle = document.getElementById("headlineTitle");
const ArticleGrid = document.getElementById("articleGrid");
const articleTitle = document.getElementById("articleTitle");

let currentCategory = "";


const Query = {
    construct() {
        let request = `${this.APIUrl}${this.endpoint}?`;
        let iterable = this.filter;
        let isFirst = true;
        for (const property in iterable) {
            if (iterable[property] != "") {
                (isFirst ? isFirst = false : request += '&')
                request += `${property}=${iterable[property]}`;
            }
        }
        request += `&apikey=${this.keyList[4]}`;
        this.request = request;
    }
}

const QueryHeadlines = Object.create(Query);
Object.assign(QueryHeadlines, {
    request: "",
    APIUrl: "https://newsapi.org/v2/",
    endpoint: "top-headlines",
    keyList: ["c80cfc2928404db29d71bf9af9cdc196", "4469c333482345e5922480a57f05d07d", "ae4f0f8e31b3431aa4ba2b3e6021248e", "a0ee06128b16460588edb44cf7b96f3a", "b5e101338ce24b57b559e39f411f02fc"],
    filter: {
        category: "",
        country: "fr",
        language: "",
        sortby: "publishedAt",
        q: ""
    }
});

function getEarlierDate(date, interval = 7) {
    let earlierDate = new Date(date);
    earlierDate.setDate(earlierDate.getDate() - interval);
    return earlierDate;
}

let currentDate = new Date();
let earlierDate = getEarlierDate(currentDate);

const QueryEverything = Object.create(Query);
Object.assign(QueryEverything, {
    request: "",
    APIUrl: "https://newsapi.org/v2/",
    endpoint: "everything",
    keyList: ["c80cfc2928404db29d71bf9af9cdc196", "4469c333482345e5922480a57f05d07d", "ae4f0f8e31b3431aa4ba2b3e6021248e", "a0ee06128b16460588edb44cf7b96f3a", "b5e101338ce24b57b559e39f411f02fc"],
    filter: {
        language: "fr",
        sortby: "publishedAt",
        q: "Ukraine",
        from: extractDate(earlierDate, true),
        to: extractDate(currentDate, true),
        pageSize: 10
    }
});



/* ***** INPUTS AND EVENTS ***** */
const countrySelector = document.getElementById("country");

countrySelector.addEventListener("change", () => {
    QueryHeadlines.filter.country = countrySelector.value;
    QueryHeadlines.filter.language = "";
    updateHeadlines()
});

const categorySelector = document.getElementById("category");

categorySelector.addEventListener("change", () => {
    QueryHeadlines.filter.category = categorySelector.value;
    currentCategory = categorySelector.options[categorySelector.selectedIndex].text
    updateHeadlines()
});

const searchField = document.getElementById("searchField");
const searchButton = document.getElementById("searchButton");

searchField.addEventListener("keydown", (event) => {
    if (event.code == "Enter") {
        QueryHeadlines.filter.q = searchField.value;
        updateHeadlines();
        searchField.value = "";
    }
});
searchButton.addEventListener("click", () => {
    QueryHeadlines.filter.q = searchField.value;
    updateHeadlines();
    searchField.value = "";

});

const frButton = document.querySelector("#languageWrapper button:first-child");
const enButton = document.querySelector("#languageWrapper button:last-child");

frButton.addEventListener("click", () => {
    QueryHeadlines.filter.country = "";
    QueryHeadlines.filter.language = "fr";
    QueryEverything.filter.language = "fr";
    QueryEverything.filter.sortby = "publishedAt"
    updateHeadlines();
    updateNonHeadlines();
});
enButton.addEventListener("click", () => {
    QueryHeadlines.filter.country = "";
    QueryHeadlines.filter.language = "en";
    QueryEverything.filter.language = "en";
    QueryEverything.filter.sortby = "publishedAt"
    updateHeadlines();
    updateNonHeadlines();
});

/* ***** FUNCTIONS ***** */

async function updateHeadlines() {
    HeadlineGrid.textContent = "";
    QueryHeadlines.construct();
    try {
        let response = await fetch(QueryHeadlines.request);
        let dataHeadlines = await response.json();
        changeHeadlineTitle(dataHeadlines.articles);
        displayAllHeadlines(dataHeadlines.articles);
    } catch {
        HeadlineGrid.innerHTML = "<span>News API could not be reached</span>"
    }
    QueryHeadlines.filter.q = ""
};
async function updateNonHeadlines() {
    ArticleGrid.textContent = "";
    QueryEverything.construct();
    try {
        let response = await fetch(QueryEverything.request);
        let dataEverything = await response.json();
        displayAllArticles(dataEverything.articles);
    } catch {
        ArticleGrid.innerHTML = "<span>News API could not be reached</span>"
    }
};

function formatDateElements(dateElement) {
    return (dateElement.length == 1 ? `0${dateElement}` : dateElement);
}

function extractAuthor(article) {
    return (article.author != null ? article.author : "auteur non indiqué")
}

function extractDate(dateString, isSearchFormat = false) {
    let artDate = new Date(dateString);
    if (isSearchFormat) {
        return `${artDate.getFullYear()}-${formatDateElements(String(artDate.getMonth() + 1))}-${formatDateElements(String(artDate.getDate()))} ${formatDateElements(String(artDate.getHours()))}:${formatDateElements(String(artDate.getMinutes()))}`;
    } else {
        return `${artDate.getFullYear()}-${formatDateElements(String(artDate.getMonth() + 1))}-${formatDateElements(String(artDate.getDate()))}T${formatDateElements(String(artDate.getHours()))}:${formatDateElements(String(artDate.getMinutes()))}`;
    }
}

function createArticle(article) {
    let newArticleDiv = document.createElement("article");
    let newArticleHeader = document.createElement("header");
    let imageContainer = document.createElement("div");
    imageContainer.classList.add("imgContainer");
    let newArticleFooter = document.createElement("footer");


    let newArticleTitle = document.createElement("h4");
    newArticleTitle.textContent = article.title;

    let newArticleDate = document.createElement("span");
    newArticleDate.textContent = article.publishedAt;
    newArticleDate.textContent = extractDate(article.publishedAt, true);

    let newArticleAuthor = document.createElement("span");
    newArticleAuthor.textContent = extractAuthor(article);


    let newArticleDescription = document.createElement("p");
    newArticleDescription.textContent = article.description;


    let newArticleImage = document.createElement("img");
    newArticleImage.src = article.urlToImage;
    newArticleImage.alt = "aucune image associée";

    let newArticleSource = document.createElement("span");
    newArticleSource.textContent = article.source.name;

    let newArticleUrl = document.createElement("a");
    newArticleUrl.href = article.url;
    newArticleUrl.textContent = "consulter l'article"

    newArticleHeader.append(newArticleAuthor, newArticleDate)
    imageContainer.appendChild(newArticleImage);
    newArticleFooter.append(newArticleUrl, newArticleSource)

    newArticleDiv.append(newArticleHeader, imageContainer, newArticleTitle, newArticleDescription, newArticleFooter)
    return newArticleDiv;
}

function displayAllArticles(articles) {
    articles.forEach(article => {
        ArticleGrid.appendChild(createArticle(article));
    });
}

function displayAllHeadlines(articles) {
    articles.forEach(article => {
        HeadlineGrid.appendChild(createArticle(article));
    });
}
function changeHeadlineTitle(articleArray) {
    if (articleArray.length > 0) {
        HeadlineTitle.textContent = `Les ${articleArray.length} dernières actualités${getCountryMsg()}${getLanguageMsg()}${getCategoryMsg()}${getSearchMsg()}`
    } else {
        HeadlineTitle.textContent = `Aucune actualitée trouvée${getCountryMsg()}${getLanguageMsg()}${getCategoryMsg()}${getSearchMsg()}`
    }

}

function getCountryMsg() {
    switch (QueryHeadlines.filter.country) {

        case "fr":
            return " de médias français";
            break;
        case "gb":
            return " de médias anglais";
            break;
        case "us":
            return " de médias américains";
            break;
        default:
            return "";
    }
}

function getLanguageMsg() {
    switch (QueryHeadlines.filter.language) {
        case "fr":
            return " en français";
            break;
        case "en":
            return " en anglais";
            break;
        default:
            return "";
    }
}

function getCategoryMsg() {
    return (QueryHeadlines.filter.category == "" ? " toutes catégories confondues" : ` dans la catégorie ${currentCategory}`)
}

function getSearchMsg() {
    return (QueryHeadlines.filter.q == "" ? "" : ` pour les termes "${QueryHeadlines.filter.q}"`)
}
/* ***** INITIALIZATION ***** */

updateHeadlines();
updateNonHeadlines();
